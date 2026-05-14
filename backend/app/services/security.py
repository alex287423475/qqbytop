from __future__ import annotations

import base64
import hashlib
import hmac
import json
from datetime import UTC, datetime, timedelta
from uuid import UUID


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode((data + padding).encode("ascii"))


def sign_draft_token(*, draft_id: UUID, session_id: str, secret: str, ttl_seconds: int) -> str:
    payload = {
        "draft_id": str(draft_id),
        "session_id": session_id,
        "exp": int((datetime.now(UTC) + timedelta(seconds=ttl_seconds)).timestamp()),
    }
    body = _b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(secret.encode("utf-8"), body.encode("ascii"), hashlib.sha256).digest()
    return f"{body}.{_b64encode(signature)}"


def verify_draft_token(token: str, *, draft_id: UUID, secret: str) -> dict[str, str]:
    try:
        body, signature = token.split(".", 1)
        expected = hmac.new(secret.encode("utf-8"), body.encode("ascii"), hashlib.sha256).digest()
        if not hmac.compare_digest(_b64decode(signature), expected):
            raise ValueError("draft_token signature is invalid.")
        payload = json.loads(_b64decode(body))
        if payload.get("draft_id") != str(draft_id):
            raise ValueError("draft_token does not match this draft.")
        if int(payload.get("exp", 0)) < int(datetime.now(UTC).timestamp()):
            raise ValueError("draft_token has expired.")
        return payload
    except Exception as exc:
        if isinstance(exc, ValueError):
            raise
        raise ValueError("draft_token is invalid.") from exc
