---
name: qa-write-integration-tests
description: |
  Write integration tests for the Doresh backend against the real test PostgreSQL and Redis:
  routes via httpx ASGITransport, use cases and repositories, auth (Bearer and x-api-key),
  validation errors, pagination, conflicts, soft delete, Redis keys, external providers with
  httpx.MockTransport. Use for tests under backend/tests/integration/ (ownership files use
  qa-write-ownership-tests).
---

# Write Integration Tests

Real database, real Redis, no DB mocks. Every test creates its own users and is order-independent.

## Steps

1. **Read the source**: route (path, method, dependencies, status code), schemas, use case
   (error branches and `detail` values), repository (filters, pagination)
2. File `tests/integration/test_<context>.py`; one class per endpoint or behaviour group
3. Cover the matrix below, one assertion per test
4. User-owned resource without an ownership file → create it too (`qa-write-ownership-tests`)
5. `cd backend && pytest tests/integration/test_<context>.py -q`; report the real output

## Coverage matrix per endpoint

| Case | Expected |
|---|---|
| happy path | 200/201/204 + one test per important response field |
| persisted | re-read via `fetch_<resource>` or GET shows the new value |
| validation | 422: at most two cases per schema, only our own rules (cross-field rule, forged `user_id`) |
| not found (random uuid) | 404 with the documented `detail` |
| conflict (unique per user) | 409 |
| no token / expired / tampered | 401 |
| public route without / with wrong `x-api-key` | 401 |
| pagination | `per_page` respected; `page` skips; `total` counts the caller's rows only (fresh user per test) |
| soft delete | 2xx; row still exists with `active=false` via `fetch_<resource>`; then GET 404, excluded from list, PATCH 404 |
| Redis | keys for user data start with `u:{user_id}:`; values not served to another user |

## Template

```python
"""Integration tests for /api/v1/studies."""
URL = "/api/v1/studies"


def _body(**overrides) -> dict:
    body = {"title": "Estudo de teste", "introduction": "Intro.", "conclusion": "Fim.",
            "sections": [{"text": "Seção.", "order_index": 0}],
            "references": [{"book": "joao", "chapter": 3, "verse_start": 16}]}
    body.update(overrides)
    return body


class TestCreateStudy:
    async def test_returns_201(self, client_as, user_a):
        response = await client_as(user_a).post("/api/v1/study", json=_body())
        assert response.status_code == 201

    async def test_requires_token(self, anonymous_client):
        response = await anonymous_client.post("/api/v1/study", json=_body())
        assert response.status_code == 401

    async def test_forged_user_id_is_ignored(self, client_as, user_a, user_b, fetch_study):
        response = await client_as(user_a).post("/api/v1/study", json={**_body(), "user_id": str(user_b.user_id)})
        created = await fetch_study(response.json()["study"]["id"])
        assert created.user_id == user_a.user_id


class TestListStudies:
    async def test_per_page_is_respected(self, client_as, user_a, make_study):
        for _ in range(3):
            await make_study(user=user_a)
        response = await client_as(user_a).get(URL, params={"per_page": 2})
        assert len(response.json()["studies"]) == 2
```

Response envelopes differ between legacy handlers (`{"message", "study": {...}}`) and migrated ones
(`response_model`): read the route before asserting the shape. Counting inside a **fresh per-test
user** is fine; counting a whole table never is.

## External HTTP: `httpx.MockTransport`

Clients accept a `transport`; build responses from `tests/mockups/<provider>/`:

```python
def _transport(status: int, fixture: str) -> httpx.MockTransport:
    payload = load_json(fixture)
    return httpx.MockTransport(lambda request: httpx.Response(status, json=payload))
```

Inject via a FastAPI dependency override or a constructor argument. No seam → ask
`dev-backend-python` to add one rather than monkeypatching httpx globally. With `IS_TEST_MODE=true`
(set by the conftest) the Ruach must never hit the network.

## Rules

- **Each behaviour once**: no re-testing through the API what unit tests cover (one wiring case)
- Assert via the API or `fetch_<resource>`, never via a second request that shares the same bug
- No `time.sleep`; call background functions directly with explicit ids
- Assert stable `detail` codes, not human messages
- Fake content only
