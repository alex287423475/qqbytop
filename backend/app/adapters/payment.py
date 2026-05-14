from __future__ import annotations

from uuid import UUID

from app.models.schemas import MerchantAccount, OrderRecord, utcnow
from app.services.repository import InMemoryRepository


class MockPaymentProvider:
    def select_merchant(self, repo: InMemoryRepository, amount_cents: int) -> MerchantAccount:
        enabled = [merchant for merchant in repo.merchants.values() if merchant.enabled]
        if not enabled:
            raise ValueError("没有可用商户号。")
        enabled.sort(key=lambda merchant: (merchant.daily_used_cents, merchant.merchant_code))
        for merchant in enabled:
            if merchant.daily_used_cents + amount_cents <= merchant.daily_quota_cents:
                return merchant
        raise ValueError("商户号当日额度不足。")

    def create_payment_url(self, order: OrderRecord, merchant: MerchantAccount) -> str:
        return f"https://pay.mock.qqbytop.com/pay/{merchant.merchant_code}/{order.id}"

    def mark_paid(self, repo: InMemoryRepository, order_id: UUID) -> OrderRecord:
        order = repo.orders[order_id]
        if order.status == "PENDING":
            order.status = "PAID"
            order.paid_at = utcnow()
            merchant = repo.merchants[order.merchant_account_id]
            merchant.daily_used_cents += order.amount_cents
        return order

    def refund(self, order: OrderRecord) -> bool:
        return order.refund_status in {"REQUESTED", "NONE"}
