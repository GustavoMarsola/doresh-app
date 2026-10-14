---
name: git-branch-and-pr
description: |
  Branching and pull-request workflow for the Doresh monolith (GitHub Flow with squash merge):
  branch named after the Trello card, keeping current with main, pre-PR checks for backend
  (import, pytest, alembic heads) and frontend (typecheck, lint, build, design review), PR title
  as a Conventional Commit, PR description with database/privacy/API-contract/deploy sections,
  opening the PR with gh or the GitHub web UI. Use when starting work on a change, opening or
  updating a PR.
---

# Branches & Pull Requests

## Model: GitHub Flow + squash merge

- `main` is always deployable. No direct commits to `main`
- One short-lived branch per change (ideally < 3 days), merged by **squash**
- Squash message = **PR title** → the PR title must be a valid Conventional Commit (`git-commit`)
- Releases are tags on `main` (`release`)

## 1. Start a branch

Every branch belongs to one Trello card; move it to the "in progress" list first (`trello`, with
confirmation). Branch from an up-to-date `main`:

```bash
git switch main
git pull --ff-only
git switch -c <normalised_card_title>
```

**Branch name = card title normalised:** lowercase, accents removed, runs of spaces/punctuation →
single `_`, no leading/trailing `_`.

```bash
python3 -c "import re,sys,unicodedata as u; s=u.normalize('NFKD',sys.argv[1]).encode('ascii','ignore').decode().lower(); print(re.sub(r'[^a-z0-9]+','_',s).strip('_'))" "<card title>"
```

| Card | Branch |
|---|---|
| Pregador gera esboço de sermão a partir de um texto | `pregador_gera_esboco_de_sermao_a_partir_de_um_texto` |
| Corrigir edição de estudo de outro usuário | `corrigir_edicao_de_estudo_de_outro_usuario` |

Exception: `hotfix/<version>` for patches cut from a release tag.

## 2. Keep it current

```bash
git fetch origin
git rebase origin/main      # branch only yours; otherwise merge origin/main
```

Once Alembic exists: if `main` gained a migration, point your `down_revision` at the new head;
`alembic heads` must show exactly one head.

## 3. Before opening the PR

Backend (if touched):
- [ ] `cd backend && python -c "import src.app"`
- [ ] `pytest -q` green (once the suite exists), ownership tests included and not skipped
- [ ] `alembic heads` one head; upgrade → downgrade → upgrade locally (once Alembic exists)
- [ ] README API table updated for route/status/error-code changes

Frontend (if touched):
- [ ] `cd frontend && npx tsc -p tsconfig.app.json --noEmit && npm run lint && npm run build`
- [ ] `npm test` (once Vitest exists)
- [ ] `frontend-design-review` run for user-facing changes

Both:
- [ ] No secrets / real user content in `git diff origin/main...HEAD`
- [ ] `backend/static/` (build output) not committed

## 4. PR title and description

Title: Conventional Commit, e.g. `feat(studies): add collections`. Breaking → `feat(bible)!: ...`
with `BREAKING CHANGE:` in the body.

Body (also `.github/pull_request_template.md` — create it if missing and the user agrees):

```markdown
## Summary
<!-- What and why, 1–3 sentences. Card: <url> -->

## Changes
- 

## Database
- [ ] No schema change
- [ ] New table only (created by create_all) — note: next change to it needs Alembic
- [ ] Migration(s): `<revision>` — <what, locks/backfills, reversible?>

## Privacy (per-user data)
- [ ] No user-owned data touched
- [ ] Every new query on user data filters by `user_id`; other users' records → 404
- [ ] Ownership tests added/updated: `tests/integration/ownership/...`
- [ ] No personal/religious content in logs, events or browser storage

## API contract
- [ ] No API change
- [ ] Additive only
- [ ] Changed together with the frontend in this PR
- [ ] Breaking — `BREAKING CHANGE:` below + `api-change-management` followed

## Screens
<!-- Before/after at 360 px and desktop, light and dark, fictitious data only -->

## Deploy notes
<!-- New env vars, alembic stamp/upgrade, manual steps. "None" if none. -->

## Tests
<!-- Commands run + result -->
```

## 5. Open it

Pushing and opening a PR are outward-facing: **confirm with the user first**.

```bash
git push -u origin HEAD
gh pr create --base main --title "<title>" --body-file <scratchpad>/pr-body.md
```

Without `gh`: give the compare URL (owner/repo from `git remote get-url origin`) plus the title
and body ready to paste. Add the attribution lines the session requires to the PR body.

## 6. Review and merge

- Reviewer focus: privacy/ownership → security → migrations → API contract → correctness → UX → style
- Address review with new commits; no force-push during review unless asked
- **Squash and merge**; keep `BREAKING CHANGE:` / `Security:` / `Migration:` footers; delete the branch
- Move the card to "done" only after merge and acceptance by the `product-owner`
