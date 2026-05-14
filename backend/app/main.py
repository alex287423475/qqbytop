from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import admin, drafts, health, orders, reports, support


def create_app() -> FastAPI:
    settings = get_settings()
    settings.validate_runtime()
    app = FastAPI(title=settings.app_name, version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Session-Id"],
    )
    app.include_router(health.router)
    app.include_router(drafts.router)
    app.include_router(reports.router)
    app.include_router(orders.router)
    app.include_router(support.router)
    app.include_router(admin.router)
    return app


app = create_app()
