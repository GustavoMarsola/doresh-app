---
name: backend-write-migration
description: |
  Handle schema changes in the Doresh backend: adopt Alembic (baseline from the current models,
  stop relying on create_all), write and review migrations for new tables and columns, safe
  changes on a live database (nullable → backfill → NOT NULL, concurrent indexes, renames via
  expand/contract), per-user unique indexes on active rows, data backfills in SQL, and the
  report to the user. Use for any model/schema change.
---

# Schema changes and migrations

**Today the schema is created by `EntityModel.metadata.create_all` in `src/app.py`'s lifespan.**
`create_all` only creates missing tables: it never adds, alters or drops a column, index or
constraint on an existing table. On a deployed database, a model change without a migration
silently does nothing and the app breaks at runtime.

**Never run migrations against a non-local database.** Generate, review, run locally
(upgrade → downgrade → upgrade), then explain to the user what it does so they apply it.

---

## Decision tree

| Situation | Do |
|---|---|
| Alembic not adopted, change = **new table only** | `create_all` will create it on startup. Do it, and tell the user the next change to that table needs Alembic |
| Alembic not adopted, change **alters an existing table** | Stop. Explain the problem and propose §0 (adopt Alembic) before the change. Don't hand-run `ALTER TABLE` |
| Alembic adopted | §1–§5 |

## 0. Adopt Alembic (once, with the user's approval)

1. Add `alembic` to `backend/requirements.txt` (pinned)
2. `cd backend && alembic init src/infrastructure/database/migrations`; move `alembic.ini` to
   `backend/` with `script_location = src/infrastructure/database/migrations` and `prepend_sys_path = .`
3. `env.py`:
   - URL from settings, overridable by `-x db_url=...` (tests and tooling pass it explicitly):
     ```python
     from src.settings import get_settings

     def _database_url() -> str:
         return context.get_x_argument(as_dictionary=True).get("db_url") \
             or get_settings().database_settings._get_database_uri
     ```
     (confirm the real attribute names in `src/settings.py`; use the **sync** driver URL)
   - `from src.infrastructure.database import models` (registers every model) and
     `target_metadata = EntityModel.metadata`
   - `compare_type=True`, `compare_server_default=True`
4. **Baseline** = the schema production has today:
   - Empty revision `baseline` whose `upgrade()` creates exactly the current tables (autogenerate
     against an **empty** local DB, then review)
   - Existing databases are marked, not migrated: `alembic stamp <baseline_rev>` (the user runs it
     on each environment)
   - New databases: `alembic upgrade head`
5. Replace `create_all` in the lifespan: run nothing at startup (migrations are a deploy step), or
   — if the user wants one-command `docker compose up` to keep working — run `alembic upgrade head`
   in the container entrypoint before uvicorn. Ask which; record the decision in the README
6. `alembic check` clean; docs: README "Desenvolvimento local" + "Subindo com Docker" updated

Commit as `build(migrations): adopt alembic with baseline` (see `git-commit`).

## 1. Generate

```bash
cd backend && alembic revision --autogenerate -m "create collections"
```

Message: imperative, lowercase, what changes (`create collections`, `add theme to users`).
Autogenerate is a draft: review every line. It misses or mangles partial-index predicates,
server defaults, enum changes and data backfills.

## 2. Template: new user-owned table

```python
"""create collections"""
import sqlalchemy as sa
from alembic import op

revision = "..."
down_revision = "..."


def upgrade() -> None:
    op.create_table(
        "collections",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_collections_user_id", "collections", ["user_id"])
    op.create_index("uq_collections_user_name", "collections", ["user_id", "name"],
                    unique=True, postgresql_where=sa.text("active IS TRUE"))


def downgrade() -> None:
    op.drop_table("collections")
```

- Uniques on user data include `user_id` and ignore soft-deleted rows (`WHERE active IS TRUE`)
- Indexes on user-owned tables start with `user_id`
- Match the model exactly (types, nullability, defaults); `alembic check` must be clean after

## 3. Safe changes on a live database

| Change | Safe pattern |
|---|---|
| Add required column | add nullable (or constant `server_default`) → backfill → `nullable=False`, ideally in a later migration |
| Index on a large table | `with op.get_context().autocommit_block(): op.create_index(..., postgresql_concurrently=True)` |
| Rename column | add new → write both in code → backfill → read new → drop old in a later release |
| Drop column | stop using it in code (release) → drop in a later migration |
| Enum value | `ALTER TYPE ... ADD VALUE` inside `autocommit_block` |
| New unique | check existing duplicates first and tell the user if there are any |

Backfills use SQL (`op.execute`), never ORM models (models change; old migrations must keep
working). Large backfills in batches by id range.

## 4. Verify locally

```bash
cd backend
alembic upgrade head
alembic downgrade -1
alembic upgrade head
alembic check
```

## 5. Report to the user

In plain terms: tables/columns/indexes created or changed; backfills and rows touched (if known);
locks on large tables; reversibility; the exact command to apply it (they run it on non-local
environments; on existing databases after adoption: `alembic stamp` once, then `upgrade head`).

## Review checklist

- [ ] User-owned table: `user_id` NOT NULL + FK + index; uniques include `user_id` and ignore inactive rows
- [ ] Model and migration match; `alembic check` clean
- [ ] Live-safe: no NOT NULL without backfill; concurrent indexes on large tables
- [ ] Backfills in SQL, batched if large
- [ ] `downgrade()` works (tested locally)
- [ ] One head (`alembic heads`)
