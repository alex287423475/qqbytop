from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


DEFAULT_SOURCE = Path.home() / "Desktop" / "高考作文" / "真题.txt"
DEFAULT_OUTPUT = Path(__file__).resolve().parents[2] / "test_inputs" / "gaokao_tasks" / "gaokao_writing_tasks.jsonl"


TASK_PATTERN = re.compile(
    r"考试时间：(?P<date>[^\n]{0,40}?)试卷名称：(?P<paper>.*?)(?:题目：(?P<prompt>.*?))"
    r"(?=答题思路：|评分标准：|例文|考试时间：|\n\d{4}\s*年|$)",
    re.S,
)


def _normalize_spaces(value: str) -> str:
    return " ".join(value.split())


def _paper_slug(paper: str) -> str:
    mapping = {
        "全国新高考 Ⅰ 卷": "national_new_i",
        "全国新高考 Ⅱ 卷": "national_new_ii",
        "北京高考英语卷": "beijing",
        "上海高考英语卷": "shanghai",
        "天津高考英语卷": "tianjin",
    }
    for key, slug in mapping.items():
        if key in paper:
            return slug
    return re.sub(r"[^a-z0-9]+", "_", paper.lower()).strip("_") or "unknown"


def _classify_task(paper: str, prompt: str) -> tuple[str, str, list[str]]:
    if "读后续写" in prompt:
        return "continuation_writing", "about 150 words", ["continuation_plot", "coherence", "detail_expansion"]
    if "上海" in paper or "为题写一篇短文" in prompt:
        return "topic_essay", "100-130 words", ["argument_structure", "topic_focus", "cohesion"]
    if any(token in prompt for token in ["写邮件", "回信", "写一封信", "回复", "给"]):
        return "application_letter", "80-120 words", ["format_register", "key_points", "politeness"]
    return "application_writing", "100-120 words", ["task_completion", "logic", "language_accuracy"]


def extract_tasks(source: Path) -> list[dict]:
    text = source.read_text(encoding="utf-8", errors="replace")
    tasks: list[dict] = []
    seen: set[tuple[str, str, str]] = set()
    for match in TASK_PATTERN.finditer(text):
        date = _normalize_spaces(match.group("date"))
        paper = _normalize_spaces(match.group("paper"))
        prompt = _normalize_spaces(match.group("prompt"))
        if len(prompt) < 12:
            continue
        year_match = re.search(r"(\d{4})", date)
        year = int(year_match.group(1)) if year_match else None
        dedupe_key = (str(year), paper, prompt)
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        task_type, expected_word_count, test_focus = _classify_task(paper, prompt)
        slug = _paper_slug(paper)
        tasks.append(
            {
                "id": f"gaokao_{year or 'unknown'}_{slug}_{len(tasks) + 1:02d}",
                "year": year,
                "paper": paper,
                "task_type": task_type,
                "expected_word_count": expected_word_count,
                "task_prompt": prompt,
                "test_focus": test_focus,
                "source_file": source.name,
                "source_use": "internal_quality_gate_only",
                "notes": "用于质量闸门题型覆盖；不得作为公开范文或营销素材直接展示。",
            }
        )
    return tasks


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract structured gaokao writing tasks from a local source txt file.")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    tasks = extract_tasks(args.source)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8", newline="\n") as handle:
        for task in tasks:
            handle.write(json.dumps(task, ensure_ascii=False) + "\n")
    print(f"extracted={len(tasks)} output={args.output}")


if __name__ == "__main__":
    main()
