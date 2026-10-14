---
name: git-commit
description: |
  Create commits in the Doresh monolith following Conventional Commits with the project's
  scopes (auth, studies, bible, ruach, ui, landing, migrations, agents...), breaking-change and
  security footers, atomic commit rules (model + migration together, backend + frontend of one
  contract change together) and pre-commit safety checks (no secrets, no real user content).
  Use whenever asked to commit, or to write/fix a commit message.
---

# Commit (Conventional Commits)

Commit **only when the user asks**. Messages feed the changelog and the version bump (`release`).

## Format

```
<type>(<scope>)[!]: <subject>

[body: why, not what; wrap at 72]

[footers]
```

- **subject**: imperative, lowercase start, no trailing period, ≤ 72 chars, English
- **`!`** marks a breaking change and **requires** a `BREAKING CHANGE:` footer

## Types

| Type | Use for | Changelog | Bump |
|---|---|---|---|
| `feat` | new capability for users or API consumers | Added | minor |
| `fix` | bug fix | Fixed | patch |
| `perf` | performance, same behaviour | Changed | patch |
| `refactor` | internal change, no behaviour change | hidden | none |
| `test` | tests only | hidden | none |
| `docs` | README, docs | hidden | none |
| `build` | dependencies, Docker, Vite/Alembic setup | hidden (Security if CVE) | none/patch |
| `ci` | CI | hidden | none |
| `chore` | tooling, `.claude/`, release commits | hidden | none |
| `style` | formatting only | hidden | none |
| `revert` | `revert: <original subject>` + `This reverts commit <sha>.` | as reverted | as reverted |

## Scopes

| Scope | Covers |
|---|---|
| `auth` | register, verify e-mail, login, JWT, logout, sessions |
| `users` | profile, account data |
| `bible` | books, versions, reader, highlights, comments |
| `studies` | studies/sermons, sections, references, library, PDF export |
| `ruach` | AI assistant, OpenAI integration, prompts, quotas |
| `ui` | design tokens, shared components, layout, theme |
| `landing` | landing page, SEO meta |
| `api` | API client, contract plumbing (frontend `src/lib/api`) |
| `migrations` | Alembic setup / migration-only commits (rare: migrations ship with their model) |
| `settings`, `logging`, `cache`, `email`, `docker` | infrastructure |
| `deps` | dependency bumps (with `build`) |
| `tests` | shared test infrastructure |
| `agents` | `.claude/` agents and skills |
| `product`, `seo` | `project/`, `docs/product/`, `docs/seo/` |

One scope; spans many areas → omit it. New domain → new scope; keep this table updated.

## Footers

| Footer | When |
|---|---|
| `BREAKING CHANGE: <what breaks + migration>` | any `!` commit |
| `Security: <impact in general terms>` | closes a vulnerability or a cross-user leak — class of issue, **never** exploit steps |
| `Refs: <card url>` / `Closes: #123` | linked card/issue |
| `Migration: <revision id>` | adds an Alembic migration |
| attribution lines | whatever the session/system instructions require |

## Atomic commits

- Model + **its migration** in the same commit
- A contract change: backend route/schema + the frontend types/calls that use it in the same commit
  (or consecutive commits in one PR), so `main` never has a mismatched pair
- Don't mix a refactor with a behaviour change; formatting-only changes get their own `style`/`chore` commit

## Before committing

```bash
git status --short
git diff --cached --stat
git diff --cached
```

Refuse to commit (and tell the user) if the staged diff contains:
- `.env` files, keys, tokens, passwords, DB URLs with credentials (`OPENAI_API_KEY`, `JWT_SECRET_KEY`, `TRELLO_*`)
- real user content: studies, comments, chat transcripts, e-mails of real people
- build artefacts: `backend/static/`, `node_modules/`, `dist/`, `__pycache__/`, `.venv/`

Stage files by name, not `git add -A`, unless every untracked file was reviewed. Never `--no-verify`.

## Writing the message

```bash
git commit -F - <<'EOF'
fix(studies): scope study update and delete to the owner

Any authenticated user could edit or soft-delete another user's study
by id. Both now load the study through an owner-scoped query and
return 404 otherwise.

Security: cross-user write on studies (update and delete)
EOF
```

Add the attribution lines the session requires.

## Examples

```
feat(ruach): add per-user daily question quota
feat(bible)!: return verses as objects with number and text

BREAKING CHANGE: GET /api/v1/bible/book now returns
chapters[].verses[] as {number, text} instead of strings.
build(migrations): adopt alembic with baseline
chore(agents): add product and marketing agents
```

## Fixing mistakes

- Last commit, not pushed: `git commit --amend` is fine
- Pushed to a shared branch: new commit; never rewrite shared history
- Wrong message on a branch that will be squash-merged: fix the **PR title** instead
