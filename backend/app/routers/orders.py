from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    CreateOrderRequest,
    CreateOrderResponse,
    GroupBuyRecord,
    RefundRequestRequest,
    RefundRequestResponse,
    WebhookResponse,
)
from app.services.core import service

router = APIRouter(prefix="/api/v1", tags=["orders"])


@router.post("/orders", response_model=CreateOrderResponse)
def create_order(request: CreateOrderRequest) -> CreateOrderResponse:
    try:
        return service.create_order(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/orders/{order_id}/sync")
def sync_order(order_id: UUID) -> dict[str, str]:
    try:
        order = service.mark_order_paid(order_id)
        return {"order_id": str(order.id), "status": order.status}
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="订单不存在。") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/groups/{group_buy_id}/official-assist", response_model=GroupBuyRecord)
def official_assist(group_buy_id: UUID) -> GroupBuyRecord:
    try:
        return service.apply_official_assist(group_buy_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/orders/{order_id}/refund-request", response_model=RefundRequestResponse)
def refund_request(order_id: UUID, request: RefundRequestRequest) -> RefundRequestResponse:
    try:
        return service.refund_request(order_id, request.reason)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/payments/webhook/{merchant_code}", response_model=WebhookResponse)
def payment_webhook(merchant_code: str, payload: dict[str, str]) -> WebhookResponse:
    return service.webhook(merchant_code, payload)
