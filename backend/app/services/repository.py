from __future__ import annotations

from dataclasses import dataclass, field
from threading import RLock
from uuid import UUID, uuid4

from app.models.schemas import (
    AdminExceptionItem,
    CreditLedgerRecord,
    DraftStatus,
    EssaySourceType,
    FreeSummary,
    FullReport,
    GroupBuyRecord,
    GroupMemberRecord,
    MerchantAccount,
    OcrResult,
    OrderRecord,
    ReportResponse,
    UserCreditAccount,
    utcnow,
)


@dataclass
class DraftRecord:
    id: UUID
    source_type: EssaySourceType
    draft_status: DraftStatus
    session_id: str
    attribution_id: str | None = None
    raw_input_text: str | None = None
    confirmed_text: str | None = None
    confirmed_text_hash: str | None = None
    word_count: int | None = None
    task_prompt: str | None = None
    task_type: str | None = None
    expected_word_count: str | None = None
    ocr_result: OcrResult | None = None
    original_image_object_id: UUID | None = None
    created_at: object = field(default_factory=utcnow)
    updated_at: object = field(default_factory=utcnow)


@dataclass
class UploadIntentRecord:
    id: UUID
    draft_id: UUID
    bucket: str
    object_key: str
    mime_type: str
    size_bytes: int
    completed: bool = False
    created_at: object = field(default_factory=utcnow)


@dataclass
class StorageObjectRecord:
    id: UUID
    upload_intent_id: UUID
    draft_id: UUID
    bucket: str
    object_key: str
    mime_type: str
    size_bytes: int
    sha256: str | None


@dataclass
class SupportActionRecord:
    action: str
    report_id: UUID | None = None
    order_id: UUID | None = None
    message: str | None = None
    created_at: object = field(default_factory=utcnow)


class InMemoryRepository:
    def __init__(self) -> None:
        self.lock = RLock()
        self.drafts: dict[UUID, DraftRecord] = {}
        self.upload_intents: dict[UUID, UploadIntentRecord] = {}
        self.storage_objects: dict[UUID, StorageObjectRecord] = {}
        self.reports: dict[UUID, ReportResponse] = {}
        self.free_summary_cache: dict[str, FreeSummary] = {}
        self.full_report_cache: dict[str, FullReport] = {}
        self.orders: dict[UUID, OrderRecord] = {}
        self.credit_accounts: dict[str, UserCreditAccount] = {}
        self.credit_ledger: dict[UUID, CreditLedgerRecord] = {}
        self.group_buys: dict[UUID, GroupBuyRecord] = {}
        self.group_members: dict[UUID, GroupMemberRecord] = {}
        self.support_actions: list[SupportActionRecord] = []
        self.conversion_events: set[tuple[UUID, str]] = set()
        self.marketing_attribution_count = 0
        self.unlock_clicks = 0
        self.merchants: dict[UUID, MerchantAccount] = {
            merchant.id: merchant
            for merchant in [
                MerchantAccount(merchant_code="mch_a"),
                MerchantAccount(merchant_code="mch_b"),
                MerchantAccount(merchant_code="mch_c"),
            ]
        }

    def create_draft(self, record: DraftRecord) -> DraftRecord:
        with self.lock:
            self.drafts[record.id] = record
            return record

    def create_upload_intent(self, record: UploadIntentRecord) -> UploadIntentRecord:
        with self.lock:
            self.upload_intents[record.id] = record
            return record

    def complete_upload(self, intent_id: UUID, sha256: str | None = None) -> StorageObjectRecord:
        with self.lock:
            intent = self.upload_intents[intent_id]
            intent.completed = True
            storage_object = StorageObjectRecord(
                id=uuid4(),
                upload_intent_id=intent.id,
                draft_id=intent.draft_id,
                bucket=intent.bucket,
                object_key=intent.object_key,
                mime_type=intent.mime_type,
                size_bytes=intent.size_bytes,
                sha256=sha256,
            )
            self.storage_objects[storage_object.id] = storage_object
            draft = self.drafts[intent.draft_id]
            draft.original_image_object_id = storage_object.id
            draft.draft_status = "OCR_PENDING"
            draft.updated_at = utcnow()
            return storage_object

    def upsert_report(self, report: ReportResponse) -> ReportResponse:
        with self.lock:
            self.reports[report.id] = report
            return report

    def create_order(self, order: OrderRecord) -> OrderRecord:
        with self.lock:
            self.orders[order.id] = order
            return order

    def upsert_credit_account(self, account: UserCreditAccount) -> UserCreditAccount:
        with self.lock:
            self.credit_accounts[account.payer_contact_key] = account
            return account

    def add_credit_ledger(self, record: CreditLedgerRecord) -> CreditLedgerRecord:
        with self.lock:
            self.credit_ledger[record.id] = record
            return record

    def add_group_member(self, member: GroupMemberRecord) -> GroupMemberRecord:
        with self.lock:
            self.group_members[member.id] = member
            return member

    def add_support_action(self, action: str, report_id: UUID | None = None, order_id: UUID | None = None, message: str | None = None) -> None:
        with self.lock:
            self.support_actions.append(SupportActionRecord(action=action, report_id=report_id, order_id=order_id, message=message))

    def exceptions(self) -> list[AdminExceptionItem]:
        items: list[AdminExceptionItem] = []
        for order in self.orders.values():
            if order.refund_status == "REFUND_FAILED":
                items.append(AdminExceptionItem(kind="REFUND_FAILED", id=order.id, message="退款失败，需要后台处理。", created_at=order.created_at))
            if order.status == "PAID":
                report = self.reports.get(order.report_id)
                if report and not report.is_unlocked:
                    items.append(AdminExceptionItem(kind="PAID_NOT_UNLOCKED", id=order.id, message="支付成功但报告未解锁。", created_at=order.created_at))
        return items

    def persist_all(self) -> None:
        return None


repo = InMemoryRepository()
