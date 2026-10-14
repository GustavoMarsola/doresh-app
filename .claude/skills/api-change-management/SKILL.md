---
name: api-change-management
description: |
  Decide whether a change to the Doresh API is additive or breaking and handle breaking changes
  safely: expand/contract, deprecation (FastAPI deprecated flag, Deprecation/Sunset headers),
  stable error codes, migrating the legacy Response(json.dumps(...)) handlers to response
  models, OpenAPI snapshot, and commit/changelog markers. Use before changing any request or
  response schema, route path, status code, error code or auth behaviour.
---

# API Change Management

The API is consumed by **our own frontend** in the same repo and deployed in the **same image**,
so frontend and backend ship together. That makes most changes easy — but not free:

- Users keep a browser tab open across a deploy: the **old JS** talks to the **new API** until reload
- n8n workflows and any future mobile app/integration call the API independently
- `localStorage` tokens issued by the old version must keep working (or the user is logged out cleanly)

## 1. Classify

| Change | Class |
|---|---|
| New endpoint / new optional request field / new response field | additive |
| New enum value in a response | breaking-risk (frontend must map it) |
| Remove/rename endpoint, field or query param | **breaking** |
| New required request field; tighter validation | **breaking** |
| Type/format change of a field | **breaking** |
| Status code or `detail` code change for an existing case | **breaking** |
| Pagination shape / default sort / page size change | **breaking** |
| Token claims, login flow, `x-api-key` rules | **breaking** |
| Rename/remove an env var | breaking for operators (docker compose, `.env`) |

In doubt, treat it as breaking.

## 2. Same-release changes (frontend + backend in one PR)

Allowed when **only our SPA** uses the endpoint: change both sides in one PR, and make the
backend tolerate the previous request shape for one release when an open tab could still send it
(accept old + new field, new wins). Tell `dev-frontend-react` exactly what changed
(`frontend-api-contract` §6).

## 3. Expand / contract (anything consumed outside the SPA, or risky)

1. **Expand**: add the new field/endpoint alongside the old
2. **Migrate** consumers (SPA, n8n flows)
3. **Deprecate** the old one (§4)
4. **Contract**: remove in a later release

## 4. Deprecate

```python
@router.patch(path="/study", deprecated=True)
async def patch_study_legacy(..., response: Response):
    response.headers["Deprecation"] = "true"
    response.headers["Sunset"] = "Wed, 31 Mar 2027 00:00:00 GMT"
    response.headers["Link"] = '</api/v1/study/{id}>; rel="successor-version"'
```

Changelog `### Deprecated` with the date and replacement; log usage (endpoint + user id, no content)
before removing.

## 5. Legacy handlers → response models

Existing use cases return `Response(content=json.dumps(serialize({...,"message": ...})))`.
Moving one to `response_model=<Resource>Response` changes the body (e.g. drops `message`, changes
the envelope). That is a **contract change**: do it with the frontend in the same PR, and list the
before/after body in the PR.

## 6. Stable error contract

The frontend branches on `detail` codes (`study.not_found`, `ai.rate_limited`,
`auth.invalid_credentials`), not on messages. Codes are `<area>.<reason>`. Once released, a code's
meaning never changes; add new codes instead. New code → README API section + `frontend` error map.

## 7. Contract snapshot (recommended once tests exist)

Commit `backend/openapi.snapshot.json`; a test (owned by `dev-qa`) fails when `app.openapi()`
differs, so contract changes show in the PR diff:

```bash
cd backend && python -c "import json; from src.app import create_app; print(json.dumps(create_app().openapi(), indent=2, sort_keys=True))" > openapi.snapshot.json
```

## 8. Mark it

- Commit/PR title with `!` and a `BREAKING CHANGE:` footer describing the migration (`git-commit`)
- PR "API contract" section ticked (`git-branch-and-pr`); release notes list it (`release`)

## Checklist

- [ ] Classified; doubts treated as breaking
- [ ] SPA updated in the same PR, or expand/contract used
- [ ] Old request shape tolerated for one release where open tabs could send it
- [ ] Error codes unchanged or new ones added and mapped in the frontend
- [ ] README API table / snapshot updated
- [ ] `!` + `BREAKING CHANGE:` when breaking
