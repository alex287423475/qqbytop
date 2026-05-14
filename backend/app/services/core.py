from __future__ import annotations

from datetime import timedelta
from uuid import UUID, uuid4

from app.adapters.llm import LlmRouter
from app.adapters.ocr import build_ocr_adapter
from app.adapters.payment import MockPaymentProvider
from app.adapters.storage import build_storage_adapter
from app.adapters.support_llm import SupportAssistantLLM
from app.config import Settings, get_settings
from app.models.schemas import (
    ESSAY_CREDIT_PACK_CREDITS,
    ESSAY_CREDIT_PACK_PRODUCT,
    GROUP_ESSAY_CREDIT_PACK_PRODUCT,
    LEGACY_GROUP_PRODUCT,
    LEGACY_SINGLE_PRODUCT,
    CompleteUploadRequest,
    CompleteUploadResponse,
    ConfirmTextResponse,
    CreateDraftImageRequest,
    CreateDraftRequest,
    CreateDraftResponse,
    CreateOrderRequest,
    CreateOrderResponse,
    CreateReportRequest,
    CreateReportResponse,
    CreateUploadIntentRequest,
    CreateUploadIntentResponse,
    CreditLedgerRecord,
    FunnelResponse,
    GroupBuyRecord,
    GroupMemberRecord,
    OrderRecord,
    RecognitionResponse,
    RefundRequestResponse,
    ReportResponse,
    SmartAppealResponse,
    SupportChatResponse,
    UnlockWithCreditResponse,
    UserCreditAccount,
    WebhookResponse,
    utcnow,
)
from app.services.postgres_repository import PostgresRepository
from app.services.repository import DraftRecord, InMemoryRepository, UploadIntentRecord
from app.services.security import sign_draft_token, verify_draft_token
from app.services.text_utils import confirmed_text_hash, validate_essay_text


