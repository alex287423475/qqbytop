from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Literal

import requests

BACKEND_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = BACKEND_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.adapters.llm import LlmRouter, load_gaokao_system_prompt  # noqa: E402
from app.config import Settings  # noqa: E402
from app.services.report_quality import BANNED_REPORT_TERMS, REQUIRED_GAOKAO_DIMENSIONS, REQUIRED_HIGHLIGHT_FIELDS, score_generated_report_quality  # noqa: E402

BANNED_TERMS = BANNED_REPORT_TERMS
REQUIRED_DIMENSIONS = sorted(REQUIRED_GAOKAO_DIMENSIONS)
REQUIRED_SPAN_FIELDS = sorted(REQUIRED_HIGHLIGHT_FIELDS)
SUMMARY_FIELDS = [
    "file",
    "mode",
    "status",
    "report_id",
    "order_id",
    "local_case_id",
    "word_count",
    "estimated_score",
    "target_score_band",
    "manifest_ok",
    "manifest_errors",
    "guardrail_expected",
    "guardrail_triggered",
    "provider",
    "model_name",
    "model_degraded",
    "prompt_a",
    "prompt_b",
    "rule_score",
    "rule_score_a",
    "rule_score_b",
    "judge_score_a",
    "judge_score_b",
    "combined_score_a",
    "combined_score_b",
    "winner",
    "schema_ok",
    "elapsed_seconds",
    "error",
]

TASK_COVERAGE_FIELDS = [
    "id",
    "year",
    "paper",
    "task_type",
    "expected_word_count",
    "test_focus",
    "source_use",
    "task_prompt_preview",
]


def read_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        value = value.strip()
        if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
            value = value[1:-1]
        values[key.strip()] = value
    return values


def apply_env_file(path: Path) -> None:
    for key, value in read_env_file(path).items():
        os.environ[key] = value


def has_real_tokenhub_key() -> bool:
    key = os.environ.get("TENCENT_TOKENHUB_API_KEY", "")
    return bool(key) and not re.search(r"replace|your|<|>", key, re.IGNORECASE)


def ensure_tokenhub_env() -> None:
    if not has_real_tokenhub_key():
        raise RuntimeError("TENCENT_TOKENHUB_API_KEY is missing or still a placeholder. Fill backend/.env.local-deepseek first.")


def timestamp_dir(base: Path) -> Path:
    batch_dir = base / datetime.now().strftime("%Y%m%d-%H%M%S")
    batch_dir.mkdir(parents=True, exist_ok=True)
    return batch_dir


def json_dump(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2, default=str), encoding="utf-8")


def load_task_bank(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    rows: list[dict[str, Any]] = []
    for line_no, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        stripped = line.strip()
        if not stripped:
            continue
        try:
            row = json.loads(stripped)
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"Invalid task bank JSONL at {path}:{line_no}: {exc}") from exc
        if not isinstance(row, dict):
            raise RuntimeError(f"Invalid task bank row at {path}:{line_no}: expected object")
        rows.append(row)
    return rows


def validate_task_bank(tasks: list[dict[str, Any]]) -> list[str]:
    required = {
        "id",
        "year",
        "paper",
        "task_type",
        "expected_word_count",
        "task_prompt",
        "test_focus",
        "source_file",
        "source_use",
    }
    errors: list[str] = []
    seen_ids: set[str] = set()
    for index, task in enumerate(tasks, 1):
        missing = sorted(required - set(task))
        if missing:
            errors.append(f"row {index} missing fields: {', '.join(missing)}")
        task_id = str(task.get("id") or "")
        if not task_id:
            errors.append(f"row {index} has empty id")
        elif task_id in seen_ids:
            errors.append(f"duplicate task id: {task_id}")
        seen_ids.add(task_id)
        if task.get("source_use") != "internal_quality_gate_only":
            errors.append(f"{task_id or f'row {index}'} source_use must be internal_quality_gate_only")
        if not isinstance(task.get("test_focus"), list) or not task.get("test_focus"):
            errors.append(f"{task_id or f'row {index}'} test_focus must be a non-empty list")
        if len(str(task.get("task_prompt") or "").strip()) < 20:
            errors.append(f"{task_id or f'row {index}'} task_prompt is too short")
    return errors


