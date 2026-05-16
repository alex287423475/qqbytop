from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from app.config import Settings
from app.models.schemas import EssayScore, FreeSummary, FreeSummaryRisk, FullReport, GaokaoDimension, HighlightSpan, LogicMapItem
from app.services.report_quality import validate_generated_report_quality

DEFAULT_PROMPT_VERSION = "gaokao_default"
PROMPTS_DIR = Path(__file__).resolve().parents[2] / "prompts"
SCORING_RUBRIC_PATH = PROMPTS_DIR / "gaokao_scoring_rubric.md"
ERROR_TAXONOMY_PATH = PROMPTS_DIR / "gaokao_error_taxonomy.md"
WRITING_CHECKLIST_PATH = PROMPTS_DIR / "gaokao_writing_checklist.md"
FALLBACK_SYSTEM_PROMPT = (
    "你是高考英语作文 AI 诊断系统，只服务中国高考英语作文场景。"
    "请以资深高考英语阅卷研究者的标准进行结构化诊断，但不得自称官方阅卷组或人工老师。"
    "输出必须是严格 JSON，不得包含 Markdown。"
    "免费摘要只能给预估分、置信度、3 个风险类型和锁定说明，不得泄漏具体改写、原文片段或训练方案。"
    "完整报告必须使用红绿灯批改结构：原文错误片段 -> 错误类型 -> 精改替换 -> 提分原理 -> 扣分风险。"
    "稳妥版范文要保留学生原意，适合考场稳定发挥；进阶版范文要更高级但不过度炫技，并输出 advanced_phrases 标注。"
    "禁止承诺保证提分、保分、必得高分、官方阅卷组、人工逐篇批改等表述。"
)


FALLBACK_SCORING_RUBRIC = (
    "默认 25 分制，按五档整体分档：21-25 很好，16-20 好，11-15 一般，6-10 较差，1-5 差。"
    "传统单篇作文目标 100-120 词，少于 80 或多于 120 标记字数风险；低于 70 视为严重未完成风险。"
    "score.estimated 是整体判断，不得由维度分简单相加。"
)


FALLBACK_ERROR_TAXONOMY = (
    "常见错误类别：审题偏离、要点缺漏、格式要素缺失、对象语气不匹配、段落混乱、主题句缺失、"
    "连接词误用、模板堆砌、搭配错误、介词错误、拼写错误、词义不准、词性错误、"
    "时态错误、语态错误、主谓一致、从句结构错误、动词句型错误、标点大小写错误、"
    "中式英语、句子结构不完整、句式单一、基础词贫乏、伪高级表达。"
)


FALLBACK_WRITING_CHECKLIST = (
    "诊断建议清单：先检查内容要点，再检查语言质量，最后检查篇章结构。"
    "建议应覆盖审题、要点完整、基础语法、自然词汇升级、连接词、三段式结构和考场检查步骤。"
    "不得把高级词汇数量或从句数量作为硬性评分规则，不得鼓励模板化表达。"
)


def load_gaokao_scoring_rubric() -> str:
    if not SCORING_RUBRIC_PATH.exists():
        return FALLBACK_SCORING_RUBRIC
    return SCORING_RUBRIC_PATH.read_text(encoding="utf-8").strip()


def load_gaokao_error_taxonomy() -> str:
    if not ERROR_TAXONOMY_PATH.exists():
        return FALLBACK_ERROR_TAXONOMY
    return ERROR_TAXONOMY_PATH.read_text(encoding="utf-8").strip()


def load_gaokao_writing_checklist() -> str:
    if not WRITING_CHECKLIST_PATH.exists():
        return FALLBACK_WRITING_CHECKLIST
    return WRITING_CHECKLIST_PATH.read_text(encoding="utf-8").strip()


