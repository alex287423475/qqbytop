from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "gaokao-essay-backend"
    environment: str = "development"
    cors_origins: str = "http://127.0.0.1:3000,http://localhost:3000,https://www.qqbytop.com,https://qqbytop.com"
    draft_token_secret: str = "dev-only-change-me"
    draft_token_ttl_seconds: int = 900
    report_auto_refund_after_seconds: int = 300
    report_max_retry_count: int = 2
    gaokao_essay_single_price_cents: int = 9900
    gaokao_essay_group_price_cents: int = 5300
    gaokao_essay_pack_credits: int = 20
    gaokao_essay_group_required_members: int = 3
    gaokao_essay_group_expires_hours: int = 24
    ocr_provider: str = "mock"
    llm_provider_order: str = "mock_deepseek,mock_qwen,mock_doubao"
    storage_provider: str = "mock_presigned"
    payment_provider: str = "mock"
    database_url: str | None = None
    repository_provider: str = "memory"
    redis_url: str | None = None
    queue_critical_name: str = "gaokao_essay_critical"
    queue_default_name: str = "gaokao_essay_default"
    queue_low_name: str = "gaokao_essay_low"
    cos_bucket: str | None = None
    cos_region: str | None = None
    cos_secret_id: str | None = None
    cos_secret_key: str | None = None
    tencent_secret_id: str | None = None
    tencent_secret_key: str | None = None
    tencent_ocr_region: str = "ap-beijing"
    baidu_ocr_api_key: str | None = None
    baidu_ocr_secret_key: str | None = None
    baidu_ocr_endpoint: str = "https://aip.baidubce.com/rest/2.0/ocr/v1/handwriting"
    baidu_ocr_token_url: str = "https://aip.baidubce.com/oauth/2.0/token"
    tencent_tokenhub_api_key: str | None = None
    tencent_tokenhub_base_url: str = "https://tokenhub.tencentmaas.com/v1"
    tencent_tokenhub_free_model: str = "deepseek-v4-flash"
    tencent_tokenhub_paid_model: str = "deepseek-v4-pro"
    tencent_tokenhub_fallback_model: str = "deepseek-v4-flash"
    deepseek_api_key: str | None = None
    deepseek_base_url: str = "https://api.deepseek.com/v1"
    deepseek_model: str = "deepseek-chat"
    qwen_api_key: str | None = None
    qwen_base_url: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    qwen_model: str = "qwen-turbo"
    doubao_api_key: str | None = None
    doubao_base_url: str | None = None
    doubao_model: str = "doubao-lite"
    payment_merchant_codes: str | None = None
    payment_private_key_path: str | None = None
    payment_platform_public_key_path: str | None = None
    payment_notify_url: str | None = None
    free_diagnosis_rate_limit_per_hour: int = 3
    upload_intent_rate_limit_per_hour: int = 5
    smart_appeal_rate_limit_per_hour: int = 5
    support_chat_rate_limit_per_hour: int = 20
    support_chat_llm_enabled: bool = False
    support_chat_llm_max_input_chars: int = 500
    support_chat_llm_timeout_seconds: int = 8
    llm_request_timeout_seconds: int = 25
    admin_api_token: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

    @property
    def llm_provider_list(self) -> list[str]:
        return [item.strip() for item in self.llm_provider_order.split(",") if item.strip()]

    def validate_runtime(self) -> None:
        if self.environment.lower() not in {"production", "prod"}:
            return

        errors: list[str] = []
        if self.draft_token_secret in {"dev-only-change-me", "change-me-before-production", ""}:
            errors.append("DRAFT_TOKEN_SECRET must be changed in production.")
        if not self.database_url:
            errors.append("DATABASE_URL is required in production.")
        if self.repository_provider != "postgres":
            errors.append("REPOSITORY_PROVIDER must be postgres in production; in-memory repository is not allowed for paid traffic.")
        if not self.redis_url:
            errors.append("REDIS_URL is required in production.")
        if "*" in self.cors_origin_list:
            errors.append("CORS_ORIGINS must not contain '*' in production.")
        if self.storage_provider == "mock_presigned":
            errors.append("STORAGE_PROVIDER must use a real object-storage adapter in production.")
        if self.ocr_provider == "mock":
            errors.append("OCR_PROVIDER must use a real OCR adapter in production.")
        if any(provider.startswith("mock") for provider in self.llm_provider_list):
            errors.append("LLM_PROVIDER_ORDER must not include mock providers in production.")
        if self.payment_provider == "mock":
            errors.append("PAYMENT_PROVIDER must use a real payment adapter in production.")
        if self.storage_provider in {"cos", "tencent_cos"} and not all([self.cos_bucket, self.cos_region, self.cos_secret_id, self.cos_secret_key]):
            errors.append("COS_BUCKET, COS_REGION, COS_SECRET_ID and COS_SECRET_KEY are required for COS storage.")
        if self.ocr_provider == "tencent_ocr" and not all([self.tencent_secret_id or self.cos_secret_id, self.tencent_secret_key or self.cos_secret_key]):
            errors.append("TENCENT_SECRET_ID/TENCENT_SECRET_KEY or COS_SECRET_ID/COS_SECRET_KEY are required for Tencent OCR.")
        if self.ocr_provider == "baidu_ocr" and not all([self.baidu_ocr_api_key, self.baidu_ocr_secret_key]):
            errors.append("BAIDU_OCR_API_KEY and BAIDU_OCR_SECRET_KEY are required for Baidu OCR.")
        provider_keys = {
            "tencent_tokenhub": self.tencent_tokenhub_api_key,
            "deepseek": self.deepseek_api_key,
            "qwen": self.qwen_api_key,
            "doubao": self.doubao_api_key,
        }
        for provider in self.llm_provider_list:
            if provider in provider_keys and not provider_keys[provider]:
                errors.append(f"{provider.upper()}_API_KEY is required when {provider} is enabled in LLM_PROVIDER_ORDER.")
        if "doubao" in self.llm_provider_list and not self.doubao_base_url:
            errors.append("DOUBAO_BASE_URL is required when doubao is enabled in LLM_PROVIDER_ORDER.")
        if self.payment_provider == "wechat_alipay" and not all([self.payment_merchant_codes, self.payment_notify_url]):
            errors.append("PAYMENT_MERCHANT_CODES and PAYMENT_NOTIFY_URL are required for wechat_alipay payment provider.")

        if errors:
            raise RuntimeError("Invalid production configuration: " + " ".join(errors))


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