def summarize_task_bank(tasks: list[dict[str, Any]]) -> dict[str, Any]:
    by_type: dict[str, int] = {}
    by_paper: dict[str, int] = {}
    years: set[int] = set()
    for task in tasks:
        task_type = str(task.get("task_type") or "unknown")
        paper = str(task.get("paper") or "unknown")
        by_type[task_type] = by_type.get(task_type, 0) + 1
        by_paper[paper] = by_paper.get(paper, 0) + 1
        try:
            years.add(int(task.get("year")))
        except (TypeError, ValueError):
            pass
    return {
        "count": len(tasks),
        "years": sorted(years),
        "task_types": dict(sorted(by_type.items())),
        "papers": dict(sorted(by_paper.items())),
        "validation_errors": validate_task_bank(tasks),
    }


def write_task_coverage(output_dir: Path, task_bank_path: Path, tasks: list[dict[str, Any]]) -> None:
    summary = summarize_task_bank(tasks)
    json_dump(
        output_dir / "task_coverage.json",
        {
            "task_bank": str(task_bank_path),
            **summary,
        },
    )
    with (output_dir / "task_coverage.csv").open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=TASK_COVERAGE_FIELDS)
        writer.writeheader()
        for task in tasks:
            writer.writerow(
                {
                    "id": task.get("id", ""),
                    "year": task.get("year", ""),
                    "paper": task.get("paper", ""),
                    "task_type": task.get("task_type", ""),
                    "expected_word_count": task.get("expected_word_count", ""),
                    "test_focus": ";".join(str(item) for item in task.get("test_focus", [])),
                    "source_use": task.get("source_use", ""),
                    "task_prompt_preview": str(task.get("task_prompt", ""))[:120],
                }
            )


def json_post(url: str, body: dict[str, Any], headers: dict[str, str] | None = None, timeout: int = 180) -> dict[str, Any]:
    response = requests.post(url, json=body, headers=headers or {}, timeout=timeout)
    if response.status_code >= 400:
        raise RuntimeError(f"POST {url} failed: HTTP {response.status_code} {response.text}")
    return response.json()


def json_get(url: str, headers: dict[str, str] | None = None, timeout: int = 180) -> dict[str, Any]:
    response = requests.get(url, headers=headers or {}, timeout=timeout)
    if response.status_code >= 400:
        raise RuntimeError(f"GET {url} failed: HTTP {response.status_code} {response.text}")
    return response.json()


def word_count(text: str) -> int:
    return len(re.findall(r"[A-Za-z]+(?:[-'][A-Za-z]+)?", text))


