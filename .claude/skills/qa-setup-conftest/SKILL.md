---
name: qa-setup-conftest
description: |
  Create or update the pytest infrastructure for the Doresh backend: test dependencies,
  pytest.ini, tests/conftest.py (test-database safety guard, env bootstrap before importing src,
  schema via create_all now / Alembic later, session loop scope, cleanup, CLI flags),
  tests/factories.py and the standard fixtures (make_user, user_a, user_b, client_as,
  anonymous_client, api_key_client, make_study/fetch_study…). Use when bootstrapping tests,
  adding a shared fixture/factory, or adding a CLI flag.
---

# Set Up / Update the test infrastructure

Reference implementation: [`templates/conftest.py`](templates/conftest.py) and
[`templates/factories.py`](templates/factories.py). Copy them to `backend/tests/`, then adapt the
lines marked `ADAPT` to the real signatures (read `src/settings.py`,
`src/common/authentication.py`, `src/infrastructure/database/settings.py`,
`src/infrastructure/database/models/*` first — never guess).

## 0. Dependencies (ask before adding)

`backend/requirements.txt` has `pytest` and `pytest-asyncio` commented out. Proposed (pin the
versions current at the time; check they support Python 3.11):

```
pytest
pytest-asyncio>=0.26
httpx
```

Prefer a separate `requirements-dev.txt` so the production image stays lean — ask the user.

## Non-negotiable design points

| Point | Why |
|---|---|
| Engines are created **at import time** from env vars (`infrastructure/database/settings.py`) | The test DB/Redis env vars must be set at the very top of `conftest.py`, **before** any `from src...` import. This is the one sanctioned place that writes `os.environ` |
| Refuse to start unless `DATABASE_NAME` contains `test` and the host is local/CI | Cleanup truncates every table |
| Schema via `EntityModel.metadata.create_all` today; `alembic -x db_url=... upgrade head` once Alembic exists | Same schema as production |
| Separate Redis for tests (`TEST_REDIS_PORT`, or a dedicated container) | Never flush the developer's Redis |
| Each test creates its own users; cleanup = truncate all tables at session start (crashed runs) and end | Repositories commit internally, so rollback isolation doesn't work |
| `asyncio_default_fixture_loop_scope = session` **and** `asyncio_default_test_loop_scope = session` | asyncpg connections are bound to the loop that created them |
| Tokens from the real `generate_tokens()` | Claims match production |

## pytest.ini (`backend/pytest.ini`)

```ini
[pytest]
testpaths = tests
asyncio_mode = auto
asyncio_default_fixture_loop_scope = session
asyncio_default_test_loop_scope = session
markers =
    e2e: full flows needing optional external inputs (skipped without their CLI flag)
    ownership: cross-user isolation guarantees (never skipped)
filterwarnings =
    error::pytest.PytestUnraisableExceptionWarning
```

## Test database

Locally (docker compose already runs Postgres and Redis):

```bash
docker compose exec db psql -U doresh -c "CREATE DATABASE doresh_test"
```

Variables read by the conftest (defaults in the template): `TEST_DATABASE_HOST`,
`TEST_DATABASE_PORT`, `TEST_DATABASE_NAME` (must contain `test`), `TEST_DATABASE_USER`,
`TEST_DATABASE_PWD`, `TEST_REDIS_HOST`, `TEST_REDIS_PORT`. Document them in the README
"Desenvolvimento local" section.

## Adding a standard fixture

1. Factory `async def create_<resource>(session, user, **overrides)` in `tests/factories.py` with fake-but-valid defaults
2. Fixture `make_<resource>` (takes `user=`) and `fetch_<resource>(id)` (reads directly from the DB, **including inactive rows**) in `conftest.py`
3. Cross-cutting fixture → update the table in `.claude/agents/dev-qa.md`

## Adding a CLI flag

```python
def pytest_addoption(parser):
    parser.addoption("--openai-live", action="store_true", help="Call the real OpenAI API in e2e tests")
```

Flags are for optional external inputs only; never a flag that disables ownership tests.

## Verify

```bash
cd backend && pytest --collect-only -q
cd backend && pytest -q
```
