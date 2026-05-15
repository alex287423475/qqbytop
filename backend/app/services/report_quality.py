from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any

from app.models.schemas import FreeSummary, FullReport

BANNED_REPORT_TERMS = ["保证提分", "保分", "必得高分", "官方阅卷组", "官方阅卷老师", "人工逐篇批改", "最终得分"]
REQUIRED_GAOKAO_DIMENSIONS = {"content", "language", "structure", "cohesion", "format"}
REQUIRED_HIGHLIGHT_FIELDS = {"original", "category", "severity", "comment", "correction", "principle", "risk_note", "position_status"}
MIN_SAFE_REWRITE_WORDS = 40
MIN_ADVANCED_REWRITE_WORDS = 55


@dataclass(frozen=True)
class ReportQualityResult:
    score: int
    schema_ok: bool
    deductions: list[str]


class GeneratedReportQualityError(ValueError):
    pass


def _dump_text(value: Any) -> str:
    if hasattr(value, "model_dump"):
        value = value.model_dump(mode="json")
    return json.dumps(value, ensure_ascii=False, default=str)


def _english_word_count(value: str) -> int:
    return len(re.findall(r"[A-Za-z]+(?:[-'][A-Za-z]+)?", value or ""))


def _normalize_for_match(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip().lower()


def _as_dict(value: Any) -> dict[str, Any]:
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    return dict(value or {})


def score_generated_report_quality(essay_text: str, free_summary: FreeSummary | dict[str, Any], full_report: FullReport | dict[str, Any]) -> ReportQualityResult:
    free = _as_dict(free_summary)
    full = _as_dict(full_report)
    deductions: list[str] = []
    score = 0

    score_block = free.get("score") or {}
    if score_block.get("max") == 25 and isinstance(score_block.get("estimated"), int) and 0 <= score_block["estimated"] <= 25:
        score += 10
    else:
        deductions.append("score must be integer 0-25 with max=25")

    risks = free.get("top_risks") or []
    if len(risks) == 3 and all(item.get("type") and item.get("severity") and item.get("label") for item in risks if isinstance(item, dict)):
        score += 10
    else:
        deductions.append("free_summary.top_risks must contain exactly 3 risk summaries")

    if full.get("overall_review"):
        score += 5
    else:
        deductions.append("overall_review is missing")

    fatal_risks = full.get("fatal_risks") or []
    if len(fatal_risks) == 3 and all(item.get("title") and item.get("severity") and item.get("explanation") for item in fatal_risks if isinstance(item, dict)):
        score += 10
    else:
        deductions.append("fatal_risks must contain exactly 3 complete items")

    dimensions = full.get("gaokao_dimensions") or {}
    missing_dimensions = sorted(REQUIRED_GAOKAO_DIMENSIONS - set(dimensions))
    if not missing_dimensions:
        score += 10
    else:
        deductions.append(f"missing dimensions: {', '.join(missing_dimensions)}")

    spans = full.get("highlight_spans") or []
    if 3 <= len(spans) <= 8:
        score += 10
    else:
        deductions.append("highlight_spans count must be 3 to 8")

    essay_normalized = _normalize_for_match(essay_text)
    complete_spans = 0
    missing_aligned_originals: list[str] = []
    for index, span in enumerate(spans, 1):
        if all(str(span.get(field, "")).strip() for field in REQUIRED_HIGHLIGHT_FIELDS):
            complete_spans += 1
        if span.get("position_status") == "aligned":
            original = str(span.get("original", "")).strip()
            if original and _normalize_for_match(original) not in essay_normalized:
                missing_aligned_originals.append(f"span-{index}:{original[:40]}")
    if spans and complete_spans == len(spans):
        score += 15
    else:
        deductions.append("some highlight_spans miss required red-green fields")
    if not missing_aligned_originals:
        score += 10
    else:
        deductions.append(f"highlight original not found for aligned spans: {'; '.join(missing_aligned_originals)}")

    rewrites = full.get("rewrites") or {}
    safe_words = _english_word_count(str(rewrites.get("safe_version", "")))
    advanced_words = _english_word_count(str(rewrites.get("advanced_version", "")))
    if safe_words >= MIN_SAFE_REWRITE_WORDS and advanced_words >= MIN_ADVANCED_REWRITE_WORDS:
        score += 15
    else:
        deductions.append(f"rewrites too short: safe_words={safe_words}, advanced_words={advanced_words}")

    study_plan = full.get("study_plan") or []
    if len(study_plan) >= 3 and all(str(item.get("skill", "")).strip() and str(item.get("exercise", "")).strip() for item in study_plan if isinstance(item, dict)):
        score += 10
    else:
        deductions.append("study_plan must contain at least 3 executable items")

    advanced_phrases = full.get("advanced_phrases") or []
    if advanced_phrases:
        score += 5
    else:
        deductions.append("advanced_phrases is empty")

    text_blob = _dump_text({"free_summary": free, "full_report": full})
    banned_hits = [term for term in BANNED_REPORT_TERMS if term in text_blob]
    if not banned_hits:
        score += 5
    else:
        deductions.append(f"banned terms found: {', '.join(banned_hits)}")

    final_score = min(score, 100)
    return ReportQualityResult(score=final_score, schema_ok=not deductions, deductions=deductions)


def validate_generated_report_quality(essay_text: str, free_summary: FreeSummary, full_report: FullReport) -> None:
    result = score_generated_report_quality(essay_text, free_summary, full_report)
    if not result.schema_ok:
        raise GeneratedReportQualityError("; ".join(result.deductions))