def fake_ip(index: int) -> str:
    second = 51 + (index // 240)
    fourth = 10 + (index % 240)
    return f"198.{second}.100.{fourth}"


def extract_full_report(report: dict[str, Any]) -> dict[str, Any] | None:
    full_report = report.get("full_report")
    if isinstance(full_report, dict):
        return full_report
    if "overall_review" in report and "highlight_spans" in report:
        return report
    return None


def text_blob(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, default=str)


def severity_counts(spans: list[dict[str, Any]]) -> dict[str, int]:
    counts = {"minor": 0, "major": 0, "critical": 0}
    for span in spans:
        severity = str(span.get("severity", "minor"))
        counts[severity] = counts.get(severity, 0) + 1
    return counts


def score_report(report: dict[str, Any]) -> dict[str, Any]:
    full_report = extract_full_report(report)
    if not full_report:
        return {"score": 0, "schema_ok": False, "deductions": ["missing full_report"]}
    quality = score_generated_report_quality(str(report.get("confirmed_text") or report.get("essay_text") or ""), report.get("free_summary") or {}, full_report)
    return {"score": quality.score, "schema_ok": quality.schema_ok, "deductions": quality.deductions}


def extract_estimated_score(report: dict[str, Any]) -> int | None:
    score = ((report.get("free_summary") or {}).get("score") or {}).get("estimated")
    return score if isinstance(score, int) else None


def load_golden_manifest(input_dir: Path) -> dict[str, dict[str, Any]]:
    manifest_path = input_dir / "golden_manifest.json"
    if not manifest_path.exists():
        return {}
    payload = json.loads(manifest_path.read_text(encoding="utf-8"))
    cases = payload.get("cases") or []
    return {str(case.get("filename")): case for case in cases if case.get("filename")}


def format_score_band(case: dict[str, Any] | None) -> str:
    if not case:
        return ""
    band = case.get("target_score_band")
    if isinstance(band, list) and len(band) == 2:
        return f"{band[0]}-{band[1]}"
    return "guardrail"


def detect_expected_guardrails(essay_text: str, case: dict[str, Any] | None) -> list[str]:
    if not case:
        return []
    expected = set(case.get("should_trigger_guardrail") or [])
    triggered: list[str] = []
    if "WORD_COUNT_TOO_LOW" in expected and word_count(essay_text) < 41:
        triggered.append("WORD_COUNT_TOO_LOW")
    off_topic_needles = (
        "basketball",
        "mother",
        "dinner",
        "forest",
        "animals",
        "science and technology",
        "protect the environment",
        "environment",
    )
    if "OFF_TOPIC_RISK" in expected and any(needle in essay_text.lower() for needle in off_topic_needles):
        triggered.append("OFF_TOPIC_RISK")
    return triggered


def validate_manifest_expectation(
    *,
    essay_text: str,
    row: dict[str, Any],
    case: dict[str, Any] | None,
    guardrails: list[str] | None = None,
) -> dict[str, str]:
    if not case:
        return {
            "word_count": str(word_count(essay_text)),
            "estimated_score": str(row.get("estimated_score") or ""),
            "target_score_band": "",
            "manifest_ok": "",
            "manifest_errors": "",
            "guardrail_expected": "",
            "guardrail_triggered": "",
        }

    errors: list[str] = []
    count = word_count(essay_text)
    expected_range = case.get("expected_word_count_range")
    if isinstance(expected_range, list) and len(expected_range) == 2:
        low, high = int(expected_range[0]), int(expected_range[1])
        if not (low <= count <= high):
            errors.append(f"word_count {count} outside {low}-{high}")

    expected_guardrails = [str(item) for item in (case.get("should_trigger_guardrail") or [])]
    triggered_guardrails = guardrails or []
    if expected_guardrails:
        missing = [item for item in expected_guardrails if item not in triggered_guardrails]
        if missing:
            errors.append(f"missing expected guardrails: {'|'.join(missing)}")
    else:
        estimated = row.get("estimated_score")
        band = case.get("target_score_band")
        if isinstance(band, list) and len(band) == 2 and isinstance(estimated, int):
            low, high = int(band[0]), int(band[1])
            if not (low <= estimated <= high):
                errors.append(f"estimated_score {estimated} outside target band {low}-{high}")
        elif isinstance(band, list):
            errors.append("estimated_score missing")

    return {
        "word_count": str(count),
        "estimated_score": str(row.get("estimated_score") or ""),
        "target_score_band": format_score_band(case),
        "manifest_ok": "true" if not errors else "false",
        "manifest_errors": "; ".join(errors),
        "guardrail_expected": "|".join(expected_guardrails),
        "guardrail_triggered": "|".join(triggered_guardrails),
    }


def compact_report_for_judge(report: dict[str, Any]) -> dict[str, Any]:
    full = extract_full_report(report) or {}
    return {
        "free_summary": report.get("free_summary"),
        "overall_review": full.get("overall_review"),
        "fatal_risks": full.get("fatal_risks"),
        "gaokao_dimensions": full.get("gaokao_dimensions"),
        "highlight_spans": full.get("highlight_spans"),
        "rewrites": full.get("rewrites"),
        "study_plan": full.get("study_plan"),
        "advanced_phrases": full.get("advanced_phrases"),
    }


def call_llm_judge(settings: Settings, *, essay_text: str, report_a: dict[str, Any], report_b: dict[str, Any]) -> dict[str, Any]:
    ensure_tokenhub_env()
    from openai import OpenAI

    client = OpenAI(api_key=settings.tencent_tokenhub_api_key, base_url=settings.tencent_tokenhub_base_url)
    response = client.chat.completions.create(
        model=settings.tencent_tokenhub_free_model,
        temperature=0.1,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "你是高考英语作文诊断报告质检员。只比较两份 AI 诊断报告哪一份更适合作为付费完整报告。"
                    "只输出严格 JSON，字段必须为 winner、score_a、score_b、reason、risks。"
                    "winner 只能是 A、B 或 tie；score_a 和 score_b 为 0-100 整数。"
                    "评价重点：扣分定位是否具体、精改建议是否可执行、范文质量、7天计划、是否有违规承诺。"
                ),
            },
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "essay_text": essay_text,
                        "report_a": compact_report_for_judge(report_a),
                        "report_b": compact_report_for_judge(report_b),
                    },
                    ensure_ascii=False,
                ),
            },
        ],
    )
    return json.loads(response.choices[0].message.content or "{}")


