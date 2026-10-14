---
name: backend-add-external-integration
description: |
  Add or change an external API integration in the Doresh backend: OpenAI for the Ruach
  assistant and AI-generated studies, transactional e-mail (verification, password reset), n8n
  webhooks and automations, or any new provider. Covers the httpx/SDK client wrapper with
  timeouts and error mapping, settings, use case, per-user rate limits and AI cost control,
  privacy of prompts (LGPD sensitive data), inbound webhook signature checks, and the QA hand-off.
---

# Add an External Integration

Doresh holds **one platform account per provider** (OpenAI, SMTP, n8n), configured in
`src/settings.py`. The integration must behave well when the provider is slow, down,
rate-limited or rejects the key — and it must never leak what users write: prompts, studies and
chat messages are **sensitive personal data** (religious conviction, LGPD art. 11).

Running example: **OpenAI chat for Ruach** (`provider = "openai"`).

---

## 0. Gather before writing

- Provider, API docs URL, auth type, official SDK vs plain `httpx`
- Direction: **outbound** (we call) / **inbound** (provider or n8n calls us) / both
- What user data is sent, and is that disclosed in the privacy policy? (OpenAI: yes, must be — ❓ Q6)
- Rate limits, pricing per call/token, sandbox/test mode (`IS_TEST_MODE` exists for OpenAI)
- For AI: model id, max tokens, system prompt owner (`talmid` reviews biblical fidelity)

## 1. Settings — `src/settings.py`

`OpenAISettings` already exists (`get_settings().openai_settings`: `openai_api_key`,
`openai_api_gpt_model`, `open_ai_assistant_id`, `is_test_mode`). Extend it rather than creating a
second class, keeping its naming and alignment:

```python
class OpenAISettings(BaseSettings):
    openai_api_key:           str   = Field(...,  validation_alias="OPENAI_API_KEY")
    openai_api_gpt_model:     str   = Field(...,  validation_alias="OPENAI_API_GPT_MODEL")
    open_ai_assistant_id:     str   = Field(...,  validation_alias="OPENAI_ASSISTANT_ID")
    is_test_mode:             bool  = Field(True, validation_alias="IS_TEST_MODE")
    openai_timeout_seconds:   float = Field(30.0, validation_alias="OPENAI_TIMEOUT_SECONDS")
    openai_max_output_tokens: int   = Field(1200, validation_alias="OPENAI_MAX_OUTPUT_TOKENS")
```

New groups (e.g. a new provider) follow the same pattern and are added as a `ClassVar` on
`GeneralSettings`. Add each variable to `.env.example` and the README. Never read `os.environ` elsewhere; never expose a key to the frontend (`VITE_*`
is public).

## 2. Client wrapper — `src/infrastructure/apis/openai_api.py`

```python
from dataclasses import dataclass
import httpx

from src.infrastructure.apis.errors import AIUnavailable, AIRateLimited, AIAuthError


@dataclass(frozen=True, slots=True)
class ChatTurn:
    role: str
    content: str


class OpenAIClient:
    """Stateless per call; settings and transport injected so tests can use httpx.MockTransport."""

    def __init__(self, api_key: str, model: str, timeout: float, transport: httpx.AsyncBaseTransport | None = None):
        self._api_key = api_key
        self._model = model
        self._timeout = timeout
        self._transport = transport

    async def complete(self, turns: list[ChatTurn], max_output_tokens: int) -> tuple[str, int]:
        async with httpx.AsyncClient(base_url="https://api.openai.com/v1", transport=self._transport,
                                     timeout=httpx.Timeout(self._timeout, connect=5.0)) as client:
            response = await client.post(
                "/chat/completions",
                headers={"Authorization": f"Bearer {self._api_key}"},
                json={"model": self._model, "max_tokens": max_output_tokens,
                      "messages": [{"role": t.role, "content": t.content} for t in turns]},
            )
        data = self._handle(response)
        return data["choices"][0]["message"]["content"], data["usage"]["total_tokens"]

    @staticmethod
    def _handle(response: httpx.Response) -> dict:
        if response.status_code in (401, 403):
            raise AIAuthError()
        if response.status_code == 429:
            raise AIRateLimited(retry_after=response.headers.get("Retry-After"))
        if response.status_code >= 500:
            raise AIUnavailable()
        response.raise_for_status()
        return response.json()
```

