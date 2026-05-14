from __future__ import annotations

import re
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from app.config import Settings


@dataclass(frozen=True)
class SupportLlmConfig:
    name: str
    api_key: str
    base_url: str
    model: str


class SupportAssistantLLM:
    """Rule-miss fallback for support chat. Never send reports, images, or payment secrets."""

    def __init__(self, settings: Settings, client_factory: Callable[..., Any] | None = None) -> None:
        self.settings = settings
        self.client_factory = client_factory

    @property
    def enabled(self) -> bool:
        return self.settings.support_chat_llm_enabled and self._provider_config() is not None

    def answer(self, message: str) -> str | None:
        if not self.enabled:
            return None
        provider = self._provider_config()
        if provider is None:
            return None
        sanitized = self.sanitize_message(message)
        if not sanitized:
            return None

        try:
            client = self._create_client(provider)
            response = client.chat.completions.create(
                model=provider.model,
                temperature=0.2,
                timeout=self.settings.support_chat_llm_timeout_seconds,
                messages=[
                    {"role": "system", "content": self._system_prompt()},
                    {"role": "user", "content": sanitized},
                ],
            )
        except Exception:  # noqa: BLE001 - support chat must fall back to deterministic rules.
            return None

        content = getattr(response.choices[0].message, "content", None)
        if not content:
            return None
        return content.strip()[:500]

    def sanitize_message(self, message: str) -> str:
        text = message.strip()
        text = re.sub(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", "[邮箱已隐藏]", text)
        text = re.sub(r"(?<!\d)1[3-9]\d{9}(?!\d)", "[手机号已隐藏]", text)
        text = re.sub(r"\b\d{12,}\b", "[长编号已隐藏]", text)
        text = re.sub(r"\b[A-Za-z0-9][A-Za-z0-9_-]{19,}\b", "[长编号已隐藏]", text)
        return text[: self.settings.support_chat_llm_max_input_chars]

    def _provider_config(self) -> SupportLlmConfig | None:
        for name in self.settings.llm_provider_list:
            if name == "tencent_tokenhub" and self.settings.tencent_tokenhub_api_key:
                return SupportLlmConfig(
                    name=name,
                    api_key=self.settings.tencent_tokenhub_api_key,
                    base_url=self.settings.tencent_tokenhub_base_url,
                    model=self.settings.tencent_tokenhub_free_model,
                )
            if name == "deepseek" and self.settings.deepseek_api_key:
                return SupportLlmConfig(
                    name=name,
                    api_key=self.settings.deepseek_api_key,
                    base_url=self.settings.deepseek_base_url,
                    model=self.settings.deepseek_model,
                )
        return None

    def _create_client(self, provider: SupportLlmConfig) -> Any:
        if self.client_factory:
            return self.client_factory(api_key=provider.api_key, base_url=provider.base_url)
        from openai import OpenAI

        return OpenAI(api_key=provider.api_key, base_url=provider.base_url)

    @staticmethod
    def _system_prompt() -> str:
        return (
            "你是高考英语作文诊断工具的系统护航助手，不是假装真人客服。"
            "只基于以下规则回答，回复不超过120字："
            "1. 99元为20篇深度精诊额度包，53元/人为三人组队20篇额度包；不是无限次，不是月卡。"
            "2. 免费摘要只展示预估分、置信度和风险类型；完整报告包含逐句定位、高考维度诊断、两版范文、逻辑拆解和7天练习计划。"
            "3. 手写作文建议先用微信或手机相册提取文字，校对后粘贴。"
            "4. 支付成功未解锁、报告失败或额度异常，应引导用户点击智能申诉与重试。符合规则的订单12小时内原路退款或补发权益。"
            "5. 不承诺保证提分，不提供人工微信，不直接退款，不直接解锁，不索要作文原文、图片或支付敏感信息。"
        )
