from __future__ import annotations

from dataclasses import dataclass, field
from threading import RLock
from time import time

from fastapi import HTTPException, Request


@dataclass
class WindowCounter:
    starts_at: float
    count: int = 0


@dataclass
class InMemoryRateLimiter:
    window_seconds: int = 3600
    lock: RLock = field(default_factory=RLock)
    buckets: dict[tuple[str, str], WindowCounter] = field(default_factory=dict)

    def hit(self, *, scope: str, identity: str, limit: int) -> None:
        if limit <= 0:
            return
        now = time()
        key = (scope, identity)
        with self.lock:
            counter = self.buckets.get(key)
            if not counter or now - counter.starts_at >= self.window_seconds:
                self.buckets[key] = WindowCounter(starts_at=now, count=1)
                return
            counter.count += 1
            if counter.count > limit:
                raise HTTPException(status_code=429, detail="Too many requests. Please wait before retrying.")


limiter = InMemoryRateLimiter()


def request_identity(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",", 1)[0].strip()
    return request.client.host if request.client else "unknown"
