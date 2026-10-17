"""
Shared pytest infrastructure for the Doresh backend.

The environment is configured *before* anything from `src` is imported, because
`src.settings` reads the environment at import time. Test settings are read from
`TEST_*` variables in this one place; the dev `.env` is never used.

Postgres: a dedicated database whose name must contain "test" on a local/CI host
(created if missing, schema rebuilt from the Alembic migrations at session start).
Redis: the configured server, but a dedicated logical database (`TEST_REDIS_DB`, default 15)
injected through a dependency override, flushed at session start and end.
"""
import os
import uuid
from pathlib import Path
from dataclasses import dataclass

import pytest

TEST_DB_HOST     = os.getenv("TEST_DATABASE_HOST", "localhost")
TEST_DB_PORT     = os.getenv("TEST_DATABASE_PORT", "5433")
TEST_DB_NAME     = os.getenv("TEST_DATABASE_NAME", "doresh_test")
TEST_DB_USER     = os.getenv("TEST_DATABASE_USER", "doresh")
TEST_DB_PASSWORD = os.getenv("TEST_DATABASE_PWD", "doresh")
TEST_REDIS_HOST  = os.getenv("TEST_REDIS_HOST", "localhost")
TEST_REDIS_PORT  = int(os.getenv("TEST_REDIS_PORT", "6379"))
TEST_REDIS_DB    = int(os.getenv("TEST_REDIS_DB", "15"))
TEST_API_KEY     = "test-api-key"

_SAFE_HOSTS = {"localhost", "127.0.0.1", "::1", "db", "postgres"}

if "test" not in TEST_DB_NAME.lower():
    pytest.exit(f"Refusing to run: database '{TEST_DB_NAME}' does not contain 'test'.", returncode=2)
if TEST_DB_HOST not in _SAFE_HOSTS and not os.getenv("CI"):
    pytest.exit(f"Refusing to run: database host '{TEST_DB_HOST}' is not local.", returncode=2)
if TEST_REDIS_DB == 0:
    pytest.exit("Refusing to run: TEST_REDIS_DB must not be 0 (the app's default database).", returncode=2)

os.environ.update({
    "X_API_KEY":                 TEST_API_KEY,
    "ENVIRONMENT":               "development",
    "JWT_SECRET_KEY":            "test-secret-key-not-for-production",
    "JWT_ALGORITHM":             "HS256",
    "ACCESS_TOKEN_EXPIRE_MINUTES": "120",
    "EMAIL_TOKEN_EXPIRE_MINUTES":  "240",
    "REFRESH_TOKEN_EXPIRE_DAYS":   "30",
    "SESSION_CACHE_TTL_SECONDS":   "60",
    "DATABASE_HOST":             TEST_DB_HOST,
    "DATABASE_PORT":             TEST_DB_PORT,
    "DATABASE_NAME":             TEST_DB_NAME,
    "DATABASE_USER":             TEST_DB_USER,
    "DATABASE_PWD":              TEST_DB_PASSWORD,
    "DATABASE_DRIVER":           "psycopg2",
    "DATABASE_ASYNC_DRIVER":     "asyncpg",
    "DATABASE_ECHO_SQL":         "False",
    "REDIS_HOST":                TEST_REDIS_HOST,
    "REDIS_PORT":                str(TEST_REDIS_PORT),
    "EMAIL_HOST":                "localhost",
    "EMAIL_PORT":                "1025",
    "EMAIL_USER":                "test@example.com",
    "EMAIL_PASSWORD":            "test",
    "OPENAI_API_KEY":            "test-openai-key",
    "OPENAI_API_GPT_MODEL":      "gpt-test",
    "OPENAI_ASSISTANT_ID":       "asst_test",
    "IS_TEST_MODE":              "True",
})

import httpx  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
import psycopg2  # noqa: E402
from psycopg2 import sql  # noqa: E402
from redis.asyncio import Redis  # noqa: E402
from sqlalchemy import text  # noqa: E402

from src.app import app  # noqa: E402
from src.common.authentication import hash_password  # noqa: E402
from src.infrastructure.database import models  # noqa: E402,F401  (registers all ORM models)
from src.infrastructure.database.models.entity_model import EntityModel  # noqa: E402
from src.infrastructure.database.models.users_models import UsersModel  # noqa: E402
from src.infrastructure.database.settings import async_engine, AsyncSessionLocal  # noqa: E402
from src.infrastructure.repositories import get_redis_repo  # noqa: E402


