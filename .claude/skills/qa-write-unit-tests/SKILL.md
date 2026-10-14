---
name: qa-write-unit-tests
description: |
  Write pure unit tests (no DB, no network, no files) for the Doresh backend: Bible reference
  parsing and normalisation (book names with accents, chapter/verse ranges), serialization
  helpers, JWT/token helpers, password hashing, AI prompt builders and response parsing, schema
  validation rules, date/time helpers. Use for tests under backend/tests/unit/.
---

# Write Unit Tests

Fast, deterministic, pure: no database, no Redis, no HTTP, no filesystem, no clock or randomness
unless injected.

## Steps

1. **Read the unit under test**: signature, return type, raised exceptions, branches. Never guess
2. Really unit-testable? Needs a session or repository → `qa-write-integration-tests`. Pure logic
   hidden inside a use case → suggest to `dev-backend-python` extracting it (don't mock the DB)
3. File `tests/unit/test_<module>.py`, mirroring the source module
4. One class per function/class (`Test<Unit>`), one behaviour and **one assertion** per method
5. `cd backend && pytest tests/unit/test_<module>.py -q`; report the output

## Structure

```python
"""Unit tests for src/common/utilities.py."""
from datetime import datetime
from uuid import UUID

from src.common.utilities import serialize

STUDY_ID = UUID("00000000-0000-0000-0000-000000000001")


class TestSerialize:
    def test_uuid_becomes_string(self):
        assert serialize({"id": STUDY_ID})["id"] == str(STUDY_ID)

    def test_datetime_becomes_iso_string(self):
        assert serialize({"at": datetime(2026, 10, 14, 9, 30)})["at"].startswith("2026-10-14")
```

## Table-driven cases

```python
class TestNormaliseBookName:
    @pytest.mark.parametrize("raw, expected", [("João", "joao"), ("1 Coríntios", "1corintios"), ("  Gênesis ", "genesis")])
    def test_normalises(self, raw, expected):
        assert normalise_book_name(raw) == expected
```

One case per rule or branch, `ids=` when values don't explain themselves. Unit tests are where
variations belong; integration tests then check the wiring with one case.

## Domain areas worth covering (Doresh)

| Area | Typical cases |
|---|---|
| Bible references | book name normalisation (accents, numbers: "1 João"), chapter bounds per book (66 books, NVI vs ARA), verse ranges (`verse_end ≥ verse_start`), unknown book |
| Bible data | every book JSON loads for both versions; chapter count matches `bible_books_database.json` (this reads files → integration, or a fixture) |
| Auth helpers | token round-trip (`generate_tokens` → `decode_token`), expired token raises, tampered token raises, `hash_password`/`verify_password` |
| Serialization | UUID/datetime/nested models in `serialize()` |
| Ruach | prompt builder keeps the system prompt first, truncates history to the limit, user text never placed in the system role; response parsing; error mapping of the client |
| Schemas | our own validators only (cross-field rules, ranges), not Pydantic's built-ins |

Ask for expected values when they aren't in code or docs; don't derive them from the
implementation (the test would just repeat the code).

## Time and randomness

Inject them (`now` parameter, `rng`) rather than freezing global time. If the code calls
`datetime.now()` directly and that matters, ask `dev-backend-python` to make it injectable.

## Rules

- No I/O. Long inputs via `tests/mockups/` (`qa-add-fixture`), loaded at module level
- Fake content only ("Estudo de teste", `usuario@example.com`)
- Never `assert result is not None` as the only assertion
- Floats: `pytest.approx` with a tolerance
- No mocks of the unit's own collaborators just to reach a line
