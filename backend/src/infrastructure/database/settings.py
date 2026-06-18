import logging
from asyncio import current_task
from contextlib import asynccontextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm.scoping import scoped_session
from sqlalchemy.ext.asyncio import AsyncSession, async_scoped_session, create_async_engine

from src.settings import get_settings

_logger = logging.getLogger(__name__)


def _get_sync_uri() -> str:
    return get_settings().database_settings._get_database_uri


def _create_sync_engine():
    return create_engine(
        _get_sync_uri(),
        pool_size=get_settings().database_settings.database_pool_size,
        max_overflow=get_settings().database_settings.database_max_overflow,
        pool_pre_ping=True,
        pool_recycle=get_settings().database_settings.database_pool_recycle_seconds,
        echo=get_settings().database_settings.database_echo_sql_option,
        future=True,
    )


sync_engine = _create_sync_engine()

SessionLocal = sessionmaker(bind=sync_engine, autoflush=False, autocommit=False, future=True)


def _get_async_uri() -> str:
    return get_settings().database_settings._get_async_database_uri


def _create_async_engine():
    return create_async_engine(
        _get_async_uri(),
        pool_size=get_settings().database_settings.database_pool_size,
        max_overflow=get_settings().database_settings.database_max_overflow,
        pool_pre_ping=True,
        pool_recycle=get_settings().database_settings.database_pool_recycle_seconds,
        echo=get_settings().database_settings.database_echo_sql_option,
    )


async_engine = _create_async_engine()

AsyncSessionLocal = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
    future=True,
)


@asynccontextmanager
async def get_db_session():
    _scoped: scoped_session = async_scoped_session(
        session_factory=AsyncSessionLocal, scopefunc=current_task
    )
    try:
        yield _scoped()
        await _scoped.commit()
    except Exception as ex:
        _logger.error("Rollback session caused by: %s", repr(ex))
        await _scoped.rollback()
        raise
    finally:
        await _scoped.remove()
