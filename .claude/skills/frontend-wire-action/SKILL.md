---
name: frontend-wire-action
description: |
  Wire an action endpoint into the Doresh frontend: generate a study or sermon outline with AI
  (long-running, costly, can fail or hit a quota), send a question to Ruach (streaming-friendly
  chat state), toggle/colour a verse highlight (optimistic), add/edit a comment on a passage,
  export a study to PDF, delete or duplicate a study — with confirm dialogs, optimistic updates
  with rollback, invalidation of every affected query, toasts and events. Use whenever a button
  does something other than editing a form's fields.
---

# Wire an action

## 1. Know the rules

- Read the backend use case: what it changes, what it returns, error codes (`ai.rate_limited`,
  `ai.quota_exceeded`, `ai.unavailable`, `study.not_found`)
- Side effects the user must know about are spelled out ("Gerar com o Ruach substitui as seções
  atuais." — or, better, generate into a new draft)

## 2. Choose the pattern

| Action | Pattern |
|---|---|
| Highlight a verse / change colour / remove highlight | **Optimistic**, no confirmation; undo in the toast if supported |
| Add/edit a comment on a passage | Small dialog or inline editor with zod validation; wait for the server |
| Generate a study/outline with AI | Wait for the server with a clear **progress state** (can take seconds); cancel button (`AbortController`); result opens as an editable draft marked "Gerado com IA" |
| Ask Ruach | Chat pattern (§4) |
| Delete a study | `ConfirmDialog` naming the record; wait for the server |
| Export PDF | Client-side (`exportSermonToPDF`) — show progress, don't block the page; filename without personal data beyond the title the user chose |

## 3. Mutation with optimistic update (highlight)

```ts
export function useToggleHighlight(bookKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.bible.highlight,
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: highlightKeys.book(bookKey) });
      const previous = queryClient.getQueryData<Highlight[]>(highlightKeys.book(bookKey));
      queryClient.setQueryData<Highlight[]>(highlightKeys.book(bookKey), (list = []) => applyHighlight(list, vars));
      return { previous };
    },
    onError: (err, _vars, context) => {
      queryClient.setQueryData(highlightKeys.book(bookKey), context?.previous);
      toast.error(errorMessage(err, 'Não foi possível salvar o destaque.'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: highlightKeys.book(bookKey) });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
```

Optimistic only for frequent, low-risk, reversible actions. Invalidate everything whose content or
counts change (reader highlights, profile lists/counts, library).

## 4. Ruach chat

- Messages live in `ChatContext`/query state for the current user only; cleared on logout
- Send: append the user's message immediately (pending), disable send while waiting, show a
  typing indicator; on success append the answer marked as IA; on error keep the user's message
  with "Tentar novamente"
- Errors: `ai.rate_limited`/`ai.quota_exceeded` → explain the limit and when it resets;
  `ai.unavailable` → "O Ruach está indisponível no momento. Tente novamente em instantes."
- Streaming (if the backend adds it): render tokens as they arrive; abort on unmount/route change
- Never log, `track` or store the conversation content beyond the session state
- Answers render Markdown safely (no raw HTML); Scripture references become links to the reader

## 5. AI generation of a study

- Disable the trigger while running; show what is happening ("Gerando esboço com base em João 3.16...")
- Timeout/abort after a sensible limit with a friendly message
- Result is a **draft** the user reviews and saves; mark `ai_generated: true`
- Event: `estudo_gerado_ia { sucesso: true|false, codigo_erro }` — no content

## 6. Tests (once Vitest exists)

Optimistic highlight applied and rolled back on a 4xx from MSW with the error toast; confirm
dialog cancel doesn't call the API; AI quota error shows the limit message; chat keeps the user's
message on failure.
