from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any, Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, field_validator, model_validator

EssaySourceType = Literal["text", "image"]
DraftStatus = Literal["TEXT_CREATED", "IMAGE_DRAFT_CREATED", "OCR_PENDING", "OCR_COMPLETED", "OCR_FAILED", "TEXT_CONFIRMED"]
ReportStatus = Literal["QUEUED", "RUNNING", "COMPLETED", "FAILED", "REFUNDED"]
OrderStatus = Literal["PENDING", "PAID", "GROUP_SUCCESS", "EXPIRED", "REFUNDED"]
RefundStatus = Literal["NONE", "REQUESTED", "REFUNDED", "REFUND_FAILED"]
Severity = Literal["minor", "major", "critical"]

ESSAY_CREDIT_PACK_PRODUCT = "essay_credit_pack_20"
GROUP_ESSAY_CREDIT_PACK_PRODUCT = "group_essay_credit_pack_20_member"
LEGACY_SINGLE_PRODUCT = "full_report_single"
LEGACY_GROUP_PRODUCT = "group_report_member"
ESSAY_CREDIT_PACK_CREDITS = 20


def utcnow() -> datetime:
    return datetime.now(UTC)


class CreateDraftTextRequest(BaseModel):
    source_type: Literal["text"]
    raw_input_text: str
    attribution_id: str | None = None


class CreateDraftImageRequest(BaseModel):
    source_type: Literal["image"]
    attribution_id: str | None = None


CreateDraftRequest = CreateDraftTextRequest | CreateDraftImageRequest


class CreateDraftResponse(BaseModel):
    draft_id: UUID
    draft_token: str
    confirmed: bool
    next_step: Literal["create_report", "confirm_text", "upload_image"]
    word_count: int | None = None


class CreateUploadIntentRequest(BaseModel):
    draft_id: UUID
    file_name: str
    mime_type: str
    size_bytes: int = Field(gt=0, le=12 * 1024 * 1024)


class CreateUploadIntentResponse(BaseModel):
    upload_intent_id: UUID
    upload_url: str
    bucket: str
    object_key: str
    expires_at: datetime


class CompleteUploadRequest(BaseModel):
    bucket: str
    object_key: str
    mime_type: str
    size_bytes: int
    sha256: str | None = None


class CompleteUploadResponse(BaseModel):
    draft_id: UUID
    image_object_id: UUID
    recognition_status: Literal["PENDING", "COMPLETED", "FAILED"]


class ConfirmTextRequest(BaseModel):
    confirmed_text: str


class ConfirmTextResponse(BaseModel):
    draft_id: UUID
    confirmed: bool
    word_count: int
    confirmed_text_hash: str


class OcrLineItem(BaseModel):
    line_no: int
    text: str
    confidence: float


class OcrUncertainSpan(BaseModel):
    line_no: int
    text: str
    possible_values: list[str] = Field(default_factory=list)
    reason: str


class OcrArtifact(BaseModel):
    text: str
    reason: str


class OcrResult(BaseModel):
    transcribed_text: str
    line_items: list[OcrLineItem] = Field(default_factory=list)
    uncertain_spans: list[OcrUncertainSpan] = Field(default_factory=list)
    quality_warnings: list[str] = Field(default_factory=list)
    likely_ocr_artifacts: list[OcrArtifact] = Field(default_factory=list)


class RecognitionResponse(BaseModel):
    draft_id: UUID
    recognition_status: Literal["NOT_STARTED", "PENDING", "COMPLETED", "FAILED"]
    ocr_result: OcrResult | None = None
    message: str | None = None


class EssayScore(BaseModel):
    estimated: int = Field(ge=0, le=25)
    max: int = Field(default=25, ge=1, le=25)
    confidence: Literal["low", "medium", "high"] = "medium"
    reason: str


class FreeSummaryRisk(BaseModel):
    type: str
    severity: Severity
    label: str


class FreeSummary(BaseModel):
    score: EssayScore
    top_risks: list[FreeSummaryRisk]
    locked_sections: list[str]
    notice: str


class HighlightSpan(BaseModel):
    start: int
    end: int
    original: str
    severity: Severity
    category: str
    comment: str
    correction: str = Field(min_length=1)
    principle: str = Field(min_length=1)
    risk_note: str = Field(min_length=1)
    position_status: Literal["aligned", "fuzzy_aligned", "unresolved"]


class GaokaoDimension(BaseModel):
    score: int = Field(ge=0, le=5)
    max: int = Field(default=5, ge=1, le=5)
    comment: str


class LogicMapItem(BaseModel):
    paragraph: int
    role: str
    issue: str
    suggestion: str


class FatalRisk(BaseModel):
    title: str = Field(min_length=1)
    severity: Severity
    explanation: str = Field(min_length=1)


class AdvancedPhrase(BaseModel):
    phrase: str = Field(min_length=1)
    explanation: str = Field(min_length=1)


