from fastapi import APIRouter, Request

from app.config import get_settings
from app.models.schemas import SupportChatRequest, SupportChatResponse
from app.services.core import service
from app.services.rate_limit import limiter, request_identity

router = APIRouter(prefix="/api/v1", tags=["support"])


@router.post("/support/chat", response_model=SupportChatResponse)
def support_chat(request: SupportChatRequest, http_request: Request) -> SupportChatResponse:
    settings = get_settings()
    limiter.hit(scope="support_chat", identity=request_identity(http_request), limit=settings.support_chat_rate_limit_per_hour)
    return service.support_chat(request.message)
