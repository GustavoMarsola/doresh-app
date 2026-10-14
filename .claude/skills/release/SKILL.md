---
name: release
description: |
  Cut a release of the Doresh monolith (backend + frontend in one Docker image): pre-flight
  checks on both sides, next Semantic Version from Conventional Commits, version bump
  (APP_VERSION / package.json), CHANGELOG.md (Keep a Changelog) with upgrade notes (env vars,
  migrations, manual steps), release commit and annotated tag, GitHub release, user-facing
  release notes in pt-BR, hotfixes and rollback. Use when asked to release, tag, bump the version
  or write a changelog.
---

# Create a Release

Releases are annotated tags `vX.Y.Z` on `main`. One tag = one Docker image with API + SPA.

**Pushing tags and publishing releases is outward-facing: confirm with the user before
`git push` of the tag and before creating the GitHub release.**

## Versioning (SemVer)

| Commits since last tag | `1.x+` | `0.x` |
|---|---|---|
| `!` / `BREAKING CHANGE:` | major | minor |
| `feat` | minor | minor |
| only `fix` / `perf` / security `build(deps)` | patch | patch |
| only hidden types | no release needed (ask) | same |

❓ Version source: `AppSettings.app_version` defaults to `"1.0.0"` (`APP_VERSION` env) and
`frontend/package.json` says `0.0.0`. The first release must pick **one** source of truth (suggest:
a `VERSION` file at the repo root read by both, or `APP_VERSION` set from the tag at build time)
and the starting number. Ask; don't decide.

## 1. Pre-flight

```bash
git switch main && git pull --ff-only
git status --short                       # clean
git describe --tags --abbrev=0           # last tag (none → first release)
cd backend && python -c "import src.app" && pytest -q        # once the suite exists
cd backend && alembic heads                                   # once Alembic exists: one head
cd frontend && npx tsc -p tsconfig.app.json --noEmit && npm run lint && npm run build
docker compose build                      # the image actually builds
```

Stop and report if anything fails. Never release with failing or skipped ownership tests.

## 2. Collect changes

```bash
git log <last-tag>..HEAD --no-merges --format='%H%n%s%n%b%n---END---'
```

Classify by type, `!` and footers (`BREAKING CHANGE:`, `Security:`, `Migration:`). Non-conventional
commits: read the diff, classify manually, mention them to the user.

## 3. Compute the version

Show last → proposed and why ("2 feat, 1 fix → 0.4.0"). Proceed after confirmation.

## 4. CHANGELOG.md (English, newest first)

```markdown
# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · Versioning: [SemVer](https://semver.org/).

## [Unreleased]

## [0.4.0] - 2026-10-14

### ⚠ Breaking changes
- **bible:** verses returned as `{number, text}`; old tabs reload automatically.

### Added
- **studies:** collections to organise studies.

### Fixed
- **studies:** update and delete are scoped to the study's owner.

### Security
- **studies:** fixed a cross-user write on studies.

### Upgrade notes
- **Env vars:** new `OPENAI_MAX_OUTPUT_TOKENS` (default 1200).
- **Migrations:** `3f2a9c1b7d10` (create `collections`). Existing databases: `alembic upgrade head`.
- **Manual steps:** none.
```

Mapping: `feat` → Added · `fix` → Fixed · `perf` → Changed · deprecations → Deprecated · removals →
Removed · `Security:` → Security. **Upgrade notes are mandatory** (or "none"). Security entries
describe the class of issue, never exploit details.

User-facing notes (pt-BR, simple language, no internals) go to
`docs/product/release-notes/AAAA-MM-DD.md` with the `product-manager` (`feature-launch`).

## 5. Bump, commit, tag

```bash
git add CHANGELOG.md <version files>
git commit -F - <<'EOF'
chore(release): v0.4.0
EOF
git tag -a v0.4.0 -m "v0.4.0"
```

Add the attribution lines the session requires. Show the commit and tag, then **ask before**
`git push origin main` and `git push origin v0.4.0`.

## 6. GitHub release

```bash
gh release create v0.4.0 --title "v0.4.0" --notes-file <scratchpad>/notes.md --verify-tag
```

Without `gh`: give `https://github.com/<owner>/<repo>/releases/new?tag=v0.4.0` plus the notes.

## 7. Deploying (not done by this skill)

Tell the user the order: back up the database → apply migrations (must be compatible with the
running version) → deploy the new image. Not compatible → the notes say "requires downtime" or
describe expand/contract.

## Hotfixes

- Nothing unreleased on `main`: normal branch → PR → patch release
- Unreleased work that must not ship: `git switch -c hotfix/0.4.1 v0.4.0`, fix with tests, bump,
  tag, then bring the fix back to `main`. Never leave a fix only on a hotfix branch
- A fix for a cross-user leak (`Security:`) ships as soon as tests pass; tell the user that LGPD
  may require notifying affected users/ANPD — that call is theirs

## Rollback

Prefer roll-forward. Roll back the image only; roll back a migration only if it is the problem
**and** its `downgrade()` is safe for data written since. Say this explicitly.
