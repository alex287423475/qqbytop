from __future__ import annotations

from uuid import UUID

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
from pydantic import ValidationError

from app.models.schemas import (
    CreditLedgerRecord,
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
from app.services.repository import DraftRecord, InMemoryRepository, StorageObjectRecord, UploadIntentRecord

DIMENSION_ALIASES = {
    "content": ["content", "content_relevance"],
    "language": ["language", "grammar_accuracy", "vocabulary_expression"],
    "structure": ["structure", "structure_logic"],
    "cohesion": ["cohesion", "structure_logic"],
    "format": ["format", "handwriting_or_format"],
}


def uuid_or_none(value: str | None) -> UUID | None:
    if not value:
        return None
    try:
        return UUID(value)
    except ValueError:
        return None


def normalize_legacy_full_report(value: dict) -> dict:
    normalized = dict(value)
    spans = list(normalized.get("highlight_spans") or [])
    normalized_spans: list[dict] = []
    for span in spans[:8]:
        item = dict(span)
        item.setdefault("comment", item.get("explanation") or item.get("suggestion") or "该处表达需要结合上下文优化。")
        item.setdefault("correction", item.get("suggestion") or item.get("original") or "建议改写为更清晰、正式的高考作文表达。")
        item.setdefault("principle", item.get("explanation") or item.get("comment") or "通过明确主干、补足因果关系和提升正式度来增强得分稳定性。")
        item.setdefault("risk_note", "该问题可能影响阅卷者对语言准确性、逻辑完整度或内容支撑度的判断。")
        item.setdefault("position_status", item.get("positionStatus") or "unresolved")
        normalized_spans.append(item)
    while len(normalized_spans) < 3:
        normalized_spans.append(
            {
                "start": 0,
                "end": 0,
                "original": "legacy report item",
                "severity": "minor",
                "category": "legacy",
                "comment": "历史报告数据缺少新版逐句字段，已按兼容规则降级展示。",
                "correction": "建议按新版报告重新生成，可获得更完整的精改替换句。",
                "principle": "兼容旧报告时保留可读性，避免因 schema 升级导致已生成报告不可查看。",
                "risk_note": "该兼容项不作为新的高风险扣分判断。",
                "position_status": "unresolved",
            }
        )
    normalized["highlight_spans"] = normalized_spans

    raw_dimensions = dict(normalized.get("gaokao_dimensions") or {})
    dimensions: dict[str, dict] = {}
    for target_key, aliases in DIMENSION_ALIASES.items():
        source = next((raw_dimensions[key] for key in aliases if key in raw_dimensions), None)
        dimensions[target_key] = source or {"score": 3, "max": 5, "comment": "历史报告未包含该维度，新版报告将补齐。"}
    normalized["gaokao_dimensions"] = dimensions

    normalized.setdefault("overall_review", "这是一份历史完整报告，系统已按新版报告结构做兼容展示。")
    normalized.setdefault(
        "fatal_risks",
        [
            {"title": "历史报告兼容项", "severity": "minor", "explanation": "该报告生成于新版深度报告 Schema 之前。"},
            {"title": "建议查看逐句批改", "severity": "minor", "explanation": "新版报告会展示精改替换、提分原理和扣分风险。"},
            {"title": "可重新生成新版报告", "severity": "minor", "explanation": "后续诊断将直接使用新版震撼级完整报告结构。"},
        ],
    )
    normalized.setdefault("advanced_phrases", [])

    study_plan = list(normalized.get("study_plan") or [])
    while len(study_plan) < 3:
        study_plan.append({"priority": len(study_plan) + 1, "skill": "新版训练项", "exercise": "建议使用新版报告重新生成更完整的 7 天训练计划。"})
    normalized["study_plan"] = study_plan

    rewrites = dict(normalized.get("rewrites") or {})
    rewrites.setdefault("safe_version", "历史报告未包含稳妥版范文。")
    rewrites.setdefault("advanced_version", "历史报告未包含进阶版范文。")
    normalized["rewrites"] = rewrites
    normalized.setdefault("disclaimer", "本报告为 AI 辅助诊断，仅供学习训练参考，不代表正式考试成绩。")
    return normalized


def load_full_report(value: dict | None) -> FullReport | None:
    if not value:
        return None
    try:
        return FullReport.model_validate(value)
    except ValidationError:
        return FullReport.model_validate(normalize_legacy_full_report(value))


class PostgresRepository(InMemoryRepository):
    def __init__(self, database_url: str, merchant_codes: list[str]) -> None:
        super().__init__()
        self.database_url = database_url
        self._ensure_credit_tables()
        self._ensure_task_context_columns()
        self._ensure_merchants(merchant_codes)
        self._load()

    def _connect(self):
        return psycopg.connect(self.database_url, row_factory=dict_row)

    @staticmethod
    def _existing_marketing_attribution_id(cursor, value: str | None) -> UUID | None:
        attribution_id = uuid_or_none(value)
        if not attribution_id:
            return None
        cursor.execute("select 1 from marketing_attributions where id=%s", (attribution_id,))
        return attribution_id if cursor.fetchone() else None

    def _ensure_merchants(self, merchant_codes: list[str]) -> None:
        with self._connect() as conn, conn.cursor() as cursor:
            for code in merchant_codes:
                if not code:
                    continue
                cursor.execute(
                    """
                    insert into merchant_accounts (merchant_code, provider, enabled, daily_quota_cents, daily_used_cents)
                    values (%s, %s, true, %s, 0)
                    on conflict (merchant_code) do nothing
                    """,
                    (code, "wechat_alipay", 100_000_000),
                )
            conn.commit()

    def _ensure_task_context_columns(self) -> None:
        with self._connect() as conn, conn.cursor() as cursor:
            cursor.execute("alter table essay_drafts add column if not exists task_prompt text")
            cursor.execute("alter table essay_drafts add column if not exists task_type text")
            cursor.execute("alter table essay_drafts add column if not exists expected_word_count text")
            cursor.execute("alter table diagnosis_reports add column if not exists task_prompt text")
            cursor.execute("alter table diagnosis_reports add column if not exists task_type text")
            cursor.execute("alter table diagnosis_reports add column if not exists expected_word_count text")
            conn.commit()

    def _ensure_credit_tables(self) -> None:
        with self._connect() as conn, conn.cursor() as cursor:
            cursor.execute(
                """
                create table if not exists user_credit_accounts (
                  payer_contact_key text primary key,
                  total_credits integer not null default 0,
                  used_credits integer not null default 0,
                  last_order_id uuid references orders(id),
                  updated_at timestamptz not null default now()
                )
                """
            )
            cursor.execute(
                """
                create table if not exists credit_ledger (
                  id uuid primary key default gen_random_uuid(),
                  payer_contact_key text not null references user_credit_accounts(payer_contact_key),
                  order_id uuid references orders(id),
                  report_id uuid references diagnosis_reports(id),
                  change integer not null,
                  reason text not null,
                  balance_after integer not null,
                  created_at timestamptz not null default now()
                )
                """
            )
            cursor.execute("create index if not exists idx_credit_ledger_contact on credit_ledger(payer_contact_key)")
            cursor.execute("create index if not exists idx_credit_ledger_order on credit_ledger(order_id)")
            conn.commit()

    def _load(self) -> None:
        with self._connect() as conn, conn.cursor() as cursor:
            cursor.execute("select * from merchant_accounts")
            self.merchants = {
                row["id"]: MerchantAccount(
                    id=row["id"],
                    merchant_code=row["merchant_code"],
                    provider=row["provider"],
                    enabled=row["enabled"],
                    daily_quota_cents=row["daily_quota_cents"],
                    daily_used_cents=row["daily_used_cents"],
                    success_rate_1h=float(row["success_rate_1h"]),
                )
                for row in cursor.fetchall()
            }

            cursor.execute("select * from essay_drafts")
            for row in cursor.fetchall():
                self.drafts[row["id"]] = DraftRecord(
                    id=row["id"],
                    source_type=row["source_type"],
                    draft_status=row["draft_status"],
                    session_id=row["session_id"],
                    attribution_id=str(row["attribution_id"]) if row["attribution_id"] else None,
                    raw_input_text=row["raw_input_text"],
                    confirmed_text=row["confirmed_text"],
                    confirmed_text_hash=row["confirmed_text_hash"],
                    word_count=row["word_count"],
                    task_prompt=row.get("task_prompt"),
                    task_type=row.get("task_type"),
                    expected_word_count=row.get("expected_word_count"),
                    ocr_result=OcrResult.model_validate(row["ocr_result"]) if row["ocr_result"] else None,
                    original_image_object_id=row["original_image_object_id"],
                    created_at=row["created_at"],
                    updated_at=row["updated_at"],
                )

            cursor.execute("select * from upload_intents")
            for row in cursor.fetchall():
                self.upload_intents[row["id"]] = UploadIntentRecord(
                    id=row["id"],
                    draft_id=row["draft_id"],
                    bucket=row["bucket"],
                    object_key=row["object_key"],
                    mime_type=row["mime_type"],
                    size_bytes=row["size_bytes"],
                    completed=bool(row["completed_at"]),
                    created_at=row["created_at"],
                )

            cursor.execute("select * from storage_objects")
            for row in cursor.fetchall():
                self.storage_objects[row["id"]] = StorageObjectRecord(
                    id=row["id"],
                    upload_intent_id=row["upload_intent_id"],
                    draft_id=row["draft_id"],
                    bucket=row["bucket"],
                    object_key=row["object_key"],
                    mime_type=row["mime_type"],
                    size_bytes=row["size_bytes"],
                    sha256=row["sha256"],
                )

            cursor.execute("select * from diagnosis_reports")
            for row in cursor.fetchall():
                free_summary = FreeSummary.model_validate(row["free_summary"]) if row["free_summary"] else None
                full_report = load_full_report(row["full_report"])
                if free_summary:
                    self.free_summary_cache[row["confirmed_text_hash"]] = free_summary
                if full_report:
                    self.full_report_cache[row["confirmed_text_hash"]] = full_report
                    self.full_report_cache[str(row["id"])] = full_report
                self.reports[row["id"]] = ReportResponse(
                    id=row["id"],
                    draft_id=row["draft_id"],
                    source_type=row["source_type"],
                    status=row["status"],
                    confirmed_text=row["confirmed_text"],
                    confirmed_text_hash=row["confirmed_text_hash"],
                    word_count=row["word_count"],
                    task_prompt=row.get("task_prompt"),
                    task_type=row.get("task_type"),
                    expected_word_count=row.get("expected_word_count"),
                    free_summary=free_summary,
                    full_report=None,
                    is_unlocked=row["is_unlocked"],
                    retry_count=row["retry_count"],
                    last_retry_at=row["last_retry_at"],
                    created_at=row["created_at"],
                    updated_at=row["updated_at"],
                )

            cursor.execute("select * from group_buys")
            for row in cursor.fetchall():
                self.group_buys[row["id"]] = GroupBuyRecord(
                    id=row["id"],
                    required_members=row["required_members"],
                    paid_members=row["paid_members"],
                    group_price_cents=row["group_price_cents"],
                    status=row["status"],
                    official_assist_used=row["official_assist_used"],
                    expires_at=row["expires_at"],
                )

            cursor.execute("select * from orders")
            for row in cursor.fetchall():
                self.orders[row["id"]] = OrderRecord(
                    id=row["id"],
                    report_id=row["report_id"],
                    attribution_id=str(row["attribution_id"]) if row["attribution_id"] else None,
                    group_buy_id=row["group_buy_id"],
                    merchant_account_id=row["merchant_account_id"],
                    product_type=row["product_type"],
                    amount_cents=row["amount_cents"],
                    payer_contact=row["payer_contact"],
                    status=row["status"],
                    refund_status=row["refund_status"],
                    refund_reason=row["refund_reason"],
                    refund_amount_cents=row["refund_amount_cents"],
                    created_at=row["created_at"],
                    paid_at=row["paid_at"],
                    refunded_at=row["refunded_at"],
                    expires_at=row["expires_at"],
                )

            cursor.execute("select * from group_members")
            for row in cursor.fetchall():
                self.group_members[row["id"]] = GroupMemberRecord(
                    id=row["id"],
                    group_buy_id=row["group_buy_id"],
                    report_id=row["report_id"],
                    order_id=row["order_id"],
                    member_type=row["member_type"],
                    payment_status=row["payment_status"],
                    joined_at=row["joined_at"],
                )

            cursor.execute("select * from user_credit_accounts")
            for row in cursor.fetchall():
                self.credit_accounts[row["payer_contact_key"]] = UserCreditAccount(
                    payer_contact_key=row["payer_contact_key"],
                    total_credits=row["total_credits"],
                    used_credits=row["used_credits"],
                    last_order_id=row["last_order_id"],
                    updated_at=row["updated_at"],
                )

            cursor.execute("select * from credit_ledger")
            for row in cursor.fetchall():
                self.credit_ledger[row["id"]] = CreditLedgerRecord(
                    id=row["id"],
                    payer_contact_key=row["payer_contact_key"],
                    order_id=row["order_id"],
                    report_id=row["report_id"],
                    change=row["change"],
                    reason=row["reason"],
                    balance_after=row["balance_after"],
                    created_at=row["created_at"],
                )

    def create_draft(self, record: DraftRecord) -> DraftRecord:
        result = super().create_draft(record)
        with self._connect() as conn, conn.cursor() as cursor:
            cursor.execute(
                """
                insert into essay_drafts
                  (id, session_id, attribution_id, source_type, draft_status, raw_input_text, confirmed_text,
                   confirmed_text_hash, word_count, task_prompt, task_type, expected_word_count,
                   ocr_result, original_image_object_id, created_at, updated_at)
                values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    record.id,
                    record.session_id,
                    self._existing_marketing_attribution_id(cursor, record.attribution_id),
                    record.source_type,
                    record.draft_status,
                    record.raw_input_text,
                    record.confirmed_text,
                    record.confirmed_text_hash,
                    record.word_count,
                    record.task_prompt,
                    record.task_type,
                    record.expected_word_count,
                    Jsonb(record.ocr_result.model_dump(mode="json")) if record.ocr_result else None,
                    record.original_image_object_id,
                    record.created_at,
                    record.updated_at,
                ),
            )
            conn.commit()
        return result

    def create_upload_intent(self, record: UploadIntentRecord) -> UploadIntentRecord:
        result = super().create_upload_intent(record)
        with self._connect() as conn, conn.cursor() as cursor:
            cursor.execute(
                """
                insert into upload_intents (id, draft_id, bucket, object_key, mime_type, size_bytes, expires_at, created_at)
                values (%s,%s,%s,%s,%s,%s,now() + interval '5 minutes',%s)
                """,
                (record.id, record.draft_id, record.bucket, record.object_key, record.mime_type, record.size_bytes, record.created_at),
            )
            conn.commit()
        return result

    def complete_upload(self, intent_id: UUID, sha256: str | None = None) -> StorageObjectRecord:
        storage_object = super().complete_upload(intent_id, sha256)
        self.persist_all()
        return storage_object

    def upsert_report(self, report: ReportResponse) -> ReportResponse:
        result = super().upsert_report(report)
        full_report = self.full_report_cache.get(str(report.id)) or self.full_report_cache.get(report.confirmed_text_hash)
        with self._connect() as conn, conn.cursor() as cursor:
            cursor.execute(
                """
                insert into diagnosis_reports
                  (id, draft_id, source_type, status, confirmed_text, confirmed_text_hash, word_count,
                   task_prompt, task_type, expected_word_count, free_summary, full_report, is_unlocked,
                   retry_count, last_retry_at, created_at, updated_at)
                values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                on conflict (id) do update set
                  status = excluded.status,
                  task_prompt = excluded.task_prompt,
                  task_type = excluded.task_type,
                  expected_word_count = excluded.expected_word_count,
                  free_summary = excluded.free_summary,
                  full_report = excluded.full_report,
                  is_unlocked = excluded.is_unlocked,
                  retry_count = excluded.retry_count,
                  last_retry_at = excluded.last_retry_at,
                  updated_at = excluded.updated_at
                """,
                (
                    report.id,
                    report.draft_id,
                    report.source_type,
                    report.status,
                    report.confirmed_text,
                    report.confirmed_text_hash,
                    report.word_count,
                    report.task_prompt,
                    report.task_type,
                    report.expected_word_count,
                    Jsonb(report.free_summary.model_dump(mode="json")) if report.free_summary else None,
                    Jsonb(full_report.model_dump(mode="json")) if full_report else None,
                    report.is_unlocked,
                    report.retry_count,
                    report.last_retry_at,
                    report.created_at,
                    report.updated_at,
                ),
            )
            conn.commit()
        return result

    def create_order(self, order: OrderRecord) -> OrderRecord:
        result = super().create_order(order)
        with self._connect() as conn, conn.cursor() as cursor:
            cursor.execute(
                """
                insert into orders
                  (id, report_id, attribution_id, group_buy_id, merchant_account_id, product_type, amount_cents,
                   payer_contact, status, refund_status, refund_reason, refund_amount_cents, paid_at, refunded_at, expires_at, created_at)
                values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    order.id,
                    order.report_id,
                    self._existing_marketing_attribution_id(cursor, order.attribution_id),
                    order.group_buy_id,
                    order.merchant_account_id,
                    order.product_type,
                    order.amount_cents,
                    order.payer_contact,
                    order.status,
                    order.refund_status,
                    order.refund_reason,
                    order.refund_amount_cents,
                    order.paid_at,
                    order.refunded_at,
                    order.expires_at,
                    order.created_at,
                ),
            )
            conn.commit()
        return result

    def upsert_credit_account(self, account: UserCreditAccount) -> UserCreditAccount:
        result = super().upsert_credit_account(account)
        with self._connect() as conn, conn.cursor() as cursor:
            cursor.execute(
                """
                insert into user_credit_accounts (payer_contact_key, total_credits, used_credits, last_order_id, updated_at)
                values (%s,%s,%s,%s,%s)
                on conflict (payer_contact_key) do update set
                  total_credits=excluded.total_credits,
                  used_credits=excluded.used_credits,
                  last_order_id=excluded.last_order_id,
                  updated_at=excluded.updated_at
                """,
                (account.payer_contact_key, account.total_credits, account.used_credits, account.last_order_id, account.updated_at),
            )
            conn.commit()
        return result

    def add_credit_ledger(self, record: CreditLedgerRecord) -> CreditLedgerRecord:
        result = super().add_credit_ledger(record)
        with self._connect() as conn, conn.cursor() as cursor:
            cursor.execute(
                """
                insert into credit_ledger
                  (id, payer_contact_key, order_id, report_id, change, reason, balance_after, created_at)
                values (%s,%s,%s,%s,%s,%s,%s,%s)
                on conflict (id) do nothing
                """,
                (
                    record.id,
                    record.payer_contact_key,
                    record.order_id,
                    record.report_id,
                    record.change,
                    record.reason,
                    record.balance_after,
                    record.created_at,
                ),
            )
            conn.commit()
        return result

    def add_group_member(self, member: GroupMemberRecord) -> GroupMemberRecord:
        result = super().add_group_member(member)
        with self._connect() as conn, conn.cursor() as cursor:
            cursor.execute(
                """
                insert into group_members (id, group_buy_id, report_id, order_id, member_type, payment_status, joined_at)
                values (%s,%s,%s,%s,%s,%s,%s)
                on conflict (id) do nothing
                """,
                (member.id, member.group_buy_id, member.report_id, member.order_id, member.member_type, member.payment_status, member.joined_at),
            )
            conn.commit()
        return result

    def add_support_action(self, action: str, report_id: UUID | None = None, order_id: UUID | None = None, message: str | None = None) -> None:
        super().add_support_action(action, report_id, order_id, message)
        with self._connect() as conn, conn.cursor() as cursor:
            cursor.execute(
                "insert into support_actions (report_id, order_id, action, message, created_at) values (%s,%s,%s,%s,%s)",
                (report_id, order_id, action, message, utcnow()),
            )
            conn.commit()

    def persist_all(self) -> None:
        with self._connect() as conn, conn.cursor() as cursor:
            for draft in self.drafts.values():
                cursor.execute(
                    """
                    update essay_drafts set
                      draft_status=%s, confirmed_text=%s, confirmed_text_hash=%s, word_count=%s,
                      task_prompt=%s, task_type=%s, expected_word_count=%s,
                      ocr_result=%s, original_image_object_id=%s, updated_at=%s
                    where id=%s
                    """,
                    (
                        draft.draft_status,
                        draft.confirmed_text,
                        draft.confirmed_text_hash,
                        draft.word_count,
                        draft.task_prompt,
                        draft.task_type,
                        draft.expected_word_count,
                        Jsonb(draft.ocr_result.model_dump(mode="json")) if draft.ocr_result else None,
                        draft.original_image_object_id,
                        draft.updated_at,
                        draft.id,
                    ),
                )
            for upload in self.upload_intents.values():
                if upload.completed:
                    cursor.execute("update upload_intents set completed_at = coalesce(completed_at, now()) where id=%s", (upload.id,))
            for obj in self.storage_objects.values():
                cursor.execute(
                    """
                    insert into storage_objects (id, upload_intent_id, draft_id, bucket, object_key, mime_type, size_bytes, sha256)
                    values (%s,%s,%s,%s,%s,%s,%s,%s)
                    on conflict (id) do nothing
                    """,
                    (obj.id, obj.upload_intent_id, obj.draft_id, obj.bucket, obj.object_key, obj.mime_type, obj.size_bytes, obj.sha256),
                )
            for report in self.reports.values():
                full_report = self.full_report_cache.get(str(report.id)) or self.full_report_cache.get(report.confirmed_text_hash)
                cursor.execute(
                    """
                    update diagnosis_reports set
                      status=%s, free_summary=%s, full_report=%s, is_unlocked=%s,
                      task_prompt=%s, task_type=%s, expected_word_count=%s,
                      retry_count=%s, last_retry_at=%s, updated_at=%s
                    where id=%s
                    """,
                    (
                        report.status,
                        Jsonb(report.free_summary.model_dump(mode="json")) if report.free_summary else None,
                        Jsonb(full_report.model_dump(mode="json")) if full_report else None,
                        report.is_unlocked,
                        report.task_prompt,
                        report.task_type,
                        report.expected_word_count,
                        report.retry_count,
                        report.last_retry_at,
                        report.updated_at,
                        report.id,
                    ),
                )
            for merchant in self.merchants.values():
                cursor.execute(
                    "update merchant_accounts set enabled=%s, daily_quota_cents=%s, daily_used_cents=%s, success_rate_1h=%s where id=%s",
                    (merchant.enabled, merchant.daily_quota_cents, merchant.daily_used_cents, merchant.success_rate_1h, merchant.id),
                )
            for group in self.group_buys.values():
                cursor.execute(
                    """
                    insert into group_buys (id, required_members, paid_members, group_price_cents, status, official_assist_used, expires_at)
                    values (%s,%s,%s,%s,%s,%s,%s)
                    on conflict (id) do update set
                      paid_members=excluded.paid_members,
                      status=excluded.status,
                      official_assist_used=excluded.official_assist_used
                    """,
                    (group.id, group.required_members, group.paid_members, group.group_price_cents, group.status, group.official_assist_used, group.expires_at),
                )
            for member in self.group_members.values():
                cursor.execute(
                    """
                    insert into group_members (id, group_buy_id, report_id, order_id, member_type, payment_status, joined_at)
                    values (%s,%s,%s,%s,%s,%s,%s)
                    on conflict (id) do update set payment_status=excluded.payment_status
                    """,
                    (member.id, member.group_buy_id, member.report_id, member.order_id, member.member_type, member.payment_status, member.joined_at),
                )
            for order in self.orders.values():
                cursor.execute(
                    """
                    update orders set
                      status=%s, refund_status=%s, refund_reason=%s, refund_amount_cents=%s,
                      paid_at=%s, refunded_at=%s
                    where id=%s
                    """,
                    (
                        order.status,
                        order.refund_status,
                        order.refund_reason,
                        order.refund_amount_cents,
                        order.paid_at,
                        order.refunded_at,
                        order.id,
                    ),
                )
            for order_id, event_name in self.conversion_events:
                order = self.orders.get(order_id)
                if not order:
                    continue
                cursor.execute(
                    """
                    insert into conversion_events (order_id, attribution_id, event_name, amount_cents, currency, delivery_status)
                    values (%s,%s,%s,%s,'CNY','PENDING')
                    on conflict (order_id, event_name) do nothing
                    """,
                    (order.id, self._existing_marketing_attribution_id(cursor, order.attribution_id), event_name, order.amount_cents),
                )
            for account in self.credit_accounts.values():
                cursor.execute(
                    """
                    insert into user_credit_accounts (payer_contact_key, total_credits, used_credits, last_order_id, updated_at)
                    values (%s,%s,%s,%s,%s)
                    on conflict (payer_contact_key) do update set
                      total_credits=excluded.total_credits,
                      used_credits=excluded.used_credits,
                      last_order_id=excluded.last_order_id,
                      updated_at=excluded.updated_at
                    """,
                    (account.payer_contact_key, account.total_credits, account.used_credits, account.last_order_id, account.updated_at),
                )
            for record in self.credit_ledger.values():
                cursor.execute(
                    """
                    insert into credit_ledger
                      (id, payer_contact_key, order_id, report_id, change, reason, balance_after, created_at)
                    values (%s,%s,%s,%s,%s,%s,%s,%s)
                    on conflict (id) do nothing
                    """,
                    (
                        record.id,
                        record.payer_contact_key,
                        record.order_id,
                        record.report_id,
                        record.change,
                        record.reason,
                        record.balance_after,
                        record.created_at,
                    ),
                )
            conn.commit()
