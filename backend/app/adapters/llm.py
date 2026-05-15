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
FALLBACK_SYSTEM_PROMPT = (
    "你是高考英语作文 AI 诊断系统，只服务中国高考英语作文场景。"
    "请以资深高考英语阅卷研究者的标准进行结构化诊断，但不得自称官方阅卷组或人工老师。"
    "输出必须是严格 JSON，不得包含 Markdown。"
    "免费摘要只能给预估分、置信度、3 个风险类型和锁定说明，不得泄漏具体改写、原文片段或训练方案。"
    "完整报告必须使用红绿灯批改结构：原文错误片段 -> 错误类型 -> 精改替换 -> 提分原理 -> 扣分风险。"
    "稳妥版范文要保留学生原意，适合考场稳定发挥；进阶版范文要更高级但不过度炫技，并输出 advanced_phrases 标注。"
    "禁止承诺保证提分、保分、必得高分、官方阅卷组、人工逐篇批改等表述。"
)


def load_gaokao_system_prompt(prompt_version: str = DEFAULT_PROMPT_VERSION) -> str:
    safe_name = Path(prompt_version).stem
    prompt_path = PROMPTS_DIR / f"{safe_name}.md"
    if not prompt_path.exists():
        return FALLBACK_SYSTEM_PROMPT
    return prompt_path.read_text(encoding="utf-8").strip()


def build_gaokao_diagnosis_payload(*, provider_name: str, essay_text: str, word_count: int, source_type: str, prompt_version: str) -> dict:
    return {
        "exam_type": "gaokao_english_composition",
        "source_type": source_type,
        "word_count": word_count,
        "essay_text": essay_text,
        "quality_requirements": [
            "score.estimated must be an integer between 0 and 25",
            "free_summary.top_risks must contain exactly 3 risk type summaries without solutions",
            "full_report.highlight_spans must contain 3 to 8 items",
            "each highlight item must include original, category, severity, comment, correction, principle, risk_note, position_status",
            "fatal_risks must contain exactly 3 high-impact risk summaries",
            "rewrites.safe_version and rewrites.advanced_version must be non-empty",
            "study_plan must contain at least 3 items and should cover 7 days when possible",
        ],
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
                "diagnosis_meta": {"provider": provider_name, "source_type": source_type, "prompt_version": prompt_version, "ocr_artifacts": []},
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
        tier: Literal["free", "paid"] = "paid",
        system_prompt: str | None = None,
        prompt_version: str = DEFAULT_PROMPT_VERSION,
    ) -> tuple[FreeSummary, FullReport, str]:
        if not self.settings or any(provider.startswith("mock") for provider in self.providers):
            return self._mock_diagnose(essay_text=essay_text, word_count=word_count, source_type=source_type, prompt_version=prompt_version)

        errors: list[str] = []
        for provider in self._provider_configs(tier=tier):
            for attempt in range(2):
                try:
                    return self._call_openai_compatible(
                        provider,
                        essay_text=essay_text,
                        word_count=word_count,
                        source_type=source_type,
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
        }
        validate_generated_report_quality(essay_text, free_summary, full_report)
        return free_summary, full_report, provider.name

    def _mock_diagnose(self, *, essay_text: str, word_count: int, source_type: str, prompt_version: str = DEFAULT_PROMPT_VERSION) -> tuple[FreeSummary, FullReport, str]:
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
            diagnosis_meta={"provider": provider, "source_type": source_type, "prompt_version": prompt_version, "ocr_artifacts": []},
        )
        return free_summary, full_report, provider