class GaokaoEssayService:
    def __init__(self, repository: InMemoryRepository, settings: Settings) -> None:
        self.repo = repository
        self.settings = settings
        self.storage = build_storage_adapter(settings)
        self.ocr = build_ocr_adapter(settings, self.storage)
        self.llm = LlmRouter(settings.llm_provider_list, settings)
        self.support_llm = SupportAssistantLLM(settings)
        if settings.payment_provider != "mock":
            raise RuntimeError("Real payment/refund adapter is not configured yet. Provide WeChat/Alipay merchant credentials and SDK mode before enabling paid production traffic.")
        self.payment = MockPaymentProvider()

    @staticmethod
    def _is_single_pack(product_type: str) -> bool:
        return product_type in {ESSAY_CREDIT_PACK_PRODUCT, LEGACY_SINGLE_PRODUCT}

    @staticmethod
    def _is_group_pack(product_type: str) -> bool:
        return product_type in {GROUP_ESSAY_CREDIT_PACK_PRODUCT, LEGACY_GROUP_PRODUCT}

    @staticmethod
    def _payer_key(payer_contact: str) -> str:
        return payer_contact.strip().lower()

    def verify_draft_access(self, draft_id: UUID, token: str | None) -> None:
        if not token:
            raise PermissionError("draft_token is required.")
        verify_draft_token(token, draft_id=draft_id, secret=self.settings.draft_token_secret)

    def create_draft(self, request: CreateDraftRequest, session_id: str) -> CreateDraftResponse:
        if isinstance(request, CreateDraftImageRequest):
            draft = DraftRecord(
                id=uuid4(),
                source_type="image",
                draft_status="IMAGE_DRAFT_CREATED",
                session_id=session_id,
                attribution_id=request.attribution_id,
            )
            self.repo.create_draft(draft)
            token = sign_draft_token(
                draft_id=draft.id,
                session_id=session_id,
                secret=self.settings.draft_token_secret,
                ttl_seconds=self.settings.draft_token_ttl_seconds,
            )
            return CreateDraftResponse(draft_id=draft.id, draft_token=token, confirmed=False, next_step="upload_image")

        normalized, word_count = validate_essay_text(request.raw_input_text)
        text_hash = confirmed_text_hash(normalized)
        draft = DraftRecord(
            id=uuid4(),
            source_type="text",
            draft_status="TEXT_CONFIRMED",
            session_id=session_id,
            attribution_id=request.attribution_id,
            raw_input_text=normalized,
            confirmed_text=normalized,
            confirmed_text_hash=text_hash,
            word_count=word_count,
        )
        self.repo.create_draft(draft)
        token = sign_draft_token(
            draft_id=draft.id,
            session_id=session_id,
            secret=self.settings.draft_token_secret,
            ttl_seconds=self.settings.draft_token_ttl_seconds,
        )
        return CreateDraftResponse(draft_id=draft.id, draft_token=token, confirmed=True, next_step="create_report", word_count=word_count)

    def create_upload_intent(self, request: CreateUploadIntentRequest, token: str | None) -> CreateUploadIntentResponse:
        self.verify_draft_access(request.draft_id, token)
        draft = self.repo.drafts.get(request.draft_id)
        if not draft:
            raise ValueError("Draft does not exist.")
        if request.mime_type not in {"image/jpeg", "image/png", "image/webp"}:
            raise ValueError("Only JPG, PNG and WEBP are accepted. Convert HEIC to JPEG on the frontend first.")
        upload_url, bucket, object_key, expires_at = self.storage.create_presigned_put(draft_id=str(request.draft_id), file_name=request.file_name)
        intent = UploadIntentRecord(
            id=uuid4(),
            draft_id=request.draft_id,
            bucket=bucket,
            object_key=object_key,
            mime_type=request.mime_type,
            size_bytes=request.size_bytes,
        )
        self.repo.create_upload_intent(intent)
        return CreateUploadIntentResponse(upload_intent_id=intent.id, upload_url=upload_url, bucket=bucket, object_key=object_key, expires_at=expires_at)

    def complete_upload(self, upload_intent_id: UUID, request: CompleteUploadRequest, token: str | None) -> CompleteUploadResponse:
        intent = self.repo.upload_intents.get(upload_intent_id)
        if not intent:
            raise ValueError("Upload intent does not exist.")
        self.verify_draft_access(intent.draft_id, token)
        if request.object_key != intent.object_key or request.bucket != intent.bucket:
            raise ValueError("Uploaded object does not match the signed upload intent.")

        storage_object = self.repo.complete_upload(upload_intent_id, sha256=request.sha256)
        draft = self.repo.drafts[storage_object.draft_id]
        draft.ocr_result = self.ocr.recognize(bucket=storage_object.bucket, object_key=storage_object.object_key)
        draft.draft_status = "OCR_COMPLETED"
        draft.updated_at = utcnow()
        self.repo.persist_all()
        return CompleteUploadResponse(draft_id=draft.id, image_object_id=storage_object.id, recognition_status="COMPLETED")

    def get_recognition(self, draft_id: UUID, token: str | None) -> RecognitionResponse:
        self.verify_draft_access(draft_id, token)
        draft = self.repo.drafts.get(draft_id)
        if not draft:
            raise ValueError("Draft does not exist.")
        if not draft.ocr_result:
            return RecognitionResponse(draft_id=draft_id, recognition_status="NOT_STARTED", message="OCR has not completed yet.")
        return RecognitionResponse(draft_id=draft_id, recognition_status="COMPLETED", ocr_result=draft.ocr_result)

    def confirm_text(self, draft_id: UUID, confirmed_text: str, token: str | None) -> ConfirmTextResponse:
        self.verify_draft_access(draft_id, token)
        draft = self.repo.drafts.get(draft_id)
        if not draft:
            raise ValueError("Draft does not exist.")
        normalized, word_count = validate_essay_text(confirmed_text)
        draft.confirmed_text = normalized
        draft.confirmed_text_hash = confirmed_text_hash(normalized)
        draft.word_count = word_count
        draft.draft_status = "TEXT_CONFIRMED"
        draft.updated_at = utcnow()
        self.repo.persist_all()
        return ConfirmTextResponse(draft_id=draft.id, confirmed=True, word_count=word_count, confirmed_text_hash=draft.confirmed_text_hash)

    def create_report(self, request: CreateReportRequest, token: str | None) -> CreateReportResponse:
        self.verify_draft_access(request.draft_id, token)
        draft = self.repo.drafts.get(request.draft_id)
        if not draft or not draft.confirmed_text or not draft.confirmed_text_hash or not draft.word_count:
            raise ValueError("Draft text has not been confirmed.")

        report_id = uuid4()
        status = "FAILED" if request.mock_strategy == "failed" else "QUEUED" if request.mock_strategy == "delayed" else "COMPLETED"
        free_summary = None
        full_report = None
        if status != "FAILED":
            if draft.confirmed_text_hash in self.repo.free_summary_cache:
                free_summary = self.repo.free_summary_cache[draft.confirmed_text_hash]
                full_report = self.repo.full_report_cache[draft.confirmed_text_hash]
            else:
                free_summary, full_report, _ = self.llm.diagnose(essay_text=draft.confirmed_text, word_count=draft.word_count, source_type=draft.source_type)
                self.repo.free_summary_cache[draft.confirmed_text_hash] = free_summary
                self.repo.full_report_cache[draft.confirmed_text_hash] = full_report

        report = ReportResponse(
            id=report_id,
            draft_id=draft.id,
            source_type=draft.source_type,
            status=status,
            confirmed_text=draft.confirmed_text,
            confirmed_text_hash=draft.confirmed_text_hash,
            word_count=draft.word_count,
            free_summary=free_summary,
            full_report=None,
            is_unlocked=False,
            created_at=utcnow(),
            updated_at=utcnow(),
        )
        self.repo.upsert_report(report)
        if full_report:
            self.repo.full_report_cache[draft.confirmed_text_hash] = full_report
        return CreateReportResponse(report_id=report_id, status=status, queue_position=1 if status == "QUEUED" else None)

    def get_report(self, report_id: UUID) -> ReportResponse:
        report = self.repo.reports.get(report_id)
        if not report:
            raise ValueError("Report does not exist.")
        if report.is_unlocked:
            full_report = self.repo.full_report_cache.get(report.confirmed_text_hash)
            if full_report:
                report.full_report = full_report
        else:
            report.full_report = None
        return report

    def create_order(self, request: CreateOrderRequest) -> CreateOrderResponse:
        report = self.repo.reports.get(request.report_id)
        if not report:
            raise ValueError("Report does not exist.")
        if not (self._is_single_pack(request.product_type) or self._is_group_pack(request.product_type)):
            raise ValueError("Unsupported product_type.")
        if not request.payer_contact or not self._valid_payer_contact(request.payer_contact):
            raise ValueError("支付前需要先绑定手机号或邮箱，仅用于报告找回和订单异常处理。")

        is_group_order = self._is_group_pack(request.product_type)
        amount = self.settings.gaokao_essay_group_price_cents if is_group_order else self.settings.gaokao_essay_single_price_cents
        group: GroupBuyRecord | None = None
        if is_group_order:
            if request.group_buy_id:
                group = self.repo.group_buys.get(request.group_buy_id)
                if not group or group.status != "OPEN":
                    raise ValueError("Group buy is not available.")
            else:
                group = GroupBuyRecord(
                    required_members=self.settings.gaokao_essay_group_required_members,
                    group_price_cents=amount,
                    expires_at=utcnow() + timedelta(hours=self.settings.gaokao_essay_group_expires_hours),
                )
                self.repo.group_buys[group.id] = group
                self.repo.persist_all()

        merchant = self.payment.select_merchant(self.repo, amount)
        order = OrderRecord(
            report_id=request.report_id,
            attribution_id=request.attribution_id,
            group_buy_id=group.id if group else None,
            merchant_account_id=merchant.id,
            product_type=request.product_type,
            amount_cents=amount,
            payer_contact=request.payer_contact.strip(),
        )
        self.repo.create_order(order)
        if group:
            self.repo.add_group_member(
                GroupMemberRecord(
                    group_buy_id=group.id,
                    report_id=request.report_id,
                    order_id=order.id,
                    member_type="REAL",
                    payment_status="PENDING",
                )
            )
        self.repo.unlock_clicks += 1
        return CreateOrderResponse(
            order_id=order.id,
            order_status=order.status,
            product_type=order.product_type,
            amount_cents=order.amount_cents,
            payment_url=self.payment.create_payment_url(order, merchant),
            merchant_account_id=merchant.id,
            merchant_code=merchant.merchant_code,
            group_buy_id=group.id if group else None,
            credit_granted=ESSAY_CREDIT_PACK_CREDITS,
        )

    @staticmethod
    def _valid_payer_contact(value: str) -> bool:
        contact = value.strip()
        if "@" in contact:
            local, _, domain = contact.partition("@")
            return bool(local and "." in domain and len(contact) <= 120)
        digits = "".join(char for char in contact if char.isdigit())
        return 6 <= len(digits) <= 15

    def mark_order_paid(self, order_id: UUID) -> OrderRecord:
        order = self.payment.mark_paid(self.repo, order_id)
        if self._is_group_pack(order.product_type):
            self._mark_group_member_paid(order)
        else:
            self._grant_credit_pack_and_unlock(order)
        key = (order.id, "Purchase")
        if key not in self.repo.conversion_events:
            self.repo.conversion_events.add(key)
        self.repo.persist_all()
        return order

    def _grant_credit_pack_and_unlock(self, order: OrderRecord) -> UserCreditAccount:
        if not order.payer_contact:
            raise ValueError("Order is missing payer_contact.")
        key = self._payer_key(order.payer_contact)
        account = self.repo.credit_accounts.get(key) or UserCreditAccount(payer_contact_key=key)

        already_granted = any(item.order_id == order.id and item.reason == "PACK_PURCHASE" for item in self.repo.credit_ledger.values())
        if not already_granted:
            account.total_credits += ESSAY_CREDIT_PACK_CREDITS
            account.last_order_id = order.id
            account.updated_at = utcnow()
            self.repo.upsert_credit_account(account)
            self.repo.add_credit_ledger(
                CreditLedgerRecord(
                    payer_contact_key=key,
                    order_id=order.id,
                    change=ESSAY_CREDIT_PACK_CREDITS,
                    reason="PACK_PURCHASE",
                    balance_after=account.remaining_credits,
                )
            )

        self._unlock_report_by_credit_account(order.report_id, account, order_id=order.id, reason="CURRENT_REPORT_UNLOCK")
        return account

    def _unlock_report_by_credit_account(
        self,
        report_id: UUID,
        account: UserCreditAccount,
        order_id: UUID | None = None,
        reason: str = "REPORT_CREDIT_UNLOCK",
    ) -> UserCreditAccount:
        report = self.repo.reports.get(report_id)
        if not report:
            raise ValueError("Report does not exist.")
        if report.is_unlocked:
            return account
        if account.remaining_credits <= 0:
            raise ValueError("No diagnosis credits remaining.")
        report.is_unlocked = True
        report.updated_at = utcnow()
        account.used_credits += 1
        account.updated_at = utcnow()
        self.repo.upsert_credit_account(account)
        self.repo.add_credit_ledger(
            CreditLedgerRecord(
                payer_contact_key=account.payer_contact_key,
                order_id=order_id,
                report_id=report_id,
                change=-1,
                reason=reason,
                balance_after=account.remaining_credits,
            )
        )
        return account

    def unlock_report_with_credit(self, report_id: UUID, payer_contact: str) -> UnlockWithCreditResponse:
        if not self._valid_payer_contact(payer_contact):
            raise ValueError("A valid phone number or email is required.")
        key = self._payer_key(payer_contact)
        account = self.repo.credit_accounts.get(key)
        if not account or account.remaining_credits <= 0:
            raise ValueError("No diagnosis credits remaining.")
        account = self._unlock_report_by_credit_account(report_id, account)
        self.repo.persist_all()
        return UnlockWithCreditResponse(report_id=report_id, is_unlocked=True, credit_remaining=account.remaining_credits)

    def _mark_group_member_paid(self, order: OrderRecord) -> None:
        if not order.group_buy_id:
            raise ValueError("Group order is missing group_buy_id.")
        group = self.repo.group_buys.get(order.group_buy_id)
        if not group:
            raise ValueError("Group buy does not exist.")
        for member in self.repo.group_members.values():
            if member.order_id == order.id:
                member.payment_status = "PAID"
                break
        paid_real_members = [
            member
            for member in self.repo.group_members.values()
            if member.group_buy_id == group.id and member.member_type == "REAL" and member.payment_status == "PAID"
        ]
        assisted_members = [
            member
            for member in self.repo.group_members.values()
            if member.group_buy_id == group.id and member.member_type == "PLATFORM_ASSIST" and member.payment_status == "ASSISTED"
        ]
        group.paid_members = len(paid_real_members) + len(assisted_members)
        if group.paid_members >= group.required_members:
            self._complete_group(group.id)

    def apply_official_assist(self, group_buy_id: UUID) -> GroupBuyRecord:
        group = self.repo.group_buys.get(group_buy_id)
        if not group:
            raise ValueError("Group buy does not exist.")
        if group.status != "OPEN":
            return group
        if group.official_assist_used:
            return group
        paid_real_count = sum(
            1
            for member in self.repo.group_members.values()
            if member.group_buy_id == group.id and member.member_type == "REAL" and member.payment_status == "PAID"
        )
        if paid_real_count < group.required_members - 1:
            raise ValueError("Official assist is only allowed when the group is missing one member.")
        group.official_assist_used = True
        self.repo.add_group_member(
            GroupMemberRecord(
                group_buy_id=group.id,
                member_type="PLATFORM_ASSIST",
                payment_status="ASSISTED",
            )
        )
        group.paid_members = paid_real_count + 1
        if group.paid_members >= group.required_members:
            self._complete_group(group.id)
        self.repo.add_support_action("OFFICIAL_ASSIST_APPLIED", message=f"group_buy_id={group.id}")
        self.repo.persist_all()
        return group

    def _complete_group(self, group_buy_id: UUID) -> None:
        group = self.repo.group_buys[group_buy_id]
        group.status = "SUCCESS"
        for member in self.repo.group_members.values():
            if member.group_buy_id != group_buy_id or member.member_type != "REAL" or member.payment_status != "PAID" or not member.report_id:
                continue
            if member.order_id and member.order_id in self.repo.orders:
                order = self.repo.orders[member.order_id]
                self._grant_credit_pack_and_unlock(order)
                order.status = "GROUP_SUCCESS"

    def webhook(self, merchant_code: str, payload: dict[str, str]) -> WebhookResponse:
        order_id_raw = payload.get("order_id")
        if not order_id_raw:
            return WebhookResponse()
        order = self.repo.orders.get(UUID(order_id_raw))
        if not order:
            return WebhookResponse()
        merchant = self.repo.merchants[order.merchant_account_id]
        if merchant.merchant_code != merchant_code:
            self.repo.add_support_action("WEBHOOK_MERCHANT_MISMATCH", order_id=order.id)
            return WebhookResponse()
        self.mark_order_paid(order.id)
        return WebhookResponse()

    def smart_appeal(self, report_id: UUID) -> SmartAppealResponse:
        report = self.repo.reports.get(report_id)
        if not report:
            raise ValueError("Report does not exist.")
        self.repo.add_support_action("SMART_APPEAL_CLICKED", report_id=report_id)
        if report.status == "COMPLETED":
            return SmartAppealResponse(
                status_synced=True,
                retry_triggered=False,
                refund_triggered=False,
                current_report_status=report.status,
                message="Report has already been generated.",
            )
        if report.retry_count < self.settings.report_max_retry_count:
            report.retry_count += 1
            report.last_retry_at = utcnow()
            report.status = "COMPLETED"
            report.free_summary, full_report, _ = self.llm.diagnose(
                essay_text=report.confirmed_text,
                word_count=report.word_count,
                source_type=report.source_type,
            )
            self.repo.full_report_cache[report.confirmed_text_hash] = full_report
            self.repo.add_support_action("REPORT_RETRY_TRIGGERED", report_id=report_id)
            self.repo.persist_all()
            return SmartAppealResponse(
                status_synced=True,
                retry_triggered=True,
                refund_triggered=False,
                current_report_status=report.status,
                message="Report generation was retried successfully.",
            )
        return SmartAppealResponse(
            status_synced=True,
            retry_triggered=False,
            refund_triggered=True,
            current_report_status=report.status,
            message="Retry limit reached. The order can enter refund handling when it meets the timeout rule.",
        )

    def refund_request(self, order_id: UUID, reason: str) -> RefundRequestResponse:
        order = self.repo.orders.get(order_id)
        if not order:
            raise ValueError("Order does not exist.")
        report = self.repo.reports.get(order.report_id)
        self.repo.add_support_action("USER_REFUND_CLICKED", report_id=order.report_id, order_id=order.id, message=reason)
        if report and report.is_unlocked and report.status == "COMPLETED":
            self.repo.add_support_action("REFUND_REJECTED_BY_RULE", report_id=order.report_id, order_id=order.id)
            return RefundRequestResponse(
                refund_triggered=False,
                refund_status=order.refund_status,
                message="The report has been generated and unlocked. Automatic instant refund is not triggered by this rule.",
            )
        if order.refund_status in {"REQUESTED", "REFUNDED"}:
            return RefundRequestResponse(refund_triggered=False, refund_status=order.refund_status, message="Refund request is already being processed.")

        order.refund_status = "REQUESTED"
        order.refund_reason = reason
        order.refund_amount_cents = order.amount_cents
        if self.payment.refund(order):
            order.status = "REFUNDED"
            order.refund_status = "REFUNDED"
            order.refunded_at = utcnow()
        else:
            order.refund_status = "REFUND_FAILED"
        self.repo.add_support_action("AUTO_REFUND_TRIGGERED", report_id=order.report_id, order_id=order.id)
        self.repo.persist_all()
        return RefundRequestResponse(refund_triggered=True, refund_status=order.refund_status, message="Refund status has been updated.")

    def _legacy_support_chat(self, message: str) -> SupportChatResponse:
        self.repo.add_support_action("AI_SUPPORT_MESSAGE_SENT", message=message[:120])
        lowered = message.lower()
        if "退款" in message or "refund" in lowered or "未出报告" in message:
            return SupportChatResponse(
                message="可以使用“智能申诉与重试”或“订单异常 / 申请退款”。系统会先检查订单和报告状态，再决定是否重试或退款。",
                suggested_actions=["trigger_smart_appeal", "show_refund_policy"],
            )
        if "图片" in message or "ocr" in lowered:
            return SupportChatResponse(
                message="图片诊断需要先直传云存储，再识别为文本并进入校对页。请确认文字后再生成报告。",
                suggested_actions=["show_upload_help"],
            )
        return SupportChatResponse(
            message="我可以说明上传、OCR 校对、报告等待、退款规则和历史报告找回。订单处理以系统状态机为准。",
            suggested_actions=["show_refund_policy"],
        )

    def support_chat(self, message: str) -> SupportChatResponse:
        self.repo.add_support_action("AI_SUPPORT_MESSAGE_SENT", message=message[:120])
        normalized = message.lower()
        if any(keyword in normalized for keyword in ["退款", "refund", "未出", "没出", "未生成", "扣费", "扣款", "未解锁", "没解锁", "没有解锁", "支付成功", "付了钱", "失败"]):
            return SupportChatResponse(
                message="我会先帮您检查订单和报告状态。若支付已成功但报告仍未解锁，请点击“智能申诉与重试”。系统会自动同步支付状态、检查诊断任务，并在仍无法交付时进入退款或补发权益流程。12 小时内完成核实，符合规则的订单将原路退款或补发权益。",
                suggested_actions=["trigger_smart_appeal", "show_refund_policy"],
            )
        if any(keyword in normalized for keyword in ["图片", "拍照", "ocr", "识别", "提取文字", "微信", "相册", "乱码"]):
            return SupportChatResponse(
                message="首版建议先使用微信或手机相册的“提取文字”功能：拍照后长按图片，选择“提取文字”，简单校对英文内容，再复制到作文输入框。这样通常比网页 OCR 更快，也能减少手写误识别导致的诊断偏差。",
                suggested_actions=["show_upload_help"],
            )
        if any(keyword in normalized for keyword in ["99", "53", "组队", "拼团", "20篇", "20 篇", "额度", "套餐", "权益"]):
            return SupportChatResponse(
                message="99 元为 20 篇深度精诊额度包；53 元/人为三人同学组队 20 篇额度包。购买后当前报告会立即消耗 1 篇额度并解锁，剩余额度可用于后续作文。20 篇额度不是无限次，不是月卡，也不会按天或按月自动重置。",
                suggested_actions=["show_pricing_rules"],
            )
        if any(keyword in normalized for keyword in ["人工", "客服", "联系", "工单", "售后"]):
            return SupportChatResponse(
                message="我是系统护航助手，可以解释产品权益、引导智能申诉与重试、说明退款或补发权益条件。若连续处理后仍无法解决，系统会引导您提交售后保障工单；符合规则的订单将原路退款或补发权益。",
                suggested_actions=["create_support_ticket", "show_refund_policy"],
            )
        llm_answer = self.support_llm.answer(message)
        if llm_answer:
            return SupportChatResponse(
                message=llm_answer,
                suggested_actions=["show_refund_policy"],
            )
        return SupportChatResponse(
            message="您好，我是系统护航助手。可以说明 99 元/53 元 20 篇额度包、免费摘要与完整报告区别、微信提取文字流程、智能申诉与重试、退款或补发权益规则。订单处理以系统状态机和审计记录为准。",
            suggested_actions=["show_pricing_rules", "show_refund_policy"],
        )

    def funnel(self) -> FunnelResponse:
        orders = list(self.repo.orders.values())
        paid = [order for order in orders if order.status in {"PAID", "GROUP_SUCCESS", "REFUNDED"}]
        refunds = [order for order in orders if order.refund_status == "REFUNDED"]
        gross = sum(order.amount_cents for order in paid)
        refund_total = sum(order.refund_amount_cents or 0 for order in refunds)
        return FunnelResponse(
            visits=self.repo.marketing_attribution_count,
            drafts=len(self.repo.drafts),
            reports_completed=sum(1 for report in self.repo.reports.values() if report.status == "COMPLETED"),
            unlock_clicks=self.repo.unlock_clicks,
            orders=len(orders),
            paid_orders=len(paid),
            refunds=len(refunds),
            gross_revenue_cents=gross,
            net_revenue_cents=gross - refund_total,
        )


def build_repository(settings: Settings) -> InMemoryRepository:
    if settings.repository_provider == "postgres":
        if not settings.database_url:
            raise RuntimeError("DATABASE_URL is required for PostgreSQL repository.")
        merchant_codes = [item.strip() for item in (settings.payment_merchant_codes or "mch_a,mch_b,mch_c").split(",") if item.strip()]
        return PostgresRepository(settings.database_url, merchant_codes)
    return InMemoryRepository()


settings = get_settings()
repo = build_repository(settings)
service = GaokaoEssayService(repo, settings)