def load_gaokao_system_prompt(prompt_version: str = DEFAULT_PROMPT_VERSION) -> str:
    safe_name = Path(prompt_version).stem
    prompt_path = PROMPTS_DIR / f"{safe_name}.md"
    scoring_rubric = load_gaokao_scoring_rubric()
    error_taxonomy = load_gaokao_error_taxonomy()
    writing_checklist = load_gaokao_writing_checklist()
    if not prompt_path.exists():
        base_prompt = FALLBACK_SYSTEM_PROMPT
    else:
        base_prompt = prompt_path.read_text(encoding="utf-8").strip()
    return (
        f"{base_prompt}\n\n【生产评分 Rubric】\n{scoring_rubric}"
        f"\n\n【高考常见错误 Taxonomy】\n{error_taxonomy}"
        f"\n\n【高考写作诊断 Checklist】\n{writing_checklist}"
    )


def build_gaokao_diagnosis_payload(
    *,
    provider_name: str,
    essay_text: str,
    word_count: int,
    source_type: str,
    prompt_version: str,
    task_prompt: str | None = None,
    task_type: str | None = None,
    expected_word_count: str | None = None,
) -> dict:
    task_context = {
        "task_prompt": task_prompt or "",
        "task_type": task_type or "unknown",
        "expected_word_count": expected_word_count or "",
        "provided": bool(task_prompt or task_type or expected_word_count),
        "usage": (
            "If a task prompt is provided, evaluate task completion, missing key points, format, register, audience, and off-topic risk against it. "
            "If no task prompt is provided, do not invent task requirements; mark task-specific judgments as limited."
        ),
    }
    return {
        "exam_type": "gaokao_english_composition",
        "source_type": source_type,
        "word_count": word_count,
        "task_context": task_context,
        "essay_text": essay_text,
        "quality_requirements": [
            "score.estimated must be an integer between 0 and 25",
            "Apply the 25-point five-band scoring_rubric; score.estimated is a holistic band judgment, not a sum of gaokao_dimensions",
            "free_summary.top_risks must contain exactly 3 risk type summaries without solutions",
            "full_report.highlight_spans must contain 3 to 8 items",
            "each highlight item must include original, category, severity, comment, correction, principle, risk_note, position_status",
            "highlight_spans.category should prefer known error_taxonomy ids or precise Chinese equivalents instead of vague labels",
            "highlight_spans.original must be copied verbatim from essay_text; do not summarize it and do not use ellipsis such as ... or …",
            "Score calibration: do not score below 18 only because vocabulary is plain when the task is complete and grammar is mostly correct",
            "If task_context.provided is true, missing_key_points, format_element_missing, audience_register_mismatch, and off_topic_risk must be judged against task_context.task_prompt",
            "If task_context.provided is false, do not invent a writing topic; only evaluate generic high-school English writing quality",
            "Reserve 11-14 for essays with meaning-affecting grammar or Chinglish; use 15-18 for coherent essays with frequent but diagnosable errors",
            "fatal_risks must contain exactly 3 high-impact risk summaries",
            "rewrites.safe_version and rewrites.advanced_version must be non-empty",
            "study_plan must contain at least 3 items and should cover 7 days when possible",
            "Use writing_checklist to make logic_map, rewrites, and study_plan concrete; do not treat advanced vocabulary or clause counts as hard scoring rules",
        ],
        "scoring_rubric": {
            "max_score": 25,
            "score_bands": [
                {
                    "range": "21-25",
                    "label": "很好",
                    "anchor": "内容完整覆盖要点并适当发挥；语言丰富准确地道；结构紧凑、逻辑连贯；只允许个别不影响理解的小错误。",
                },
                {
                    "range": "16-20",
                    "label": "好",
                    "anchor": "覆盖主要内容；语言基本准确，少量错误多来自复杂结构尝试；结构较紧凑。",
                },
                {
                    "range": "11-15",
                    "label": "一般",
                    "anchor": "覆盖部分主要内容；语法和词汇错误对理解造成一定影响；内容基本连贯但连接方式简单。",
                },
                {
                    "range": "6-10",
                    "label": "较差",
                    "anchor": "遗漏或未描述清主要内容，或存在较多无关信息；语法结构单调、词汇有限，错误严重影响理解。",
                },
                {
                    "range": "1-5",
                    "label": "差",
                    "anchor": "明显遗漏主要内容或严重离题；语法词汇错误很多，词不达意，内容不连贯。",
                },
            ],
            "word_count_rules": {
                "current_system_input_gate": {"min_words": 41, "max_words": 350},
                "traditional_single_essay_target": "100-120 words",
                "traditional_word_count_risk": "below 80 or above 120 words may carry about 2 points deduction risk",
                "severe_under_completion_below_words": 70,
                "new_gaokao_application_target": "about 80 words",
                "new_gaokao_continuation_target": "about 150 words",
                "future_task_type_required": True,
            },
            "grading_notes": [
                "Plain vocabulary with mostly correct grammar and complete task response should not be pushed below 18 only for being simple.",
                "Chinglish, There be misuse, Although/but, Because/so, and verb-base chaining should be mapped by comprehension impact.",
                "For text input, do not evaluate handwriting quality; only evaluate paragraphing, punctuation, capitalization, and format.",
                "Spelling and punctuation errors belong to language accuracy and should be weighted by communication impact.",
            ],
        },
        "error_taxonomy": {
            "task_and_content": [
                "task_deviation",
                "missing_key_points",
                "format_element_missing",
                "audience_register_mismatch",
                "key_point_underdeveloped",
                "contradiction",
                "off_topic_filler",
            ],
            "structure_and_cohesion": [
                "paragraph_disorder",
                "topic_sentence_missing",
                "weak_cohesion",
                "connector_misuse",
                "transition_gap",
                "template_stacking",
                "run_on_or_fragment",
            ],
            "lexis_and_collocation": [
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
            ],
            "grammar_accuracy": [
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
            ],
            "expression_level": [
                "simple_sentence_overuse",
                "vague_basic_vocabulary",
                "forced_advanced_expression",
                "mechanical_advanced_wording",
                "weak_register",
                "tone_inappropriateness",
            ],
            "task_type_specific": [
                "invitation_letter_missing_invite",
                "invitation_letter_missing_details",
                "suggestion_letter_weak_advice",
                "speech_no_audience_address",
                "notice_missing_action_info",
                "article_or_submission_weak_title_focus",
                "traditional_culture_superficial",
                "continuation_plot_incoherence",
                "continuation_emotion_flat",
            ],
            "score_calibration": [
                "band_0_10_structure_collapse",
                "band_11_14_chinglish_dense",
                "band_15_18_complex_attempt_failure",
                "band_19_21_plain_but_correct",
                "band_21_25_minor_flaws_only",
                "guardrail_underlength_or_offtopic",
            ],
        },
        "writing_checklist": {
            "diagnosis_priority": ["content_key_points", "language_quality", "essay_structure"],
            "content_checks": [
                "split task prompt into 3-5 key points",
                "detect missing key points, irrelevant expansion, and off-topic filler",
                "do not reward fluent language if core task requirements are missing",
            ],
            "language_checks": [
                "prioritize subject-verb agreement, tense, voice, singular/plural nouns, articles, prepositions, punctuation, and capitalization",
                "upgrade vocabulary only when it is natural and serves the task",
                "do not require a fixed number of advanced words or clauses",
            ],
            "structure_checks": [
                "check three- or four-paragraph structure",
                "check topic sentence, supporting details, examples, and closing sentence",
                "prefer natural connectors such as therefore, consequently, furthermore, nevertheless",
            ],
            "exam_time_advice": {
                "plan_minutes": 3,
                "write_minutes": 15,
                "check_minutes": 2,
                "check_targets": ["verb tense", "noun number", "subject-verb agreement", "spelling", "punctuation", "format"],
            },
        },
        "required_schema": {
            "free_summary": {
                "score": {"estimated": "int", "max": 25, "confidence": "low|medium|high", "reason": "string"},
                "top_risks": [{"type": "string", "severity": "minor|major|critical", "label": "string"}],
                "locked_sections": ["string"],
                "notice": "string",
            },
            "full_report": {
                "overall_review": "string",
                "fatal_risks": [{"title": "string", "severity": "minor|major|critical", "explanation": "string"}],
                "gaokao_dimensions": {
                    "content": {"score": "0-5", "max": 5, "comment": "string"},
                    "language": {"score": "0-5", "max": 5, "comment": "string"},
                    "structure": {"score": "0-5", "max": 5, "comment": "string"},
                    "cohesion": {"score": "0-5", "max": 5, "comment": "string"},
                    "format": {"score": "0-5", "max": 5, "comment": "string"},
                },
                "highlight_spans": [
                    {
                        "start": "int",
                        "end": "int",
                        "original": "string",
                        "severity": "minor|major|critical",
                        "category": "string",
                        "comment": "string",
                        "correction": "string",
                        "principle": "string",
                        "risk_note": "string",
                        "position_status": "aligned|fuzzy_aligned|unresolved",
                    }
                ],
                "logic_map": [{"paragraph": "int", "role": "string", "issue": "string", "suggestion": "string"}],
                "rewrites": {"safe_version": "string", "advanced_version": "string"},
                "study_plan": [{"priority": "int", "skill": "string", "exercise": "string"}],
                "advanced_phrases": [{"phrase": "string", "explanation": "string"}],
                "disclaimer": "string",
                "diagnosis_meta": {
                    "provider": provider_name,
                    "source_type": source_type,
                    "prompt_version": prompt_version,
                    "task_context_provided": task_context["provided"],
                    "task_type": task_context["task_type"],
                    "expected_word_count": task_context["expected_word_count"],
                    "ocr_artifacts": [],
                },
            },
        },
    }


