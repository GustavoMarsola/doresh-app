import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routes import health_check, api_v1
from src.settings import get_settings

_logger = logging.getLogger(__name__)


@asynccontextmanager
async def _lifespan(app: FastAPI):
    from src.infrastructure.database import models  # noqa: F401 — registers all ORM models
    from src.infrastructure.database.settings import async_engine
    from src.infrastructure.database.models.entity_model import EntityModel

    async with async_engine.begin() as conn:
        await conn.run_sync(EntityModel.metadata.create_all)
        _logger.info("Database tables ensured")

    yield


def create_app() -> FastAPI:
    settings = get_settings()

    _app = FastAPI(
        title=settings.app_settings.app_name,
        version=settings.app_settings.app_version,
        docs_url="/api/docs",
        redoc_url=None,
        lifespan=_lifespan,
    )

    _app.include_router(health_check.router, tags=["Health Check"])
    _app.include_router(api_v1, tags=["API Routers - Version 1"])

    _app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.app_settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return _app


app = create_app()