class FullReport(BaseModel):
    overall_review: str = Field(min_length=1)
    fatal_risks: list[FatalRisk]
    gaokao_dimensions: dict[str, GaokaoDimension]
    highlight_spans: list[HighlightSpan]
    logic_map: list[LogicMapItem]
    rewrites: dict[str, str]
    study_plan: list[dict[str, Any]]
    advanced_phrases: list[AdvancedPhrase] = Field(default_factory=list)
    disclaimer: str
    diagnosis_meta: dict[str, Any] | None = None

    @field_validator("fatal_risks")
    @classmethod
    def validate_fatal_risks(cls, value: list[FatalRisk]) -> list[FatalRisk]:
        if len(value) != 3:
            raise ValueError("fatal_risks must contain exactly 3 items")
        return value

    @field_validator("highlight_spans")
    @classmethod
    def validate_highlight_spans(cls, value: list[HighlightSpan]) -> list[HighlightSpan]:
        if len(value) < 3 or len(value) > 8:
            raise ValueError("highlight_spans must contain 3 to 8 items")
        return value

    @field_validator("study_plan")
    @classmethod
    def validate_study_plan(cls, value: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if len(value) < 3:
            raise ValueError("study_plan must contain at least 3 items")
        return value

    @model_validator(mode="after")
    def validate_report_quality(self) -> FullReport:
        required_dimensions = {"content", "language", "structure", "cohesion", "format"}
        missing_dimensions = required_dimensions - set(self.gaokao_dimensions)
        if missing_dimensions:
            raise ValueError(f"missing gaokao dimensions: {', '.join(sorted(missing_dimensions))}")

        safe_version = str(self.rewrites.get("safe_version", "")).strip()
        advanced_version = str(self.rewrites.get("advanced_version", "")).strip()
        if not safe_version or not advanced_version:
            raise ValueError("rewrites.safe_version and rewrites.advanced_version are required")

        return self


class CreateReportRequest(BaseModel):
    draft_id: UUID
    mock_strategy: Literal["instant", "delayed", "failed"] | None = "instant"


class CreateReportResponse(BaseModel):
    report_id: UUID
    status: ReportStatus
    queue_position: int | None = None


class ReportResponse(BaseModel):
    id: UUID
    draft_id: UUID
    source_type: EssaySourceType
    status: ReportStatus
    confirmed_text: str
    confirmed_text_hash: str
    word_count: int
    free_summary: FreeSummary | None = None
    full_report: FullReport | None = None
    is_unlocked: bool = False
    retry_count: int = 0
    last_retry_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class CreateOrderRequest(BaseModel):
    report_id: UUID
    product_type: str
    quantity: int = 1
    group_buy_id: UUID | None = None
    attribution_id: str | None = None
    payer_contact: str | None = None


class CreateOrderResponse(BaseModel):
    order_id: UUID
    order_status: OrderStatus
    product_type: str
    amount_cents: int
    payment_url: str
    merchant_account_id: UUID
    merchant_code: str
    group_buy_id: UUID | None = None
    credit_granted: int | None = None
    credit_remaining: int | None = None


class UnlockWithCreditRequest(BaseModel):
    payer_contact: str


class UnlockWithCreditResponse(BaseModel):
    report_id: UUID
    is_unlocked: bool
    credit_remaining: int


class SmartAppealRequest(BaseModel):
    reason: str = "report_not_generated"


class SmartAppealResponse(BaseModel):
    status_synced: bool
    retry_triggered: bool
    refund_triggered: bool
    current_order_status: OrderStatus | None = None
    current_report_status: ReportStatus
    message: str


class RefundRequestRequest(BaseModel):
    reason: str = "user_refund_clicked"


class RefundRequestResponse(BaseModel):
    refund_triggered: bool
    refund_status: RefundStatus
    message: str


class SupportChatRequest(BaseModel):
    report_id: UUID | None = None
    order_id: UUID | None = None
    message: str


class SupportChatResponse(BaseModel):
    message: str
    suggested_actions: list[str] = Field(default_factory=list)
    escalation_allowed: bool = False


class MerchantAccount(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    merchant_code: str
    provider: str = "mock"
    enabled: bool = True
    daily_quota_cents: int = 100_000_000
    daily_used_cents: int = 0
    success_rate_1h: float = 1.0


class OrderRecord(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    report_id: UUID
    attribution_id: str | None = None
    group_buy_id: UUID | None = None
    merchant_account_id: UUID
    product_type: str
    amount_cents: int
    payer_contact: str | None = None
    status: OrderStatus = "PENDING"
    refund_status: RefundStatus = "NONE"
    refund_reason: str | None = None
    refund_amount_cents: int | None = None
    created_at: datetime = Field(default_factory=utcnow)
    paid_at: datetime | None = None
    refunded_at: datetime | None = None
    expires_at: datetime = Field(default_factory=lambda: utcnow() + timedelta(minutes=30))


class UserCreditAccount(BaseModel):
    payer_contact_key: str
    total_credits: int = 0
    used_credits: int = 0
    last_order_id: UUID | None = None
    updated_at: datetime = Field(default_factory=utcnow)

    @property
    def remaining_credits(self) -> int:
        return max(0, self.total_credits - self.used_credits)


class CreditLedgerRecord(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    payer_contact_key: str
    order_id: UUID | None = None
    report_id: UUID | None = None
    change: int
    reason: str
    balance_after: int
    created_at: datetime = Field(default_factory=utcnow)


class GroupBuyRecord(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    required_members: int = 3
    paid_members: int = 0
    group_price_cents: int
    status: Literal["OPEN", "SUCCESS", "EXPIRED"] = "OPEN"
    official_assist_used: bool = False
    expires_at: datetime


class GroupMemberRecord(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    group_buy_id: UUID
    report_id: UUID | None = None
    order_id: UUID | None = None
    member_type: Literal["REAL", "PLATFORM_ASSIST"] = "REAL"
    payment_status: Literal["PENDING", "PAID", "ASSISTED"] = "PENDING"
    joined_at: datetime = Field(default_factory=utcnow)


class WebhookResponse(BaseModel):
    code: str = "SUCCESS"
    message: str = "OK"


class AdminExceptionItem(BaseModel):
    kind: str
    id: UUID
    message: str
    created_at: datetime


class FunnelResponse(BaseModel):
    visits: int
    drafts: int
    reports_completed: int
    unlock_clicks: int
    orders: int
    paid_orders: int
    refunds: int
    gross_revenue_cents: int
    net_revenue_cents: int
