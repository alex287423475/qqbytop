from __future__ import annotations

from app.config import get_settings


def require_database_url() -> str:
    database_url = get_settings().database_url
    if not database_url:
        raise RuntimeError("DATABASE_URL is required when persistent PostgreSQL mode is enabled.")
    return database_url


def database_configured() -> bool:
    return bool(get_settings().database_url)