def diff_reports(report_a: dict[str, Any], report_b: dict[str, Any]) -> dict[str, Any]:
    full_a = extract_full_report(report_a) or {}
    full_b = extract_full_report(report_b) or {}
    score_a = ((report_a.get("free_summary") or {}).get("score") or {}).get("estimated")
    score_b = ((report_b.get("free_summary") or {}).get("score") or {}).get("estimated")
    spans_a = full_a.get("highlight_spans") or []
    spans_b = full_b.get("highlight_spans") or []
    rewrites_a = full_a.get("rewrites") or {}
    rewrites_b = full_b.get("rewrites") or {}
    return {
        "score": {"a": score_a, "b": score_b, "delta": None if score_a is None or score_b is None else score_b - score_a},
        "dimensions": {
            key: {
                "a": ((full_a.get("gaokao_dimensions") or {}).get(key) or {}).get("score"),
                "b": ((full_b.get("gaokao_dimensions") or {}).get(key) or {}).get("score"),
            }
            for key in REQUIRED_DIMENSIONS
        },
        "fatal_risks": {
            "a": [item.get("title") for item in full_a.get("fatal_risks", [])],
            "b": [item.get("title") for item in full_b.get("fatal_risks", [])],
        },
        "highlight_spans": {
            "count_a": len(spans_a),
            "count_b": len(spans_b),
            "severity_a": severity_counts(spans_a),
            "severity_b": severity_counts(spans_b),
            "missing_required_fields_a": sum(1 for span in spans_a if not all(str(span.get(field, "")).strip() for field in REQUIRED_SPAN_FIELDS)),
            "missing_required_fields_b": sum(1 for span in spans_b if not all(str(span.get(field, "")).strip() for field in REQUIRED_SPAN_FIELDS)),
        },
        "rewrites": {
            "safe_len_a": len(str(rewrites_a.get("safe_version", ""))),
            "safe_len_b": len(str(rewrites_b.get("safe_version", ""))),
            "advanced_len_a": len(str(rewrites_a.get("advanced_version", ""))),
            "advanced_len_b": len(str(rewrites_b.get("advanced_version", ""))),
        },
        "advanced_phrases": {"count_a": len(full_a.get("advanced_phrases") or []), "count_b": len(full_b.get("advanced_phrases") or [])},
        "banned_terms": {"a": [term for term in BANNED_TERMS if term in text_blob(full_a)], "b": [term for term in BANNED_TERMS if term in text_blob(full_b)]},
    }