@dataclass(frozen=True)
class LlmProviderConfig:
    name: str
    api_key: str
    base_url: str
    model: str
    model_tier: str = "standard"


class LlmRouter:
    def __init__(self, providers: list[str], settings: Settings | None = None) -> None:
        self.providers = providers
        self.settings = settings

    def diagnose(
        self,
        *,
        essay_text: str,
        word_count: int,
        source_type: str,
        task_prompt: str | None = None,
        task_type: str | None = None,
        expected_word_count: str | None = None,
        tier: Literal["free", "paid"] = "paid",
        system_prompt: str | None = None,
        prompt_version: str = DEFAULT_PROMPT_VERSION,
    ) -> tuple[FreeSummary, FullReport, str]:
        if not self.settings or any(provider.startswith("mock") for provider in self.providers):
            return self._mock_diagnose(
                essay_text=essay_text,
                word_count=word_count,
                source_type=source_type,
                prompt_version=prompt_version,
                task_prompt=task_prompt,
                task_type=task_type,
                expected_word_count=expected_word_count,
            )

        errors: list[str] = []
        for provider in self._provider_configs(tier=tier):
            for attempt in range(2):
                try:
                    return self._call_openai_compatible(
                        provider,
                        essay_text=essay_text,
                        word_count=word_count,
                        source_type=source_type,
                        task_prompt=task_prompt,
                        task_type=task_type,
                        expected_word_count=expected_word_count,
                        system_prompt=system_prompt,
                        prompt_version=prompt_version,
                    )
                except Exception as exc:  # noqa: BLE001 - provider fallback must catch SDK and validation failures.
                    errors.append(f"{provider.name}/{provider.model}/attempt-{attempt + 1}: {exc}")
                    continue
        raise RuntimeError("All LLM providers failed. " + " | ".join(errors))

    def _provider_configs(self, *, tier: Literal["free", "paid"] = "paid") -> list[LlmProviderConfig]:
        if not self.settings:
            return []
        configs: list[LlmProviderConfig] = []
        for name in self.providers:
            if name == "tencent_tokenhub" and self.settings.tencent_tokenhub_api_key:
                primary_model = self.settings.tencent_tokenhub_free_model if tier == "free" else self.settings.tencent_tokenhub_paid_model
                configs.append(
                    LlmProviderConfig(
                        name=name,
                        api_key=self.settings.tencent_tokenhub_api_key,
                        base_url=self.settings.tencent_tokenhub_base_url,
                        model=primary_model,
                        model_tier="flash" if primary_model == self.settings.tencent_tokenhub_free_model else "pro",
                    )
                )
                if tier == "paid" and self.settings.tencent_tokenhub_fallback_model and self.settings.tencent_tokenhub_fallback_model != primary_model:
                    configs.append(
                        LlmProviderConfig(
                            name=name,
                            api_key=self.settings.tencent_tokenhub_api_key,
                            base_url=self.settings.tencent_tokenhub_base_url,
                            model=self.settings.tencent_tokenhub_fallback_model,
                            model_tier="fallback",
                        )
                    )
            elif name == "deepseek" and self.settings.deepseek_api_key:
                configs.append(LlmProviderConfig(name, self.settings.deepseek_api_key, self.settings.deepseek_base_url, self.settings.deepseek_model))
            elif name == "qwen" and self.settings.qwen_api_key:
                configs.append(LlmProviderConfig(name, self.settings.qwen_api_key, self.settings.qwen_base_url, self.settings.qwen_model))
            elif name == "doubao" and self.settings.doubao_api_key and self.settings.doubao_base_url:
                configs.append(LlmProviderConfig(name, self.settings.doubao_api_key, self.settings.doubao_base_url, self.settings.doubao_model))
        return configs

    def _call_openai_compatible(
        self,
        provider: LlmProviderConfig,
        *,
        essay_text: str,
        word_count: int,
        source_type: str,
        task_prompt: str | None,
        task_type: str | None,
        expected_word_count: str | None,
        system_prompt: str | None,
        prompt_version: str,
    ) -> tuple[FreeSummary, FullReport, str]:
        from openai import OpenAI

        prompt = system_prompt or load_gaokao_system_prompt(prompt_version)
        client = OpenAI(api_key=provider.api_key, base_url=provider.base_url)
        response = client.chat.completions.create(
            model=provider.model,
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": prompt,
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        build_gaokao_diagnosis_payload(
                            provider_name=provider.name,
                            essay_text=essay_text,
                            word_count=word_count,
                            source_type=source_type,
                            prompt_version=prompt_version,
                            task_prompt=task_prompt,
                            task_type=task_type,
                            expected_word_count=expected_word_count,
                        ),
                        ensure_ascii=False,
                    ),
                },
            ],
        )
        content = response.choices[0].message.content or "{}"
        payload = json.loads(content)
        free_summary = FreeSummary.model_validate(payload["free_summary"])
        full_report = FullReport.model_validate(payload["full_report"])
        full_report.diagnosis_meta = {
            **(full_report.diagnosis_meta or {}),
            "provider": provider.name,
            "model_name": provider.model,
            "model_tier": provider.model_tier,
            "model_degraded": provider.model_tier == "fallback",
            "source_type": source_type,
            "prompt_version": prompt_version,
            "task_context_provided": bool(task_prompt or task_type or expected_word_count),
            "task_prompt": task_prompt,
            "task_type": task_type or "unknown",
            "expected_word_count": expected_word_count,
        }
        validate_generated_report_quality(essay_text, free_summary, full_report)
        return free_summary, full_report, provider.name

    def _mock_diagnose(
        self,
        *,
        essay_text: str,
        word_count: int,
        source_type: str,
        prompt_version: str = DEFAULT_PROMPT_VERSION,
        task_prompt: str | None = None,
        task_type: str | None = None,
        expected_word_count: str | None = None,
    ) -> tuple[FreeSummary, FullReport, str]:
        provider = self.providers[0] if self.providers else "mock"
        lowered = essay_text.lower()
        has_example = "for example" in lowered or "such as" in lowered or "if everyone" in lowered
        has_connector = any(token in lowered for token in ["first", "second", "however", "therefore", "in conclusion", "although"])
        estimated = max(12, min(22, 15 + (2 if has_connector else 0) + (2 if has_example else 0) + (2 if word_count > 110 else 0)))

        def locate(phrase: str) -> tuple[int, int, str]:
            start = essay_text.lower().find(phrase.lower())
            if start < 0:
                return 0, 0, "unresolved"
            return start, start + len(phrase), "aligned"

        free_summary = FreeSummary(
            score=EssayScore(
                estimated=estimated,
                max=25,
                confidence="medium",
                reason="基于篇幅、衔接信号、例证密度与基础语法稳定性给出的 AI 预估。",
            ),
            top_risks=[
                FreeSummaryRisk(type="logic", severity="minor" if has_connector else "major", label="段落衔接需要更清晰的推进关系"),
                FreeSummaryRisk(type="content", severity="minor" if has_example else "major", label="观点需要更具体的例证支撑"),
                FreeSummaryRisk(type="language", severity="major", label="部分表达偏口语化，影响高考作文档次"),
            ],
            locked_sections=["逐句扣分定位", "高考维度诊断", "两版范文重写", "7 天练习计划"],
            notice="免费层仅暴露风险类型和严重度，不提供完整修改方案。",
        )

        phrase_1 = "small habits can make a real difference"
        phrase_2 = "one person cannot change much"
        phrase_3 = "we should protect the environment"
        start_1, end_1, status_1 = locate(phrase_1)
        start_2, end_2, status_2 = locate(phrase_2)
        start_3, end_3, status_3 = locate(phrase_3)

        full_report = FullReport(
            overall_review=(
                "这篇作文立意清楚，能围绕绿色生活或校园倡议展开，但论证层次仍偏平。"
                "当前最大问题不是看不懂，而是例证不够具体、句式变化不足，容易停留在中档偏上。"
            ),
            fatal_risks=[
                {"title": "观点有但证据不足", "severity": "major", "explanation": "核心观点出现较早，但缺少校园场景或个人行动细节，阅卷时支撑感不够。"},
                {"title": "句式层次偏单一", "severity": "major", "explanation": "简单句比例偏高，缺少定语从句、状语从句或非谓语结构来拉开语言档次。"},
                {"title": "结尾提升不明显", "severity": "minor", "explanation": "结尾能回应主题，但缺少对倡议价值的升华，容易显得模板化。"},
            ],
            gaokao_dimensions={
                "content": GaokaoDimension(score=4, comment="观点明确，主题没有明显跑偏，但细节例证仍可增强。"),
                "language": GaokaoDimension(score=3, comment="基础表达可读，但高级句式和精确词汇不足。"),
                "structure": GaokaoDimension(score=4, comment="段落结构基本清晰，开头、主体和结尾完整。"),
                "cohesion": GaokaoDimension(score=3, comment="有衔接意识，但句间因果关系和转折关系需要更明确。"),
                "format": GaokaoDimension(score=4, comment="格式基本符合常见高考写作任务要求。"),
            },
            highlight_spans=[
                HighlightSpan(
                    start=start_1,
                    end=end_1,
                    original=phrase_1,
                    severity="major",
                    category="论证展开",
                    comment="这句话方向正确，但只是泛泛表态，没有说明哪些 small habits 会带来什么改变。",
                    correction="Small daily habits, such as sorting waste and turning off unused lights, can gradually make our campus cleaner and greener.",
                    principle="把抽象观点改成具体动作 + 可见结果，能显著提升内容支撑度。",
                    risk_note="如果主体段只有泛泛观点，容易被判定为论证单薄，内容分上限受限。",
                    position_status=status_1,  # type: ignore[arg-type]
                ),
                HighlightSpan(
                    start=start_2,
                    end=end_2,
                    original=phrase_2,
                    severity="major",
                    category="逻辑回应",
                    comment="反方观点可以保留，但需要立刻用让步转折回应，否则文章立场会显得摇摆。",
                    correction="Although one person alone may seem too small to change everything, every shared action can encourage more students to join in.",
                    principle="让步状语从句 + 转折回应，可以展示更成熟的论证能力。",
                    risk_note="反方观点处理不完整时，阅卷者会感觉文章逻辑推进不足。",
                    position_status=status_2,  # type: ignore[arg-type]
                ),
                HighlightSpan(
                    start=start_3,
                    end=end_3,
                    original=phrase_3,
                    severity="minor",
                    category="语言升级",
                    comment="表达准确但较常见，可以换成更有高考作文质感的表达。",
                    correction="we are expected to take practical steps to protect the environment",
                    principle="用 be expected to 与 practical steps 替换普通 should，可以提升正式度。",
                    risk_note="普通表达不会直接扣大分，但会限制语言亮点。",
                    position_status=status_3,  # type: ignore[arg-type]
                ),
            ],
            logic_map=[
                LogicMapItem(paragraph=1, role="开头立场", issue="背景铺垫略短，读者还不知道倡议为何重要。", suggestion="补一句校园活动背景或现实问题。"),
                LogicMapItem(paragraph=2, role="主体论证", issue="观点和例子之间缺少因果链。", suggestion="使用 action -> result -> meaning 的三步展开。"),
                LogicMapItem(paragraph=3, role="结尾升华", issue="结尾停留在号召层面。", suggestion="把个人行动提升到校园责任感或公民意识。"),
            ],
            rewrites={
                "safe_version": (
                    "Recently, our school has encouraged students to live a greener life. I believe this activity is meaningful because small daily habits, "
                    "such as sorting waste and turning off unused lights, can gradually make our campus cleaner. Although one person alone may seem too small "
                    "to change everything, every shared action can encourage more students to join in. Therefore, we should start from simple things and make "
                    "green living part of our daily routine."
                ),
                "advanced_version": (
                    "Recently, our school has launched a campaign to promote a greener lifestyle among students. From my perspective, environmental protection "
                    "should not remain an empty slogan; instead, it should be turned into daily routines, including sorting waste, saving electricity and reducing "
                    "unnecessary paper use. Although one student's effort may appear limited, a series of small actions can create a visible change on campus and "
                    "inspire others to participate. Only when we take practical steps can green living become a shared responsibility rather than a temporary activity."
                ),
            },
            study_plan=[
                {"priority": 1, "skill": "例证展开", "exercise": "第 1-2 天：每天用 action -> result -> meaning 写 3 组环保或校园主题句。"},
                {"priority": 2, "skill": "句式升级", "exercise": "第 3-4 天：把 10 个 should 句改写为 be expected to / it is necessary to / only when 结构。"},
                {"priority": 3, "skill": "结尾升华", "exercise": "第 5-7 天：为 5 篇作文各写一个 responsibility / community / future 主题结尾。"},
            ],
            advanced_phrases=[
                {"phrase": "should not remain an empty slogan", "explanation": "把普通观点提升为批判式表达，适合用于议论文主体段。"},
                {"phrase": "be turned into daily routines", "explanation": "强调行动落地，比 simply do something 更正式。"},
                {"phrase": "a shared responsibility", "explanation": "适合结尾升华，能把个人行动提升到集体责任。"},
            ],
            disclaimer="本报告为 AI 辅助诊断，仅供学习训练参考，不代表正式考试成绩。",
            diagnosis_meta={
                "provider": provider,
                "source_type": source_type,
                "prompt_version": prompt_version,
                "task_context_provided": bool(task_prompt or task_type or expected_word_count),
                "task_prompt": task_prompt,
                "task_type": task_type or "unknown",
                "expected_word_count": expected_word_count,
                "ocr_artifacts": [],
            },
        )
        return free_summary, full_report, provider
