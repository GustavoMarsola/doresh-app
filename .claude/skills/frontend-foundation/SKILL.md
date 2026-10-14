---
name: frontend-foundation
description: |
  Consolidate the foundations of the existing Doresh SPA without a rewrite: one API client in
  src/lib/api (ApiError, stable error codes, x-api-key for public routes), one session/auth
  module (token access in one place, login/logout/401 that clear the TanStack Query cache and
  chat state), one exported queryClient with explicit defaults, errors.ts (code → pt-BR),
  storage.ts (doresh:* keys), track.ts (events without content), optional Vitest + Testing
  Library + MSW, and the living docs (docs/arquitetura.md, docs/telas.md). Use when asked to
  "organize the frontend", before the first big feature, or to add one missing foundation piece.
---

# Frontend foundation (incremental, on the existing app)

The app already runs (Vite + React + shadcn + TanStack Query + react-hook-form + zod). This skill
**adds structure and moves existing calls into it**; it doesn't regenerate the project. Do it
in small, reviewable steps, each leaving the app working.

Before starting, list for the user what you'll change and in which order; confirm anything that
adds dependencies.

## 1. API client — `src/lib/api/client.ts`

The only `fetch` in the app (besides static assets like `/logo.svg`).

```ts
import { session } from '@/lib/auth/session';

export class ApiError extends Error {
  constructor(public status: number, public code: string | null, message: string, public body?: unknown) {
    super(message);
  }
}

const BASE_URL = import.meta.env.VITE_API_HOST ?? '/api/v1';
const PUBLIC_KEY = import.meta.env.VITE_API_KEY ?? '';

type Query = Record<string, string | number | boolean | null | undefined>;
export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
  public?: boolean;
};

function buildUrl(path: string, query?: Query) {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }
  return url;
}

async function toApiError(res: Response) {
  const body = await res.json().catch(() => null);
  const detail = body?.detail;
  const code = typeof detail === 'string' ? detail : detail?.code ?? null;
  const message = body?.message ?? (typeof detail === 'string' ? detail : res.statusText);
  return new ApiError(res.status, code, message, body);
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.public) headers['x-api-key'] = PUBLIC_KEY;
  const token = session.getToken();
  if (token && !options.public) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (res.status === 401 && !options.public) session.expire();
  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
```

- Confirm `VITE_API_HOST` (does it already include `/api/v1`? Login uses `${VITE_API_HOST}/user/authenticate`)
  and set the default accordingly; in dev the Vite proxy serves `/api` same-origin
- Legacy handlers return `{ "message": ... }` and some return errors as a 200/4xx `Response` with
  only `message`; `toApiError` keeps `message` and the code when there is one. Map the legacy
  messages you meet to codes in `errors.ts` and ask the backend for stable codes (`api-change-management`)
- `src/lib/api/index.ts` exports one `api` object: `api.auth`, `api.users`, `api.bible`,
  `api.studies`, `api.ruach` (added by `frontend-api-contract`)

## 2. Session and auth — `src/lib/auth/`

```ts
const KEY = 'token';
let onExpire: () => void = () => {};

export const session = {
  getToken: () => { try { return localStorage.getItem(KEY); } catch { return null; } },
  setToken: (token: string | null) => {
    try { token ? localStorage.setItem(KEY, token) : localStorage.removeItem(KEY); } catch { /* storage blocked */ }
  },
  setExpireHandler: (handler: () => void) => { onExpire = handler; },
  expire: () => onExpire(),
};
```

- Keep the existing `'token'` key so logged-in users aren't logged out by the deploy
- Replace every `localStorage.getItem("token")` and the module-level `BEARER_TOKEN` constant in
  `components/utils.ts` with `session.getToken()` at call time
- `AuthProvider` + `useAuth()`: `login(email, password)`, `logout()`, `status`, `user`.
  `resetIdentity()` = `session.setToken(null)` → `queryClient.clear()` → clear `doresh:*` storage
  and chat state → navigate. Used by login (before storing the new token), logout and expire
- `ProtectedRoute` reads through `session` (keeps the expiry check)
- The move to an in-memory access token + HttpOnly refresh cookie is a **backend + frontend story**
  (refresh endpoint, cookie, CSRF). Propose it to the `product-owner`; don't fake it on the client

## 3. Query client — `src/lib/queryClient.ts`

```ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 1,
    },
  },
});
```

Exported once, used by `App.tsx` and `AuthProvider`. No persister.

## 4. Shared libs

| File | Contents |
|---|---|
| `lib/errors.ts` | `errorMessage(err, fallback)`: `ApiError.code` → pt-BR (`study.not_found` → "Estudo não encontrado."), else fallback |
| `lib/format.ts` | dates (`Intl`, `pt-BR`), Bible reference formatting (`João 3.16-18`) |
| `lib/storage.ts` | `prefKey(userId, key)` → `doresh:{userId}:{key}`, `getPref/setPref` with try/catch, `clearUserStorage()` |
| `lib/track.ts` | `track(event, props)` — ids/counts/enums only; no-op until an analytics decision exists |

## 5. Tests (ask before adding dependencies)

`vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`,
`jsdom`, `msw`. Scripts: `"test": "vitest run"`, `"typecheck": "tsc -p tsconfig.app.json --noEmit"`.
First tests: `request()` maps errors; logout clears the query cache before navigating; login as A
then as B never renders A's studies.

## 6. Docs (same PR)

- `docs/arquitetura.md`: structure, API client, auth flow, query conventions, forms, tokens,
  testing, build (Vite → `backend/static`), decisions taken here
- `docs/telas.md`: route → page → purpose → protected? → main API calls

## 7. Verify

```bash
cd frontend && npx tsc -p tsconfig.app.json --noEmit && npm run lint && npm run build
```

Run the app (`run` skill): login, navigate every protected route, logout, login as another user.
Commit in steps (`refactor(api): ...`, `refactor(auth): ...`) with `git-commit`.
