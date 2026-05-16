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
KNOWN_TAXONOMY_IDS = {
    # Legacy free-summary buckets kept for compatibility. Paid highlight spans
    # should still use precise taxonomy ids or Chinese equivalents.
    "content",
    "language",
    "logic",
    "task_deviation",
    "missing_key_points",
    "format_element_missing",
    "audience_register_mismatch",
    "key_point_underdeveloped",
    "contradiction",
    "off_topic_filler",
    "paragraph_disorder",
    "topic_sentence_missing",
    "weak_cohesion",
    "connector_misuse",
    "transition_gap",
    "template_stacking",
    "run_on_or_fragment",
    "collocation_error",
    "preposition_error",
    "spelling_error",
    "word_form_error",
    "word_choice_imprecision",
    "idiom_or_phrase_misuse",
    "countability_error",
    "article_error",
    "chinglish_literal_translation",
    "redundant_expression",
    "tense_error",
    "voice_error",
    "subject_verb_agreement",
    "pronoun_reference_error",
    "clause_structure_error",
    "verb_pattern_error",
    "sentence_pattern_transfer",
    "modifier_error",
    "parallelism_error",
    "nonfinite_clause_error",
    "punctuation_capitalization_error",
    "simple_sentence_overuse",
    "vague_basic_vocabulary",
    "forced_advanced_expression",
    "mechanical_advanced_wording",
    "weak_register",
    "tone_inappropriateness",
    "invitation_letter_missing_invite",
    "invitation_letter_missing_details",
    "suggestion_letter_weak_advice",
    "speech_no_audience_address",
    "notice_missing_action_info",
    "article_or_submission_weak_title_focus",
    "traditional_culture_superficial",
    "continuation_plot_incoherence",
    "continuation_emotion_flat",
    "band_0_10_structure_collapse",
    "band_11_14_chinglish_dense",
    "band_15_18_complex_attempt_failure",
    "band_19_21_plain_but_correct",
    "band_21_25_minor_flaws_only",
    "guardrail_underlength_or_offtopic",
}
SCORE_CALIBRATION_IDS = {
    "band_0_10_structure_collapse": (0, 10),
    "band_11_14_chinglish_dense": (11, 14),
    "band_15_18_complex_attempt_failure": (15, 18),
    "band_19_21_plain_but_correct": (19, 21),
    "band_21_25_minor_flaws_only": (21, 25),
    "guardrail_underlength_or_offtopic": (0, 10),
}

# Chinese-equivalent signal words are deliberately broad. The prompt asks the
# model to prefer taxonomy ids, but allows precise Chinese equivalents in paid
# reports, so the quality gate should reject vague labels without requiring an
# English id in every span.
TAXONOMY_SIGNAL_WORDS = (
    "\u5ba1\u9898",
    "\u8981\u70b9",
    "\u683c\u5f0f",
    "\u5bf9\u8c61",
    "\u8bed\u6c14",
    "\u8dd1\u9898",
    "\u5185\u5bb9",
    "\u8bba\u8bc1",
    "\u7ed3\u6784",
    "\u6bb5\u843d",
    "\u4e3b\u9898\u53e5",
    "\u903b\u8f91",
    "\u8854\u63a5",
    "\u8fde\u63a5",
    "\u8fc7\u6e21",
    "\u6a21\u677f",
    "\u4e2d\u5f0f",
    "\u642d\u914d",
    "\u4ecb\u8bcd",
    "\u62fc\u5199",
    "\u8bcd\u5f62",
    "\u8bcd\u4e49",
    "\u8bcd\u6c47",
    "\u51a0\u8bcd",
    "\u65f6\u6001",
    "\u8bed\u6001",
    "\u4e3b\u8c13",
    "\u4ece\u53e5",
    "\u52a8\u8bcd",
    "\u975e\u8c13\u8bed",
    "\u6807\u70b9",
    "\u5927\u5c0f\u5199",
    "\u53e5\u5f0f",
    "\u8868\u8fbe",
    "\u5347\u7ea7",
    "\u9080\u8bf7",
    "\u901a\u77e5",
    "\u6f14\u8bb2",
    "\u6295\u7a3f",
    "\u7eed\u5199",
    "\u4f20\u7edf\u6587\u5316",
)
TASK_CONTEXT_SIGNAL_WORDS = (
    "\u5ba1\u9898",
    "\u8981\u70b9",
    "\u683c\u5f0f",
    "\u8bed\u6c14",
    "\u5bf9\u8c61",
    "\u8dd1\u9898",
    "\u9080\u8bf7",
    "\u65f6\u95f4",
    "\u5730\u70b9",
    "\u6d3b\u52a8",
    "\u56de\u590d",
    "\u901a\u77e5",
    "\u6f14\u8bb2",
    "\u6295\u7a3f",
    "\u7eed\u5199",
)


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


