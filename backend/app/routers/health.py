from fastapi import APIRouter

from app.config import get_settings

router = APIRouter(prefix="/api/v1", tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    settings = get_settings()
    return {"status": "ok", "service": "gaokao-essay-backend", "environment": settings.environment}


@router.get("/readiness")
def readiness() -> dict[str, object]:
    settings = get_settings()
    checks: dict[str, object] = {
        "environment": settings.environment,
        "postgres": {"configured": bool(settings.database_url), "ok": False},
        "redis": {"configured": bool(settings.redis_url), "ok": False},
        "storage_provider": settings.storage_provider,
        "ocr_provider": settings.ocr_provider,
        "llm_providers": settings.llm_provider_list,
        "payment_provider": settings.payment_provider,
    }

    if settings.database_url:
        try:
            import psycopg

            with psycopg.connect(settings.database_url, connect_timeout=3) as conn, conn.cursor() as cursor:
                cursor.execute("select 1")
                cursor.fetchone()
            checks["postgres"] = {"configured": True, "ok": True}
        except Exception as exc:  # noqa: BLE001 - readiness reports provider failure without exposing secrets.
            checks["postgres"] = {"configured": True, "ok": False, "error": exc.__class__.__name__}

    if settings.redis_url:
        try:
            import redis

            client = redis.Redis.from_url(settings.redis_url, socket_connect_timeout=3, socket_timeout=3)
            client.ping()
            checks["redis"] = {"configured": True, "ok": True}
        except Exception as exc:  # noqa: BLE001
            checks["redis"] = {"configured": True, "ok": False, "error": exc.__class__.__name__}

    postgres_ok = bool(isinstance(checks["postgres"], dict) and checks["postgres"].get("ok"))
    redis_ok = bool(isinstance(checks["redis"], dict) and checks["redis"].get("ok"))
    checks["status"] = "ok" if postgres_ok and redis_ok else "degraded"
    return checks
