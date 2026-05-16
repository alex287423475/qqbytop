import json

from tools.batch_report_tester import load_task_bank, summarize_task_bank, validate_task_bank
from tools.extract_gaokao_tasks import extract_tasks


def test_extract_gaokao_tasks_from_source_text(tmp_path) -> None:
    source = tmp_path / "真题.txt"
    source.write_text(
        "\n".join(
            [
                "2025 年高考英语作文真题 全国 Ⅰ 卷（新课标 Ⅰ 卷）",
                "考试时间：2025 年 6 月 8 日 试卷名称：全国新高考 Ⅰ 卷 题目：假定你是李华，请给外教写邮件说明你选择的班级报纸栏目及理由。 答题思路：略。",
                "考试时间：2025 年 6 月 8 日 试卷名称：上海高考英语卷 题目：以 “Technology and Our Life” 为题写一篇短文。 评分标准：略。",
            ]
        ),
        encoding="utf-8",
    )

    tasks = extract_tasks(source)

    assert len(tasks) == 2
    assert tasks[0]["id"] == "gaokao_2025_national_new_i_01"
    assert tasks[0]["task_type"] == "application_letter"
    assert tasks[0]["expected_word_count"] == "80-120 words"
    assert tasks[0]["source_use"] == "internal_quality_gate_only"
    assert tasks[1]["id"] == "gaokao_2025_shanghai_02"
    assert tasks[1]["task_type"] == "topic_essay"
    assert tasks[1]["expected_word_count"] == "100-130 words"


def test_generated_gaokao_tasks_jsonl_is_machine_readable() -> None:
    from pathlib import Path

    path = Path(__file__).resolve().parents[2] / "test_inputs" / "gaokao_tasks" / "gaokao_writing_tasks.jsonl"
    rows = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]

    assert len(rows) >= 10
    assert {"application_letter", "topic_essay"}.issubset({row["task_type"] for row in rows})
    assert all(row["source_use"] == "internal_quality_gate_only" for row in rows)


def test_task_bank_coverage_summary_is_quality_gate_ready() -> None:
    from pathlib import Path

    path = Path(__file__).resolve().parents[2] / "test_inputs" / "gaokao_tasks" / "gaokao_writing_tasks.jsonl"
    rows = load_task_bank(path)
    summary = summarize_task_bank(rows)

    assert validate_task_bank(rows) == []
    assert summary["count"] >= 10
    assert {"application_letter", "topic_essay"}.issubset(set(summary["task_types"]))
    assert any("上海" in paper for paper in summary["papers"])
    assert any("全国" in paper for paper in summary["papers"])
