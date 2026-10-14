---
name: frontend-add-resource
description: |
  Add a full resource screen set to the Doresh frontend end-to-end: server-paginated list page
  (filters in the URL, search, desktop grid/table + mobile cards), detail page, create/edit
  form with react-hook-form + zod, delete with confirmation, route, navigation entry, pt-BR
  copy, all UX states, light/dark themes and tests. Use for studies/sermons library,
  collections, highlights and comments lists, reading plans or any new list+detail screen.
---

# Add a resource (list + detail + form)

Prerequisites: the spec (`docs/product/features/<slug>/spec.md`) or story with acceptance
criteria, and the API wired with `frontend-api-contract`. Open the closest existing page
(`Library.tsx`, `CreateSermon.tsx`) and mirror it; this skill describes the shape.

## Files

```
src/features/<domain>/
├── queries.ts                      keys + hooks (frontend-api-contract)
├── schemas.ts                      zod form schema(s)
├── components/<Resource>Grid.tsx   desktop list (cards or table)
├── components/<Resource>Cards.tsx  mobile list (if different)
├── components/<Resource>Filters.tsx
└── components/<Resource>Form.tsx   create + edit
src/pages/<Resource>…Page.tsx
```

## 1. List page

- Inside `Layout`; title, short description, **one** primary action ("Novo estudo")
- Filters, search, sort and page live in the **URL** (`useSearchParams`); reset `page` to 1 when a filter changes; search debounced 300 ms
- `useXxx(params)` with `keepPreviousData`; subtle loading indicator while `isPlaceholderData`, never blank the list
- Desktop: grid of cards (studies) or table (highlights/comments), whole card clickable and keyboard accessible
- Mobile: single column, the 2–3 fields that matter (title, references, date, "IA" badge), no horizontal scroll
- States:
  - loading: `Skeleton` cards shaped like the real ones
  - empty, no filters: guiding `EmptyState` + primary action ("Você ainda não tem estudos. Crie o primeiro ou peça ajuda ao Ruach.")
  - empty with filters: "Nenhum resultado para estes filtros." + "Limpar filtros"
  - error: message + "Tentar novamente" (`refetch`)

## 2. Detail page

- `useXxx(id)`; `ApiError` 404 → `NotFoundPanel` ("Estudo não encontrado.") with a link back. Never hint the record exists for someone else
- Header: title, references, "Gerado com IA" badge when `ai_generated`, actions (edit, export PDF, delete in an overflow menu)
- Scripture inside the content uses `font-crimson`, comfortable line length; references link to the reader (`/ler?livro=...&capitulo=...` — confirm the reader's URL params)
- Mobile: compact header, actions in an overflow menu or bottom sheet

## 3. Form (create + edit)

```ts
export const studySchema = z.object({
  title: z.string().trim().min(1, 'Informe um título.').max(200),
  introduction: z.string().trim().min(1, 'Escreva uma introdução.'),
  conclusion: z.string().trim().min(1, 'Escreva uma conclusão.'),
  sections: z.array(z.object({ title: z.string().trim().optional(), text: z.string().trim().min(1, 'A seção precisa de texto.') })).min(1),
  references: z.array(z.object({ book: z.string().min(1), chapter: z.number().int().min(1), verse_start: z.number().int().min(1).nullable(), verse_end: z.number().int().min(1).nullable() })),
});
```

- `useForm({ resolver: zodResolver(schema), defaultValues })`; same form for create and edit (`reset` when the record loads)
- One mapping function to the API body (`toCreateBody(values)`): `'' → null`, numbers parsed, `order_index` from array position
- `422` field errors → `form.setError(field, ...)`; known codes → field error or toast
- Submit disabled while pending, label "Salvando..."; toast from the mutation; navigate on success
- Long texts: autosave a **local draft** per user (`doresh:{userId}:draft:<id|new>`), cleared on save and on logout — never server content in storage beyond the draft
- Mobile: full-screen form, single column, sticky save button reachable by the thumb
- Leaving with unsaved changes → confirmation

## 4. Delete

`ConfirmDialog` naming the record ("Excluir o estudo "A parábola do semeador"?"). Studies are
soft-deleted; don't say "não pode ser desfeito" unless it's true. On success: toast, invalidate
lists, navigate to the list.

## 5. Routes and navigation

- `App.tsx`: inside `ProtectedRoute`, wrapped in `Layout` (and `ChatProvider` like siblings), pt-BR paths (`/estudos`, `/estudos/:id`)
- Navigation entry in `components/layout/navigation.tsx` with a thin Lucide icon; mobile nav only for the top destinations

## 6. Copy (pt-BR, `design_context.md` §6)

Titles, labels, placeholders, empty/error states, toasts. Warm, short, "você". Errors say what
failed and what to do.

## 7. Events

`track('estudo_criado', { ai_generated, secoes: n })` in `onSuccess` — **never** titles, text,
references or any user content.

## 8. Tests (once Vitest exists)

List renders from MSW; empty state for a new user; filter updates the URL; form validation
messages; submit sends the mapped body; detail 404 shows `NotFoundPanel`.

## 9. Done

`frontend-design-review` on every page (360 px + desktop, light + dark), update `docs/telas.md`,
clear the agent's Definition of Done.
