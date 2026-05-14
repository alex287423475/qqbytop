from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Literal

from app.config import Settings
from app.models.schemas import EssayScore, FreeSummary, FreeSummaryRisk, FullReport, GaokaoDimension, HighlightSpan, LogicMapItem


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

    def diagnose(self, *, essay_text: str, word_count: int, source_type: str, tier: Literal["free", "paid"] = "paid") -> tuple[FreeSummary, FullReport, str]:
        if not self.settings or any(provider.startswith("mock") for provider in self.providers):
            return self._mock_diagnose(essay_text=essay_text, word_count=word_count, source_type=source_type)

        errors: list[str] = []
        for provider in self._provider_configs(tier=tier):
            try:
                return self._call_openai_compatible(provider, essay_text=essay_text, word_count=word_count, source_type=source_type)
            except Exception as exc:  # noqa: BLE001 - fallback needs to catch provider-specific SDK exceptions.
                errors.append(f"{provider.name}/{provider.model}: {exc}")
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

    def _call_openai_compatible(self, provider: LlmProviderConfig, *, essay_text: str, word_count: int, source_type: str) -> tuple[FreeSummary, FullReport, str]:
        from openai import OpenAI

        client = OpenAI(api_key=provider.api_key, base_url=provider.base_url)
        response = client.chat.completions.create(
            model=provider.model,
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "你是高考英语作文诊断系统，只针对中国高考英语作文。"
                        "输出必须是严格 JSON，不得包含 Markdown。"
                        "免费摘要只暴露分数、置信度、风险类型和严重度，不泄漏逐句修改。"
                        "完整报告需要包含 gaokao_dimensions、highlight_spans、logic_map、rewrites、study_plan、disclaimer、diagnosis_meta。"
                        "不要承诺提分、保分、官方阅卷或人工批改。"
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        {
                            "exam_type": "gaokao_english_composition",
                            "source_type": source_type,
                            "word_count": word_count,
                            "essay_text": essay_text,
                            "required_schema": {
                                "free_summary": {
                                    "score": {"estimated": "int", "max": 25, "confidence": "low|medium|high", "reason": "string"},
                                    "top_risks": [{"type": "string", "severity": "minor|major|critical", "label": "string"}],
                                    "locked_sections": ["string"],
                                    "notice": "string",
                                },
                                "full_report": {
                                    "gaokao_dimensions": "object of dimension -> {score,max,comment}",
                                    "highlight_spans": [
                                        {
                                            "start": "int",
                                            "end": "int",
                                            "original": "string",
                                            "severity": "minor|major|critical",
                                            "category": "string",
                                            "comment": "string",
                                            "position_status": "aligned|fuzzy_aligned|unresolved",
                                        }
                                    ],
                                    "logic_map": [{"paragraph": "int", "role": "string", "issue": "string", "suggestion": "string"}],
                                    "rewrites": {"safe_version": "string", "advanced_version": "string"},
                                    "study_plan": [{"priority": "int", "skill": "string", "exercise": "string"}],
                                    "disclaimer": "string",
                                    "diagnosis_meta": {"provider": provider.name, "source_type": source_type, "ocr_artifacts": []},
                                },
                            },
                        },
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
        }
        return free_summary, full_report, provider.name

    def _mock_diagnose(self, *, essay_text: str, word_count: int, source_type: str) -> tuple[FreeSummary, FullReport, str]:
        provider = self.providers[0] if self.providers else "mock"
        lowered = essay_text.lower()
        has_example = "for example" in lowered or "such as" in lowered or "if everyone" in lowered
        has_connector = any(token in lowered for token in ["first", "second", "however", "therefore", "in conclusion", "although"])
        estimated = max(12, min(22, 15 + (2 if has_connector else 0) + (2 if has_example else 0) + (2 if word_count > 110 else 0)))

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
                FreeSummaryRisk(type="format", severity="minor", label="格式基本完整，但结尾可以更自然"),
            ],
            locked_sections=["逐句荧光笔标注", "高考维度拆解", "稳健版与进阶版范文", "7 天练习计划"],
            notice="免费层仅暴露风险类型和严重度，不提供完整修改方案。",
        )

        full_report = FullReport(
            gaokao_dimensions={
                "content": GaokaoDimension(score=4, comment="观点明确，但细节例证仍可增强。"),
                "language": GaokaoDimension(score=4, comment="基础表达稳定，复合句比例偏低。"),
                "structure": GaokaoDimension(score=4, comment="段落结构清晰，转折推进可更紧。"),
                "cohesion": GaokaoDimension(score=3, comment="衔接词存在，但句间逻辑解释不足。"),
                "format": GaokaoDimension(score=4, comment="格式基本符合高考常见书信或投稿任务要求。"),
            },
            highlight_spans=[
                HighlightSpan(start=0, end=12, original="Dear editor", severity="minor", category="format", comment="称呼格式可保留。", position_status="aligned"),
                HighlightSpan(
                    start=9999,
                    end=10010,
                    original="unmatched phrase",
                    severity="minor",
                    category="logic",
                    comment="mock unresolved 高亮，用于前端边界。",
                    position_status="unresolved",
                ),
            ],
            logic_map=[
                LogicMapItem(paragraph=1, role="开头与立场", issue="立场明确但背景铺垫略短。", suggestion="补一句活动目的或校园背景。"),
                LogicMapItem(paragraph=2, role="反方与回应", issue="回应有价值，但因果链可以更完整。", suggestion="加入一个具体校园场景。"),
            ],
            rewrites={
                "safe_version": "Recently, our school has encouraged students to live a greener life. I believe this activity is useful because small habits can gradually change our campus.",
                "advanced_version": "By turning simple environmental choices into daily routines, students can make the campus cleaner while developing a stronger sense of responsibility.",
            },
            study_plan=[
                {"priority": 1, "skill": "例证展开", "exercise": "每天用 one example + one result 写 3 组句子。"},
                {"priority": 2, "skill": "衔接推进", "exercise": "练习 however / therefore / as a result 的句间逻辑。"},
            ],
            disclaimer="本报告为 AI 辅助诊断，不承诺高考提分或最终得分。",
            diagnosis_meta={"provider": provider, "source_type": source_type, "ocr_artifacts": []},
        )
        return free_summary, full_report, provider