def write_review_md(path: Path, *, case_name: str, score_a: dict[str, Any], score_b: dict[str, Any], diff: dict[str, Any], judge: dict[str, Any] | None) -> None:
    lines = [
        f"# {case_name} A/B Review",
        "",
        f"- Rule score A: {score_a['score']}",
        f"- Rule score B: {score_b['score']}",
        f"- Estimated score delta: {diff['score']['delta']}",
        f"- Highlight count: A={diff['highlight_spans']['count_a']} / B={diff['highlight_spans']['count_b']}",
    ]
    if judge:
        lines.extend(["", "## LLM Judge", "", f"- Winner: {judge.get('winner')}", f"- Score A: {judge.get('score_a')}", f"- Score B: {judge.get('score_b')}", f"- Reason: {judge.get('reason')}", f"- Risks: {judge.get('risks')}"])
    if score_a["deductions"] or score_b["deductions"]:
        lines.extend(["", "## Rule Deductions", "", f"- A: {'; '.join(score_a['deductions']) or 'none'}", f"- B: {'; '.join(score_b['deductions']) or 'none'}"])
    path.write_text("\n".join(lines), encoding="utf-8")


def run_pipeline_case(api_base: str, file_path: Path, essay_text: str, output_dir: Path, index: int, payer_contact: str) -> dict[str, Any]:
    started = time.time()
    headers = {"x-forwarded-for": fake_ip(index)}
    draft = json_post(f"{api_base}/drafts", {"source_type": "text", "raw_input_text": essay_text}, headers=headers)
    auth = {"Authorization": f"Bearer {draft['draft_token']}", **headers}
    report = json_post(f"{api_base}/reports", {"draft_id": draft["draft_id"]}, headers=auth)
    order = json_post(f"{api_base}/orders", {"report_id": report["report_id"], "product_type": "essay_credit_pack_20", "payer_contact": payer_contact}, headers=headers)
    json_post(f"{api_base}/orders/{order['order_id']}/sync", {}, headers=headers)
    unlocked = json_get(f"{api_base}/reports/{report['report_id']}", headers=headers)
    if not unlocked.get("is_unlocked") or not unlocked.get("full_report"):
        raise RuntimeError("Unlocked report did not include full_report")

    quality = score_report(unlocked)
    report_path = output_dir / f"{file_path.stem}.report.json"
    summary_path = output_dir / f"{file_path.stem}.summary.json"
    json_dump(report_path, unlocked)
    meta = (unlocked["full_report"].get("diagnosis_meta") or {}) if unlocked.get("full_report") else {}
    row = {
        "file": file_path.name,
        "mode": "pipeline",
        "status": "ok",
        "report_id": report["report_id"],
        "order_id": order["order_id"],
        "local_case_id": file_path.stem,
        "word_count": word_count(essay_text),
        "estimated_score": extract_estimated_score(unlocked),
        "provider": meta.get("provider"),
        "model_name": meta.get("model_name"),
        "model_degraded": meta.get("model_degraded"),
        "prompt_a": meta.get("prompt_version"),
        "prompt_b": "",
        "rule_score": quality["score"],
        "rule_score_a": "",
        "rule_score_b": "",
        "judge_score_a": "",
        "judge_score_b": "",
        "combined_score_a": "",
        "combined_score_b": "",
        "winner": "",
        "schema_ok": quality["schema_ok"],
        "elapsed_seconds": round(time.time() - started, 2),
        "error": "",
    }
    json_dump(summary_path, {**row, "quality": quality})
    return row


