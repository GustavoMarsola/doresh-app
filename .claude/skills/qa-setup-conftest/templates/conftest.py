"""Reference backend/tests/conftest.py for Doresh.

Lines marked ADAPT depend on real names in src/. Read the source and adjust them.
The env bootstrap MUST stay above every `from src...` import: the app creates its database
engine and settings at import time.
"""
import os

_TEST_ENV = {
    "DATABASE_HOST": os.environ.get("TEST_DATABASE_HOST", "localhost"),
    "DATABASE_PORT": os.environ.get("TEST_DATABASE_PORT", "5432"),
    "DATABASE_NAME": os.environ.get("TEST_DATABASE_NAME", "doresh_test"),
    "DATABASE_USER": os.environ.get("TEST_DATABASE_USER", "doresh"),
    "DATABASE_PWD": os.environ.get("TEST_DATABASE_PWD", "doresh"),
    "DATABASE_DRIVER": os.environ.get("TEST_DATABASE_DRIVER", "psycopg2"),          # ADAPT
    "DATABASE_ASYNC_DRIVER": os.environ.get("TEST_DATABASE_ASYNC_DRIVER", "asyncpg"),  # ADAPT
    "DATABASE_ECHO_SQL": "false",
    "REDIS_HOST": os.environ.get("TEST_REDIS_HOST", "localhost"),
    "REDIS_PORT": os.environ.get("TEST_REDIS_PORT", "6380"),
    "IS_TEST_MODE": "true",
    "X_API_KEY": "test-api-key",
    "JWT_SECRET_KEY": "test-jwt-secret-not-for-production",
    "JWT_ALGORITHM": "HS256",
}
os.environ.update(_TEST_ENV)

LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1", "db", "postgres"}   # ADAPT: CI service hostname

if "test" not in _TEST_ENV["DATABASE_NAME"] or _TEST_ENV["DATABASE_HOST"] not in LOCAL_HOSTS:
    raise SystemExit(
        f"Refusing to run tests against database '{_TEST_ENV['DATABASE_NAME']}' "
        f"on host '{_TEST_ENV['DATABASE_HOST']}'. The name must contain 'test' and the host must be local/CI."
    )

import uuid
from collections.abc import AsyncIterator, Callable

import httpx
import pytest
from sqlalchemy import select, text

from src.infrastructure.database import models                       # noqa: F401
from src.infrastructure.database.models.entity_model import EntityModel
from src.infrastructure.database.settings import AsyncSessionLocal, async_engine   # ADAPT
from tests import factories
from tests.factories import TestUser


def pytest_addoption(parser: pytest.Parser) -> None:
    parser.addoption("--openai-live", action="store_true", help="Call the real OpenAI API in e2e tests")


@pytest.fixture(scope="session", autouse=True)
async def database() -> AsyncIterator[None]:
    """Schema from create_all today. Once Alembic exists, replace with a subprocess running
    `alembic -x db_url=<sync test url> upgrade head` and keep the truncation."""
    async with async_engine.begin() as conn:
        await conn.run_sync(EntityModel.metadata.create_all)
    await _truncate_all()
    yield
    await _truncate_all()
    await async_engine.dispose()


async def _truncate_all() -> None:
    tables = ", ".join(f'"{t.name}"' for t in EntityModel.metadata.sorted_tables)
    async with async_engine.begin() as conn:
        await conn.execute(text(f"TRUNCATE {tables} RESTART IDENTITY CASCADE"))


@pytest.fixture(scope="session")
def app():
    from src.app import create_app

    return create_app()


@pytest.fixture
async def client_as(app) -> AsyncIterator[Callable[[TestUser], httpx.AsyncClient]]:
    clients: list[httpx.AsyncClient] = []

    def _make(user: TestUser) -> httpx.AsyncClient:
        client = httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app),
            base_url="http://test",
            headers={"Authorization": f"Bearer {user.token}"},
        )
        clients.append(client)
        return client

    yield _make
    for client in clients:
        await client.aclose()


@pytest.fixture
async def anonymous_client(app) -> AsyncIterator[httpx.AsyncClient]:
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        yield client


@pytest.fixture
async def api_key_client(app) -> AsyncIterator[httpx.AsyncClient]:
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app),
        base_url="http://test",
        headers={"x-api-key": _TEST_ENV["X_API_KEY"]},
    ) as client:
        yield client


@pytest.fixture
def make_user():
    async def _make(**overrides) -> TestUser:
        async with AsyncSessionLocal() as session:
            return await factories.create_user(session, **overrides)
    return _make


@pytest.fixture
async def user_a(make_user) -> TestUser:
    return await make_user()


@pytest.fixture
async def user_b(make_user) -> TestUser:
    return await make_user()


@pytest.fixture
def make_study():
    async def _make(user: TestUser, **overrides):
        async with AsyncSessionLocal() as session:
            return await factories.create_study(session, user=user, **overrides)
    return _make


@pytest.fixture
def fetch_study():
    """Read a study straight from the database, inactive rows included, for 'unchanged',
    'still exists' and 'soft-deleted' assertions."""
    async def _fetch(study_id):
        from src.infrastructure.database.models import StudyModel
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(StudyModel).where(StudyModel.id == uuid.UUID(str(study_id))))
            return result.scalar_one_or_none()
    return _fetch