If the code already uses the official SDK, keep the SDK and wrap it the same way (timeouts,
error mapping, injectable client). Check the current API/endpoint in the provider docs before
writing; don't trust this example's endpoint blindly.

Rules:
- One module per provider in `infrastructure/apis/`; map provider errors onto a small shared
  hierarchy (`errors.py`) so use cases don't know provider specifics
- Explicit timeouts always. Retry only idempotent reads (≤ 3, with backoff). **Never retry a
  chat completion automatically** (double cost, duplicate answers)
- Never log request bodies, prompts, answers or headers. Log provider, status, latency, token **counts**
- Parse responses into dataclasses/Pydantic at the edge

## 3. Use case

```python
async def ask_ruach(self, payload_token: dict, data: RuachQuestion) -> RuachAnswer:
    user_id = UUID(payload_token["sub"])
    await self._enforce_rate_limit(user_id)
    session = await self.repository.ai.get_owned_session(user_id, data.session_id)
    if not session:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="ai.session_not_found")
    history = await self.repository.ai.recent_messages(session.id, limit=20)
    try:
        answer, tokens = await self.client.complete(build_turns(SYSTEM_PROMPT, history, data.question),
                                                    self.settings.openai_max_output_tokens)
    except AIRateLimited:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, detail="ai.rate_limited")
    except (AIUnavailable, AIAuthError):
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, detail="ai.unavailable")
    await self.repository.ai.save_exchange(session.id, data.question, answer)
    _logger.info("ruach answer", extra={"user_id": str(user_id), "tokens": tokens})
    return RuachAnswer(answer=answer, ai_generated=True)
```

- **Ownership**: chat sessions/messages belong to a user; load them owner-scoped (404 otherwise)
- **Rate limit per user** in Redis: `u:{user_id}:ai:quota:{yyyymmdd}` with TTL; exceeded → 429 `ai.quota_exceeded`
- **Cost**: cap history length and `max_output_tokens`; record token counts for the PM's cost metric
- **Prompt injection**: user text is data, not instructions; the system prompt keeps Ruach on
  topic and asks it to cite Scripture references. System prompt text lives in one module and is
  reviewed with `talmid`
- **Test mode**: when `is_test_mode` is on, return a deterministic canned answer without calling the provider

## 4. E-mail

- SMTP credentials in settings; templates in `common/email_templates.py` (pt-BR)
- Send outside the request when possible (background task with its own session); a failed
  e-mail never fails registration silently — record status and allow resend
- Links in e-mails use the frontend route and carry one-time tokens; never put the user's
  password or personal content in an e-mail

## 5. Inbound webhooks (n8n or providers)

- Route `POST /api/v1/webhooks/<provider>`; no JWT, **signature or secret header** verified with
  `hmac.compare_digest` against a secret in settings; bad/missing → 401 with no detail
- Never take a `user_id` from the payload to act on someone's data without a verified link
  (e.g. a token we issued and stored)
- Return fast (`202`), process idempotently (store the provider event id)

## 6. Hand-off to dev-qa

```
Integration: OpenAI (Ruach). Client: src/infrastructure/apis/openai_api.py (accepts `transport`).
Please add: mockups under tests/mockups/openai/ (ok, 401, 429, 500); unit tests for error mapping
and build_turns; integration tests: happy path saves the exchange, 429 → ai.rate_limited,
500 → ai.unavailable and nothing saved, per-user quota exceeded → ai.quota_exceeded, user B cannot
post into user A's session (404), is_test_mode returns the canned answer without HTTP.
```

## Checklist

- [ ] Settings + `.env.example` + README; no key in the frontend
- [ ] Client: explicit timeouts, error mapping, injectable transport, no automatic retry of completions
- [ ] Ownership on sessions/messages; per-user rate limit; cost caps
- [ ] No prompts/answers/content in logs or events; token counts only
- [ ] System prompt reviewed for biblical fidelity (`talmid`)
- [ ] Webhooks: verified secret, constant-time compare, idempotent
- [ ] Privacy policy mentions the provider (flag to the user if ❓)
- [ ] QA hand-off sent