def _original_is_locatable(essay_normalized: str, original: str) -> bool:
    normalized = _normalize_for_match(original)
    if not normalized:
        return False
    if normalized in essay_normalized:
        return True
    if "..." not in normalized and "…" not in normalized:
        return False

    parts = [part.strip(" .…") for part in re.split(r"\.{3,}|…", normalized)]
    meaningful_parts = [part for part in parts if len(part) >= 8]
    return bool(meaningful_parts) and all(part in essay_normalized for part in meaningful_parts)


def _as_dict(value: Any) -> dict[str, Any]:
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    return dict(value or {})


def _text_contains_any(value: str, needles: tuple[str, ...]) -> bool:
    return any(needle in value for needle in needles)


def _taxonomy_like(value: str) -> bool:
    normalized = str(value or "").strip()
    if not normalized:
        return False
    if normalized in KNOWN_TAXONOMY_IDS:
        return True
    return _text_contains_any(normalized, TAXONOMY_SIGNAL_WORDS)


def _collect_categories(free: dict[str, Any], full: dict[str, Any]) -> set[str]:
    categories: set[str] = set()
    for risk in free.get("top_risks") or []:
        if isinstance(risk, dict) and risk.get("type"):
            categories.add(str(risk["type"]).strip())
    for span in full.get("highlight_spans") or []:
        if isinstance(span, dict) and span.get("category"):
            categories.add(str(span["category"]).strip())
    return {category for category in categories if category}


def _task_context_was_provided(full: dict[str, Any]) -> bool:
    meta = full.get("diagnosis_meta") or {}
    if not isinstance(meta, dict):
        return False
    return bool(meta.get("task_context_provided") or meta.get("task_prompt") or meta.get("task_type") not in (None, "", "unknown"))


def _report_has_task_context_signal(free: dict[str, Any], full: dict[str, Any]) -> bool:
    categories = _collect_categories(free, full)
    if categories & {
        "task_deviation",
        "missing_key_points",
        "format_element_missing",
        "audience_register_mismatch",
        "key_point_underdeveloped",
        "off_topic_filler",
        "invitation_letter_missing_invite",
        "invitation_letter_missing_details",
        "suggestion_letter_weak_advice",
        "speech_no_audience_address",
        "notice_missing_action_info",
        "article_or_submission_weak_title_focus",
        "traditional_culture_superficial",
        "continuation_plot_incoherence",
        "continuation_emotion_flat",
    }:
        return True
    task_blob = _dump_text(
        {
            "top_risks": free.get("top_risks"),
            "fatal_risks": full.get("fatal_risks"),
            "highlight_spans": full.get("highlight_spans"),
            "logic_map": full.get("logic_map"),
            "overall_review": full.get("overall_review"),
        }
    )
    return _text_contains_any(task_blob, TASK_CONTEXT_SIGNAL_WORDS)


def _score_calibration_deductions(estimated_score: int | None, categories: set[str]) -> list[str]:
    if estimated_score is None:
        return []
    deductions: list[str] = []
    for category in categories:
        band = SCORE_CALIBRATION_IDS.get(category)
        if not band:
            continue
        low, high = band
        if not (low <= estimated_score <= high):
            deductions.append(f"score calibration tag {category} mismatches estimated score {estimated_score}")
    return deductions


def score_generated_report_quality(essay_text: str, free_summary: FreeSummary | dict[str, Any], full_report: FullReport | dict[str, Any]) -> ReportQualityResult:
    free = _as_dict(free_summary)
    full = _as_dict(full_report)
    deductions: list[str] = []
    score = 0

    score_block = free.get("score") or {}
    estimated_score = score_block.get("estimated") if isinstance(score_block.get("estimated"), int) else None
    if score_block.get("max") == 25 and isinstance(estimated_score, int) and 0 <= estimated_score <= 25:
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
            if original and not _original_is_locatable(essay_normalized, original):
                missing_aligned_originals.append(f"span-{index}:{original[:40]}")
    if spans and complete_spans == len(spans):
        score += 15
    else:
        deductions.append("some highlight_spans miss required red-green fields")
    if not missing_aligned_originals:
        score += 10
    else:
        deductions.append(f"highlight original not found for aligned spans: {'; '.join(missing_aligned_originals)}")

    categories = _collect_categories(free, full)
    vague_categories = sorted(category for category in categories if not _taxonomy_like(category))
    if not vague_categories:
        score += 5
    else:
        deductions.append(f"highlight/free risk categories should use taxonomy ids or precise Chinese equivalents: {', '.join(vague_categories)}")

    if _task_context_was_provided(full):
        if _report_has_task_context_signal(free, full):
            score += 5
        else:
            deductions.append("task_context was provided but report has no task/key-point/format/register taxonomy signal")

    calibration_errors = _score_calibration_deductions(estimated_score, categories)
    if calibration_errors:
        deductions.extend(calibration_errors)
    else:
        score += 5

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
