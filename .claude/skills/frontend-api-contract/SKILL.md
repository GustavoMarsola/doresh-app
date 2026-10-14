---
name: frontend-api-contract
description: |
  Wire a backend resource into the Doresh frontend or sync a contract change: read the real
  FastAPI route/schema in backend/src (same repo), write the TypeScript types (snake_case,
  exact enums, page shape), the api namespace in src/lib/api/, query-key factory and TanStack
  Query hooks, MSW handlers when tests exist, and update every call site. Also produces a precise
  request to dev-backend-python when an endpoint is missing or wrong (pagination, ownership,
  error codes). Use for any new endpoint, changed field, or breaking change.
---

# API contract: types → `api` → hooks

## 1. Find the real contract (same repo)

```bash
grep -n "@router\.\(get\|post\|put\|patch\|delete\)" backend/src/routes/api/v1/<context>_routes.py
```

Read the route (path, method, status code, `session_token_required` vs `api_key_required`), the
use case (what it actually returns — legacy handlers wrap data in `{ "message", "<resource>": … }`)
and the Pydantic schemas in `backend/src/schemas/<context>_schemas.py`. Swagger at
`http://localhost:8000/api/docs` when the backend runs.

Backend not built yet → agree the contract with the user/`dev-backend-python` (§5) and mark the
types provisional. Never guess a field name silently.

## 2. Types — `src/types/<domain>.ts`

```ts
export interface StudyReference {
  book: string;
  chapter: number;
  verse_start: number | null;
  verse_end: number | null;
}

export interface StudySection {
  id: string;
  title: string | null;
  text: string;
  order_index: number;
}

export interface Study {
  id: string;
  title: string;
  introduction: string;
  conclusion: string;
  ai_generated: boolean;
  sections: StudySection[];
  references: StudyReference[];
  created_at: string;
  updated_at: string;
}

export interface StudiesPage {
  studies: Study[];
  page: number;
  per_page: number;
  total: number;
}

export interface StudyListParams {
  page?: number;
  per_page?: number;
  sort_by?: 'created_at' | 'title';
  order?: 'asc' | 'desc';
}
```

- Field names exactly as the JSON (snake_case); never camelCase-convert
- Enums as string unions with the backend values; pt-BR labels live in the UI, not in the type
- `null` where the backend is `Optional`; dates as ISO `string`
- No `user_id` needed in request types; leave it out of response types unless the UI uses it

## 3. API namespace — `src/lib/api/<resource>.ts`

```ts
export const studies = {
  list: (params: StudyListParams, signal?: AbortSignal) =>
    request<StudiesPage>('/studies', { query: { ...params }, signal }),
  create: (body: StudyCreate) => request<{ message: string; study: Study }>('/study', { method: 'POST', body }),
  update: (body: StudyUpdate) => request<{ message: string }>('/study', { method: 'PATCH', body }),
  remove: (id: string) => request<{ message: string }>(`/study/${id}`, { method: 'DELETE' }),
};
```

Register in `src/lib/api/index.ts`. Unwrap legacy envelopes **in the hook or a mapper**, not in
components, so the day the backend moves to `response_model` only one place changes.
Public routes (register, authenticate) pass `public: true` (adds `x-api-key`, no Bearer).

## 4. Query keys and hooks — `src/features/<domain>/queries.ts`

```ts
export const studyKeys = {
  all: ['studies'] as const,
  lists: () => [...studyKeys.all, 'list'] as const,
  list: (params: StudyListParams) => [...studyKeys.lists(), params] as const,
  detail: (id: string) => [...studyKeys.all, 'detail', id] as const,
};

export function useStudies(params: StudyListParams) {
  return useQuery({
    queryKey: studyKeys.list(params),
    queryFn: ({ signal }) => api.studies.list(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useCreateStudy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.studies.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studyKeys.lists() });
      toast.success('Estudo salvo.');
    },
    onError: (err) => toast.error(errorMessage(err, 'Não foi possível salvar o estudo. Tente novamente.')),
  });
}
```

Keys never include the user (the cache is cleared on identity change instead). Invalidate
`lists()` after create/delete, `detail(id)` + `lists()` after update, plus anything whose numbers
change (profile counts of highlights/comments). Bible text: `staleTime: Infinity` per
version/book — it's global and static.

## 5. When the backend is missing something — write the request

Flag and draft it (for the user, `dev-backend-python` or a Trello `Backend` card) when:

- a list isn't paginated, `total` isn't a real count, or filters the screen needs are missing
- an endpoint expects the client to say **whose** data it is (security issue — say so)
- an update/delete doesn't check ownership (known: `PATCH /study`, `DELETE /study/{id}`)
- errors have no stable code, or leak information (login 404 vs 401)
- the screen would have to fetch everything and aggregate on the client

```
Pedido ao backend: <título>
Tela/história: <link>
Endpoint: <METHOD /api/v1/...>
Request: <campos, tipos, obrigatórios>
Response: <campos, tipos, paginação>
Filtros/ordenação: <...>
Erros esperados (detail): <...>
Por quê: <o que a tela precisa e por que não se resolve no cliente>
```

## 6. Contract changes from the backend

1. Update the type → `npx tsc -p tsconfig.app.json --noEmit` lists every broken call site; fix all
2. New optional field: add it when the UI uses it
3. Renamed field during expand/contract: read the new name; fallback only until the sunset
4. New enum value: add to the union **and** to the UI label/status map
5. New error code: add the pt-BR message in `lib/errors.ts`
6. Update MSW handlers/fixtures (when tests exist)

## 7. Tests (once Vitest exists)

MSW handler per endpoint with fictitious data; one happy-path and one error test per hook/page.
