from uuid import UUID

from fastapi import APIRouter, Header, HTTPException, Request

from app.config import get_settings
from app.models.schemas import (
    CreateReportRequest,
    CreateReportResponse,
    ReportResponse,
    SmartAppealRequest,
    SmartAppealResponse,
    UnlockWithCreditRequest,
    UnlockWithCreditResponse,
)
from app.services.core import service
from app.services.rate_limit import limiter, request_identity

router = APIRouter(prefix="/api/v1", tags=["reports"])


def _bearer_token(value: str | None) -> str | None:
    if not value:
        return None
    prefix = "Bearer "
    return value[len(prefix) :].strip() if value.startswith(prefix) else value.strip()


@router.post("/reports", response_model=CreateReportResponse)
def create_report(request: CreateReportRequest, http_request: Request, authorization: str | None = Header(default=None)) -> CreateReportResponse:
    settings = get_settings()
    limiter.hit(scope="reports", identity=f"{request.draft_id}:{request_identity(http_request)}", limit=settings.free_diagnosis_rate_limit_per_hour)
    try:
        return service.create_report(request, token=_bearer_token(authorization))
    except PermissionError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/reports/{report_id}", response_model=ReportResponse)
def get_report(report_id: UUID) -> ReportResponse:
    try:
        return service.get_report(report_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/reports/{report_id}/smart-appeal", response_model=SmartAppealResponse)
def smart_appeal(report_id: UUID, http_request: Request, _: SmartAppealRequest | None = None) -> SmartAppealResponse:
    settings = get_settings()
    limiter.hit(scope="smart_appeal", identity=f"{report_id}:{request_identity(http_request)}", limit=settings.smart_appeal_rate_limit_per_hour)
    try:
        return service.smart_appeal(report_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/reports/{report_id}/unlock-with-credit", response_model=UnlockWithCreditResponse)
def unlock_with_credit(report_id: UUID, request: UnlockWithCreditRequest) -> UnlockWithCreditResponse:
    try:
        return service.unlock_report_with_credit(report_id, request.payer_contact)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