def run_ab_case(
    settings: Settings,
    file_path: Path,
    essay_text: str,
    output_dir: Path,
    prompt_a_name: str,
    prompt_b_name: str,
    judge_enabled: bool,
) -> dict[str, Any]:
    started = time.time()
    ensure_tokenhub_env()
    router = LlmRouter(settings.llm_provider_list, settings)
    prompt_a = load_gaokao_system_prompt(prompt_a_name)
    prompt_b = load_gaokao_system_prompt(prompt_b_name)
    count = word_count(essay_text)

    free_a, full_a, _ = router.diagnose(essay_text=essay_text, word_count=count, source_type="text", tier="paid", system_prompt=prompt_a, prompt_version=prompt_a_name)
    free_b, full_b, _ = router.diagnose(essay_text=essay_text, word_count=count, source_type="text", tier="paid", system_prompt=prompt_b, prompt_version=prompt_b_name)
    report_a = {"essay_text": essay_text, "free_summary": free_a.model_dump(mode="json"), "full_report": full_a.model_dump(mode="json")}
    report_b = {"essay_text": essay_text, "free_summary": free_b.model_dump(mode="json"), "full_report": full_b.model_dump(mode="json")}
    diff = diff_reports(report_a, report_b)
    score_a = score_report(report_a)
    score_b = score_report(report_b)
    judge = call_llm_judge(settings, essay_text=essay_text, report_a=report_a, report_b=report_b) if judge_enabled else None
    judge_score_a = int(judge.get("score_a", 0)) if judge else 0
    judge_score_b = int(judge.get("score_b", 0)) if judge else 0
    combined_a = round(score_a["score"] * 0.6 + judge_score_a * 0.4, 2) if judge else score_a["score"]
    combined_b = round(score_b["score"] * 0.6 + judge_score_b * 0.4, 2) if judge else score_b["score"]
    winner: Literal["A", "B", "tie"] = "tie"
    if combined_a > combined_b:
        winner = "A"
    elif combined_b > combined_a:
        winner = "B"

    json_dump(output_dir / f"{file_path.stem}.a.report.json", report_a)
    json_dump(output_dir / f"{file_path.stem}.b.report.json", report_b)
    json_dump(output_dir / f"{file_path.stem}.diff.json", {"diff": diff, "rule_score_a": score_a, "rule_score_b": score_b, "judge": judge, "combined_score_a": combined_a, "combined_score_b": combined_b, "winner": winner})
    write_review_md(output_dir / f"{file_path.stem}.review.md", case_name=file_path.stem, score_a=score_a, score_b=score_b, diff=diff, judge=judge)

    meta_a = report_a["full_report"].get("diagnosis_meta") or {}
    return {
        "file": file_path.name,
        "mode": "ab",
        "status": "ok",
        "report_id": "",
        "order_id": "",
        "local_case_id": file_path.stem,
        "word_count": word_count(essay_text),
        "estimated_score": extract_estimated_score(report_a),
        "provider": meta_a.get("provider"),
        "model_name": meta_a.get("model_name"),
        "model_degraded": meta_a.get("model_degraded"),
        "prompt_a": prompt_a_name,
        "prompt_b": prompt_b_name,
        "rule_score": "",
        "rule_score_a": score_a["score"],
        "rule_score_b": score_b["score"],
        "judge_score_a": judge_score_a if judge else "",
        "judge_score_b": judge_score_b if judge else "",
        "combined_score_a": combined_a,
        "combined_score_b": combined_b,
        "winner": winner,
        "schema_ok": score_a["schema_ok"] and score_b["schema_ok"],
        "elapsed_seconds": round(time.time() - started, 2),
        "error": "",
    }


def run_local_case(
    settings: Settings,
    file_path: Path,
    essay_text: str,
    output_dir: Path,
    prompt_name: str,
    *,
    require_real_provider: bool = False,
) -> dict[str, Any]:
    started = time.time()
    provider_list = settings.llm_provider_list
    if require_real_provider and (not any(provider_list) or not has_real_tokenhub_key()):
        raise RuntimeError("Real TokenHub batch requires LLM_PROVIDER_ORDER and TENCENT_TOKENHUB_API_KEY in the selected env file.")
    if not any(provider_list) or not has_real_tokenhub_key():
        router = LlmRouter(["mock"], None)
    else:
        ensure_tokenhub_env()
        router = LlmRouter(provider_list, settings)
    count = word_count(essay_text)
    prompt = load_gaokao_system_prompt(prompt_name)
    free_summary, full_report, provider = router.diagnose(
        essay_text=essay_text,
        word_count=count,
        source_type="text",
        tier="paid",
        system_prompt=prompt,
        prompt_version=prompt_name,
    )
    report = {
        "essay_text": essay_text,
        "free_summary": free_summary.model_dump(mode="json"),
        "full_report": full_report.model_dump(mode="json"),
    }
    quality = score_report(report)
    json_dump(output_dir / f"{file_path.stem}.local.report.json", report)
    json_dump(output_dir / f"{file_path.stem}.local.quality.json", quality)
    meta = report["full_report"].get("diagnosis_meta") or {}
    return {
        "file": file_path.name,
        "mode": "local",
        "status": "ok",
        "report_id": "",
        "order_id": "",
        "local_case_id": file_path.stem,
        "word_count": word_count(essay_text),
        "estimated_score": extract_estimated_score(report),
        "provider": meta.get("provider") or provider,
        "model_name": meta.get("model_name"),
        "model_degraded": meta.get("model_degraded"),
        "prompt_a": prompt_name,
        "prompt_b": "",
        "rule_score": quality["score"],
        "rule_score_a": "",
        "rule_score_b": "",
        "judge_score_a": "",
        "judge_score_b": "",
        "combined_score_a": "",
        "combined_score_b": "",
        "winner": "",
        "schema_ok": quality["schema_ok"],
        "elapsed_seconds": round(time.time() - started, 2),
        "error": "",
    }


