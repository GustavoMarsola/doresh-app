---
name: qa-add-fixture
description: |
  Add a static test fixture to backend/tests/mockups/ for Doresh: OpenAI responses (ok, errors,
  rate limit), n8n/webhook payloads, e-mail payloads, request bodies for studies, a trimmed Bible
  book JSON. Covers layout, anonymisation (no real users, no real study content), the loader
  helper and provenance notes.
---

# Add a Fixture to tests/mockups/

## Layout

```
backend/tests/mockups/
├── __init__.py              # load_text / load_json / load_bytes
├── openai/                  # chat_completion_ok.json, error_401.json, error_429.json, error_500.json
├── n8n/                     # <workflow>_<event>.json
├── studies/                 # create_body_full.json, patch_body_sections.json
└── bible/                   # joao_trimmed_nvi.json (a few chapters only)
```

Name: `<what>_<case>.<ext>`, lowercase snake case; the case says why it exists (`_ok`,
`_missing_usage`, `_error_429`).

## Loader (create once)

```python
import json
from pathlib import Path

ROOT = Path(__file__).parent


def load_text(name: str) -> str:
    return (ROOT / name).read_text(encoding="utf-8")


def load_json(name: str):
    return json.loads(load_text(name))


def load_bytes(name: str) -> bytes:
    return (ROOT / name).read_bytes()
```

Unit tests load fixtures at **module level** into constants.

## Anonymise: mandatory

Fixtures are committed. Real user content is sensitive personal data (LGPD) and must never land
in the repo.

| Real data | Replace with |
|---|---|
| Names, usernames | `Usuário Teste`, `Pr. João Exemplo` |
| E-mails / phones | `usuario@example.com` / `+55 11 90000-0000` |
| CPF | `fake_cpf()` output (valid checks, prefix `999`) |
| Study text, comments, Ruach questions/answers | Neutral fictitious text ("Estudo de teste sobre João 3.16") |
| API keys, assistant ids, tokens | `test-api-key`, `asst_test`, `test-token` |

Keep the **structure** the code relies on (field names, nesting, `usage` blocks); replace values.

```bash
grep -rEn "@(gmail|hotmail|outlook|yahoo)\.|sk-[A-Za-z0-9]{10,}|[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}" backend/tests/mockups/<new files>
```

Every hit must be a known fake.

Bible text: NVI/ARA are copyrighted ❓; keep only the few verses a test needs.

## Provenance

JSON fixtures get a sibling `<name>.md` (or a first-line comment for text): source (provider docs
example / sandbox / anonymised capture), API version, date. Says whether it can be regenerated.

## Rules

- Minimal: trim payloads to the fields the code reads plus one unrelated field (proves unknown fields are ignored)
- One fixture per case; don't mutate a shared fixture in tests (`copy.deepcopy` first)
- Never hardcode long blobs inside test methods
