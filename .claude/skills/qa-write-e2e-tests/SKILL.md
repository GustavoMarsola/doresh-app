---
name: qa-write-e2e-tests
description: |
  Write end-to-end tests for the Doresh backend: full user journeys through the HTTP API
  (register → verify e-mail → authenticate → read a chapter → highlight → create a study → list →
  delete → logout), AI flows (generate a study / ask Ruach in test mode, optionally live with a
  flag), and account lifecycle (data export/erasure when it exists). Use for tests under
  backend/tests/e2e/.
---

# Write E2E Tests

E2E tests walk a real journey through the HTTP API against the real test database. Fewer and
slower than integration tests; each proves the pieces connect, not every edge case.

## When a test is e2e

- It spans **several contexts** in one journey (users → bible → studies), or
- It needs an **optional external input** (real OpenAI with `--openai-live`), or
- It checks an **account lifecycle** operation end to end (export, erasure)

## Layout

`tests/e2e/test_<journey>.py`, e.g. `test_new_user_first_study.py`, `test_ruach_conversation.py`.
Mark with `pytestmark = pytest.mark.e2e`.

## Journey tests: one flow, one fact per test

```python
"""A new user registers, verifies, logs in, highlights a verse and creates a study."""
import pytest

pytestmark = pytest.mark.e2e


class TestNewUserFirstStudy:
    @pytest.fixture(autouse=True)
    async def _run_journey(self, api_key_client, client_as, user_b, app):
        ...  # register via api_key_client, read the verification code from the DB (fetch helper),
             # verify, authenticate, then act with the returned token
        self.api, self.other = <client with the new token>, client_as(user_b)

    async def test_study_appears_in_library(self):
        response = await self.api.get("/api/v1/studies")
        assert self.study_id in {s["id"] for s in response.json()["studies"]}

    async def test_highlight_appears_in_profile(self):
        ...

    async def test_journey_is_invisible_to_another_user(self):
        response = await self.other.get("/api/v1/studies")
        assert self.study_id not in {s["id"] for s in response.json()["studies"]}
```

The fixture is function-scoped, so the journey runs once per test method — deliberate: no shared
state. Keep journeys lean; if slow, cut assertion methods, not isolation.

**Every journey class ends with an "invisible to another user" test.**

E-mail: never send real e-mails in tests. Read the verification code from the database through a
fixture, or patch the e-mail sender at its seam (ask `dev-backend-python` for one if missing).

## Optional live AI

```python
class TestRuachLive:
    @pytest.fixture(autouse=True)
    def _skip_without_flag(self, request):
        if not request.config.getoption("--openai-live"):
            pytest.skip("Pass --openai-live to call the real OpenAI API (costs money).")
```

Without the flag, AI flows run in `IS_TEST_MODE` (canned answer). Never print prompts or answers
in assertion messages.

## Rules

- Through the public HTTP API only (that's what makes it e2e)
- Don't re-assert per step what integration tests already cover
- Optional inputs → skip guard; ownership checks → never skipped
- `cd backend && pytest tests/e2e -q`; report which tests ran and which were skipped