def _ensure_test_database() -> None:
    conn = psycopg2.connect(
        host=TEST_DB_HOST, port=TEST_DB_PORT, user=TEST_DB_USER,
        password=TEST_DB_PASSWORD, dbname="postgres",
    )
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (TEST_DB_NAME,))
            if cur.fetchone() is None:
                cur.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(TEST_DB_NAME)))
    finally:
        conn.close()


def _migrate_test_database() -> None:
    """Drop everything and rebuild the schema with `alembic upgrade head`, so tests also cover the migrations."""
    conn = psycopg2.connect(
        host=TEST_DB_HOST, port=TEST_DB_PORT, user=TEST_DB_USER,
        password=TEST_DB_PASSWORD, dbname=TEST_DB_NAME,
    )
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            cur.execute("DROP SCHEMA public CASCADE; CREATE SCHEMA public;")
    finally:
        conn.close()

    # No ini file: alembic.ini's logging config would replace the app's loggers.
    # The URL comes from src.settings, already pointing at the test database.
    config = Config()
    config.set_main_option(
        "script_location", str(Path(__file__).parent.parent / "src/infrastructure/database/migrations")
    )
    command.upgrade(config, "head")


async def _truncate_all_tables() -> None:
    tables = ", ".join(f'"{t.name}"' for t in EntityModel.metadata.sorted_tables)
    async with async_engine.begin() as conn:
        await conn.execute(text(f"TRUNCATE {tables} RESTART IDENTITY CASCADE"))


@pytest.fixture(scope="session", autouse=True)
async def test_database():
    """Create the test database and schema, and clean it at session start (crashed runs) and end."""
    _ensure_test_database()
    _migrate_test_database()
    yield
    await _truncate_all_tables()
    await async_engine.dispose()


@pytest.fixture(scope="session", autouse=True)
async def test_redis():
    """Point the app's Redis dependency at the dedicated test database index."""
    client = Redis(host=TEST_REDIS_HOST, port=TEST_REDIS_PORT, db=TEST_REDIS_DB, socket_timeout=2)
    await client.flushdb()

    async def _override():
        yield client

    app.dependency_overrides[get_redis_repo] = _override
    yield client
    app.dependency_overrides.pop(get_redis_repo, None)
    await client.flushdb()
    await client.aclose()


@pytest.fixture(autouse=True)
async def reset_rate_limits(test_redis):
    """Every test logs in from the same client IP; reset the per-IP attempt counters between tests."""
    keys = [key async for key in test_redis.scan_iter("rate_limit:*")]
    if keys:
        await test_redis.delete(*keys)


@dataclass(frozen=True)
class TestUser:
    __test__ = False

    user_id:  uuid.UUID
    email:    str
    password: str


@pytest.fixture
def make_user():
    """Factory for a verified, active user with a unique fake e-mail."""
    async def _make_user(**overrides) -> TestUser:
        suffix   = uuid.uuid4().hex[:12]
        password = overrides.pop("password", f"senha-{suffix}")
        data = {
            "email":           f"usuario-{suffix}@example.com",
            "password":        hash_password(password),
            "username":        f"usuario-{suffix}",
            "document_number": f"doc-{suffix}",
            "document_type":   "CPF",
            "active":          True,
            "verified":        True,
            **overrides,
        }
        async with AsyncSessionLocal() as session:
            user = UsersModel(**data)
            session.add(user)
            await session.commit()
            return TestUser(user_id=user.id, email=user.email, password=password)

    return _make_user


@pytest.fixture
async def user_a(make_user) -> TestUser:
    return await make_user()


@pytest.fixture
async def user_b(make_user) -> TestUser:
    return await make_user()


@pytest.fixture
async def client_as():
    """Factory: an authenticated client (x-api-key + Bearer of a fresh login) for a test user."""
    clients: list[httpx.AsyncClient] = []

    async def _client_as(user: TestUser) -> httpx.AsyncClient:
        client = httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test", headers={"x-api-key": TEST_API_KEY}
        )
        clients.append(client)
        response = await client.post(
            "/api/v1/user/authenticate", json={"email": user.email, "password": user.password}
        )
        assert response.status_code == 200, response.text
        client.headers["Authorization"] = f"Bearer {response.json()['token']}"
        return client

    yield _client_as
    for client in clients:
        await client.aclose()


@pytest.fixture
async def api_key_client():
    """Client for the public routes (sends x-api-key, no Bearer)."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport, base_url="http://test", headers={"x-api-key": TEST_API_KEY}
    ) as client:
        yield client


@pytest.fixture
async def anonymous_client():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
