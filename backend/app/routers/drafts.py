from uuid import UUID

from fastapi import APIRouter, Header, HTTPException, Request

from app.config import get_settings
from app.models.schemas import (
    CompleteUploadRequest,
    CompleteUploadResponse,
    ConfirmTextRequest,
    ConfirmTextResponse,
    CreateDraftRequest,
    CreateDraftResponse,
    CreateUploadIntentRequest,
    CreateUploadIntentResponse,
    RecognitionResponse,
)
from app.services.core import service
from app.services.rate_limit import limiter, request_identity

router = APIRouter(prefix="/api/v1", tags=["drafts"])


def _session_id(value: str | None) -> str:
    return value or "anonymous-session"


def _bearer_token(value: str | None) -> str | None:
    if not value:
        return None
    prefix = "Bearer "
    return value[len(prefix) :].strip() if value.startswith(prefix) else value.strip()


@router.post("/drafts", response_model=CreateDraftResponse)
def create_draft(request: CreateDraftRequest, http_request: Request, x_session_id: str | None = Header(default=None)) -> CreateDraftResponse:
    settings = get_settings()
    limiter.hit(scope="drafts", identity=request_identity(http_request), limit=settings.free_diagnosis_rate_limit_per_hour)
    try:
        return service.create_draft(request, session_id=_session_id(x_session_id))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/uploads/intents", response_model=CreateUploadIntentResponse)
def create_upload_intent(request: CreateUploadIntentRequest, http_request: Request, authorization: str | None = Header(default=None)) -> CreateUploadIntentResponse:
    settings = get_settings()
    limiter.hit(scope="upload_intents", identity=f"{request.draft_id}:{request_identity(http_request)}", limit=settings.upload_intent_rate_limit_per_hour)
    try:
        return service.create_upload_intent(request, token=_bearer_token(authorization))
    except PermissionError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/uploads/{upload_intent_id}/complete", response_model=CompleteUploadResponse)
def complete_upload(upload_intent_id: UUID, request: CompleteUploadRequest, authorization: str | None = Header(default=None)) -> CompleteUploadResponse:
    try:
        return service.complete_upload(upload_intent_id, request, token=_bearer_token(authorization))
    except PermissionError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/drafts/{draft_id}/recognition", response_model=RecognitionResponse)
def get_recognition(draft_id: UUID, authorization: str | None = Header(default=None)) -> RecognitionResponse:
    try:
        return service.get_recognition(draft_id, token=_bearer_token(authorization))
    except PermissionError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/drafts/{draft_id}/confirm", response_model=ConfirmTextResponse)
def confirm_text(draft_id: UUID, request: ConfirmTextRequest, authorization: str | None = Header(default=None)) -> ConfirmTextResponse:
    try:
        return service.confirm_text(draft_id, request.confirmed_text, token=_bearer_token(authorization))
    except PermissionError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
