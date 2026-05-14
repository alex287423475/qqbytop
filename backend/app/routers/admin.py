from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException

from app.config import get_settings
from app.models.schemas import AdminExceptionItem, FunnelResponse, MerchantAccount
from app.services.core import service

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


def require_admin(x_admin_token: str | None = Header(default=None)) -> None:
    expected = get_settings().admin_api_token
    if expected and x_admin_token != expected:
        raise HTTPException(status_code=401, detail="Admin token is invalid.")


@router.get("/merchant-accounts", response_model=list[MerchantAccount])
def merchant_accounts(_: None = Depends(require_admin)) -> list[MerchantAccount]:
    return list(service.repo.merchants.values())


@router.patch("/merchant-accounts/{merchant_id}", response_model=MerchantAccount)
def update_merchant_account(merchant_id: UUID, payload: dict[str, bool], _: None = Depends(require_admin)) -> MerchantAccount:
    merchant = service.repo.merchants.get(merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant account does not exist.")
    if "enabled" in payload:
        merchant.enabled = bool(payload["enabled"])
        service.repo.persist_all()
    return merchant


@router.get("/exceptions", response_model=list[AdminExceptionItem])
def exceptions(_: None = Depends(require_admin)) -> list[AdminExceptionItem]:
    return service.repo.exceptions()


@router.get("/funnel", response_model=FunnelResponse)
def funnel(_: None = Depends(require_admin)) -> FunnelResponse:
    return service.funnel()