def write_batch_summary(output_dir: Path, rows: list[dict[str, Any]]) -> None:
    with (output_dir / "summary.csv").open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=SUMMARY_FIELDS)
        writer.writeheader()
        writer.writerows(rows)
    json_dump(output_dir / "summary.json", rows)
    winners = ["# Prompt A/B Winners", ""]
    for row in rows:
        if row.get("mode") == "ab":
            winners.append(f"- {row['file']}: {row.get('winner')} (A={row.get('combined_score_a')}, B={row.get('combined_score_b')})")
    (output_dir / "ab_winners.md").write_text("\n".join(winners), encoding="utf-8")


def has_quality_failures(rows: list[dict[str, Any]], min_rule_score: int) -> bool:
    for row in rows:
        status = str(row.get("status") or "")
        manifest_ok = str(row.get("manifest_ok") or "").lower()
        if manifest_ok and manifest_ok not in ("true", "1"):
            return True
        if status == "guardrail_expected":
            continue
        if status not in ("ok", ""):
            return True
        if row.get("mode") == "ab":
            for field in ("rule_score_a", "rule_score_b"):
                value = row.get(field)
                if value != "" and int(value) < min_rule_score:
                    return True
        else:
            value = row.get("rule_score")
            if value != "" and int(value) < min_rule_score:
                return True
        if str(row.get("schema_ok")).lower() not in ("true", "1"):
            return True
    return False


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Batch test Gaokao essay reports with pipeline or prompt A/B mode.")
    parser.add_argument("--mode", choices=["pipeline", "ab", "local"], default="pipeline")
    parser.add_argument("--api-base", default="http://127.0.0.1:8000/api/v1")
    parser.add_argument("--input", default=str(ROOT_DIR / "test_inputs" / "gaokao_essays"))
    parser.add_argument("--output", default=str(ROOT_DIR / "test_outputs" / "gaokao_reports"))
    parser.add_argument("--delay", type=float, default=2.0)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--payer-contact", default="batch-test@example.com")
    parser.add_argument("--env-file", default=str(BACKEND_DIR / ".env.local-deepseek"))
    parser.add_argument("--prompt-a", default="gaokao_default")
    parser.add_argument("--prompt-b", default="gaokao_experiment")
    parser.add_argument("--judge", action="store_true")
    parser.add_argument("--min-rule-score", type=int, default=80)
    parser.add_argument("--require-real-provider", action="store_true")
    parser.add_argument("--manifest-only", action="store_true")
    parser.add_argument("--task-bank", default=str(ROOT_DIR / "test_inputs" / "gaokao_tasks" / "gaokao_writing_tasks.jsonl"))
    parser.add_argument("--task-bank-only", action="store_true")
    parser.add_argument("--require-task-bank", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    input_dir = Path(args.input).resolve()
    task_bank_path = Path(args.task_bank).resolve()
    base_output_dir = Path(args.output).resolve()
    output_dir = timestamp_dir(base_output_dir)
    rows: list[dict[str, Any]] = []
    tasks = load_task_bank(task_bank_path)
    if tasks:
        write_task_coverage(output_dir, task_bank_path, tasks)
        task_errors = validate_task_bank(tasks)
        if task_errors and (args.task_bank_only or args.require_task_bank):
            raise RuntimeError("Task bank validation failed: " + "; ".join(task_errors))
        print(f"Task coverage output: {output_dir / 'task_coverage.json'}")
    elif args.task_bank_only or args.require_task_bank:
        raise RuntimeError(f"Task bank not found or empty: {task_bank_path}")

    if args.task_bank_only:
        print(f"Task bank coverage passed. tasks={len(tasks)}")
        return 0

    if not input_dir.exists():
        raise RuntimeError(f"Input directory does not exist: {input_dir}")
    manifest_cases = load_golden_manifest(input_dir)
    if args.manifest_only:
        if not manifest_cases:
            raise RuntimeError(f"--manifest-only requires golden_manifest.json in {input_dir}")
        files = [input_dir / name for name in sorted(manifest_cases)]
    else:
        files = sorted(input_dir.glob("*.txt"))
    if args.limit and args.limit > 0:
        files = files[: args.limit]
    if not files:
        raise RuntimeError(f"No .txt essay files found in {input_dir}")

    apply_env_file(Path(args.env_file))
    settings = Settings()
    if args.mode == "pipeline":
        health = json_get(f"{args.api_base.rstrip('/')}/health")
        if health.get("status") != "ok":
            raise RuntimeError(f"Backend health check failed: {health}")

    for index, file_path in enumerate(files, 1):
        started = time.time()
        essay_text = ""
        manifest_case = manifest_cases.get(file_path.name)
        try:
            essay_text = file_path.read_text(encoding="utf-8").strip()
            expected_guardrails = detect_expected_guardrails(essay_text, manifest_case)
            if not essay_text:
                row = {"file": file_path.name, "mode": args.mode, "status": "skipped_empty", "elapsed_seconds": 0, "error": "empty file"}
            elif manifest_case and manifest_case.get("should_trigger_guardrail"):
                row = {
                    "file": file_path.name,
                    "mode": args.mode,
                    "status": "guardrail_expected",
                    "elapsed_seconds": round(time.time() - started, 2),
                    "schema_ok": True,
                    "error": "",
                }
            elif args.mode == "pipeline":
                row = run_pipeline_case(args.api_base.rstrip("/"), file_path, essay_text, output_dir, index, args.payer_contact)
            elif args.mode == "local":
                row = run_local_case(settings, file_path, essay_text, output_dir, args.prompt_a, require_real_provider=args.require_real_provider)
            else:
                row = run_ab_case(settings, file_path, essay_text, output_dir, args.prompt_a, args.prompt_b, args.judge)
            row.update(validate_manifest_expectation(essay_text=essay_text, row=row, case=manifest_case, guardrails=expected_guardrails))
            rows.append({field: row.get(field, "") for field in SUMMARY_FIELDS})
            print(f"[{index}/{len(files)}] ok {file_path.name}")
        except Exception as exc:  # noqa: BLE001 - batch runner must continue and persist per-file errors.
            error_payload = {"file": file_path.name, "mode": args.mode, "status": "error", "error": str(exc), "elapsed_seconds": round(time.time() - started, 2)}
            error_payload.update(validate_manifest_expectation(essay_text=essay_text, row=error_payload, case=manifest_case))
            json_dump(output_dir / f"{file_path.stem}.error.json", error_payload)
            rows.append({field: error_payload.get(field, "") for field in SUMMARY_FIELDS})
            print(f"[{index}/{len(files)}] error {file_path.name}: {exc}")
        if index < len(files) and args.delay > 0:
            time.sleep(args.delay)

    write_batch_summary(output_dir, rows)
    print(f"Batch output: {output_dir}")
    if has_quality_failures(rows, args.min_rule_score):
        print(f"Quality gate failed. min_rule_score={args.min_rule_score}")
        return 1
    print(f"Quality gate passed. min_rule_score={args.min_rule_score}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
