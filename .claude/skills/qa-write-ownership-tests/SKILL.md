---
name: qa-write-ownership-tests
description: |
  Write cross-user isolation tests for the Doresh backend: one lean file per user-owned
  resource (tests/integration/ownership/test_<resource>_ownership.py) proving that user B can't
  read, change or delete user A's studies, highlights, comments, chat sessions or any other
  personal content, that a forged user_id is ignored, that references to another user's records
  are rejected, and that cache keys are per user. Use whenever a user-owned resource, route,
  cache key or job is added or changed, or when dev-backend-python hands off a new resource.
---

# Write Ownership Tests

A leak between users is the worst bug Doresh can have: the data is religious and personal
(LGPD sensitive data). These tests are **never** skipped, xfailed or weakened. A failure is
escalated to `dev-backend-python` as a potential leak (which operation, which users, likely layer).

Prerequisite: fixtures from `qa-setup-conftest` (`user_a`, `user_b`, `client_as`,
`make_<resource>`, `fetch_<resource>`). Missing `make_`/`fetch_` for the resource → add them first.

## Steps

1. **Read the source**: model (has `user_id`? child of an owned parent?), schemas (minimal valid
   body), routes (every path and method, including nested and action routes), use case
   (referenced ids, expected 404/409/422), repository (where the owner filter is — or isn't)
2. Create `tests/integration/ownership/test_<resources>_ownership.py` from the template below
3. Put **every** route of the resource in the existing tests (a new nested/action route goes into
   the "all 404" list; a new search/filter/export/count into "only the caller's rows"). One test
   per kind of leak, not one per route
4. `cd backend && pytest tests/integration/ownership -q`; report the real output
5. **Prove the tests bite**: temporarily remove the `user_id` filter from one repository method;
   the matching test must fail; restore and re-run green. Say you did it

## Template

```python
"""Cross-user isolation for studies."""
import pytest

pytestmark = pytest.mark.ownership


class TestStudiesOwnership:
    async def test_cannot_read_or_change_another_users_study(self, client_as, user_a, user_b, make_study, fetch_study):
        study = await make_study(user=user_a)
        api = client_as(user_b)
        statuses = {
            "patch": (await api.patch("/api/v1/study", json={"study_id": str(study.id), "title": "invadido"})).status_code,
            "delete": (await api.delete(f"/api/v1/study/{study.id}")).status_code,
        }
        assert statuses == {"patch": 404, "delete": 404}

    async def test_another_users_study_is_unchanged(self, client_as, user_a, user_b, make_study, fetch_study):
        study = await make_study(user=user_a)
        await client_as(user_b).patch("/api/v1/study", json={"study_id": str(study.id), "title": "invadido"})
        await client_as(user_b).delete(f"/api/v1/study/{study.id}")
        stored = await fetch_study(study.id)
        assert (stored.title, stored.active) == (study.title, True)

    async def test_list_shows_only_the_callers_studies(self, client_as, user_a, user_b, make_study):
        foreign = await make_study(user=user_a)
        response = await client_as(user_b).get("/api/v1/studies")
        assert str(foreign.id) not in {s["id"] for s in response.json()["studies"]}

    async def test_forged_user_id_in_body_is_ignored(self, client_as, user_a, user_b, fetch_study):
        body = {"title": "t", "introduction": "i", "conclusion": "c", "user_id": str(user_a.user_id)}
        response = await client_as(user_b).post("/api/v1/study", json=body)
        created = await fetch_study(response.json()["study"]["id"])
        assert created.user_id == user_b.user_id
```

Adapt paths and bodies to the real routes (read them; legacy `PATCH /study` takes `study_id` in
the body, new routes take it in the path). A test asserting a dict of statuses is fine: the
failure shows which route leaked. Name tests after the leak.

> **Expected today:** `test_cannot_read_or_change_another_users_study` and
> `test_another_users_study_is_unchanged` **fail** on the current code (known bug documented in
> `dev-backend.md`). Report it; don't xfail it.

## Catalogue: one test per kind of leak

| Test | Covers |
|---|---|
| cannot read or change another user's record | get, update, delete, restore, nested and action routes → all 404 |
| the record is unchanged | `fetch_<resource>` after the attempts |
| list/search show only the caller's rows | list, search, filters, counts, exports, profile aggregates (`GET /user/profile` returns only own highlights/comments) |
| forged `user_id` in body/query is ignored | created row belongs to the caller |
| reference to another user's record | e.g. B adds A's `study_id` to B's collection, B posts into A's Ruach session → 404/422 and nothing written |
| cache | the same logical key for A and B returns each one's own data; keys start with `u:{user_id}:` |

## Rules

- Always two users; seed the victim's data with `make_<resource>(user=user_a)` and act as `user_b`
- Never assert global counts; assert membership of specific ids
- Unique values generated per test, never shared constants
- Never skip, xfail or weaken; escalate failures as leaks
