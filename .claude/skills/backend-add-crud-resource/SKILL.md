---
name: backend-add-crud-resource
description: |
  Add a new resource end-to-end to the Doresh API (model → migration path → repository →
  AppRepository attribute → schemas → use case → route → router registration → README API
  table → QA hand-off), with per-user ownership on every query. Use when asked to create a new
  entity or CRUD endpoint set, e.g. reading plans, notes, folders/collections of studies,
  bookmarks, Ruach conversations.
---

# Add a CRUD Resource

End-to-end recipe for a user-owned resource. The rules in `.claude/agents/dev-backend.md` win
over this template; if they conflict, follow the agent and tell the user this skill needs updating.

Running example: **Collection** (a user's folder of studies; table `collections`, context
`studies`). Replace `Collection`/`collection`/`collections` with the real names.

---

## 0. Gather before writing

Ask (AskUserQuestion) only what you can't infer:

| Question | Why it matters |
|---|---|
| Data kind: **user-owned**, **global** (read-only, like Bible text) or **identity**? | Decides the owner filter. Default for user content is user-owned |
| Fields, types, required/optional, enums, max lengths | Schemas + model |
| Unique per user? (e.g. collection name) | `UniqueConstraint("user_id", "name")` / partial index on active rows |
| Children / references (`study_id`, `session_id`) | Must be loaded through owner-scoped methods |
| On delete: soft delete only? cascade to children? block while it has children? | Use-case rule |
| Is the content religious/personal (sensitive)? | Almost always yes → never logged, never in events |
| Which context file (`users`, `bible`, `studies`, `ai`, new)? | Where model/schemas/use case/routes live |

Then **read the closest analog** (`studies_models.py`, `studies_schemas.py`,
`studies_repository.py`, `use_cases/studies.py`, `studies_routes.py`) and match its shape —
applying the ownership rules even where the analog doesn't (it has a known gap on update/delete).

---

## 1. Model — `src/infrastructure/database/models/<context>_models.py`

```python
import uuid
from sqlalchemy import ForeignKey, Index, String, text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from src.infrastructure.database.models.entity_model import EntityModel


class CollectionModel(EntityModel):
    __tablename__ = "collections"
    __table_args__ = (
        Index("uq_collections_user_name", "user_id", "name", unique=True,
              postgresql_where=text("active IS TRUE")),
    )

    user_id:     Mapped[uuid.UUID]  = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    name:        Mapped[str]        = mapped_column(String(120))
    description: Mapped[str | None] = mapped_column(nullable=True)
    active:      Mapped[bool]       = mapped_column(default=True)
```

- Re-export from `models/__init__.py` so `create_all`/Alembic sees it
- Never a global `unique=True` on user data: uniqueness is `(user_id, ...)`, ignoring soft-deleted rows
- Child tables (e.g. `collection_studies`) reference the parent with an FK and inherit ownership
  through it; queries on children always join or check the parent's `user_id`
- Match the file's column alignment style

## 2. Migration path

Follow **`backend-write-migration`**. While Alembic isn't adopted, a brand-new table is created by
`create_all` on startup, but tell the user that any later change to it will need a migration.

## 3. Schemas — `src/schemas/<context>_schemas.py`

```python
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class CollectionCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name:        str        = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=2000)


class CollectionUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name:        str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=2000)


class CollectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:          UUID
    name:        str
    description: str | None
    created_at:  datetime
    updated_at:  datetime


class CollectionPage(BaseModel):
    items:    list[CollectionResponse]
    total:    int
    page:     int
    per_page: int
```

- No `user_id` in any of them (`extra="ignore"` drops a forged one)
- `Update` is used with `model_dump(exclude_unset=True)` so "omitted" ≠ "set to null"
- Pagination follows the existing `page`/`per_page` convention; `total` is a real `COUNT`

## 4. Repository — `src/infrastructure/repositories/<context>_repository.py`

```python
from uuid import UUID
from fastapi import Depends
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from src.exceptions import ConflictError
from src.infrastructure.repositories import get_session_repo
from src.infrastructure.database.models.studies_models import CollectionModel


class CollectionsRepository:
    def __init__(self, db_session: AsyncSession = Depends(get_session_repo)) -> None:
        self.db_session = db_session

    def _owned(self, user_id: UUID):
        return select(CollectionModel).where(
            CollectionModel.user_id == user_id,
            CollectionModel.active.is_(True),
        )

    async def get_owned(self, user_id: UUID, collection_id: UUID) -> CollectionModel | None:
        result = await self.db_session.execute(self._owned(user_id).where(CollectionModel.id == collection_id))
        return result.scalar_one_or_none()

    async def list_owned(self, user_id: UUID, page: int, per_page: int) -> tuple[list[CollectionModel], int]:
        base  = self._owned(user_id)
        total = await self.db_session.scalar(select(func.count()).select_from(base.subquery()))
        result = await self.db_session.execute(
            base.order_by(CollectionModel.created_at.desc()).limit(per_page).offset((page - 1) * per_page)
        )
        return list(result.scalars()), total or 0

    async def create(self, user_id: UUID, data: dict) -> CollectionModel:
        data.pop("user_id", None)
        collection = CollectionModel(**data, user_id=user_id)
        self.db_session.add(collection)
        await self._commit_or_conflict()
        await self.db_session.refresh(collection)
        return collection

    async def update(self, collection: CollectionModel, data: dict) -> CollectionModel:
        data.pop("user_id", None)
        for field, value in data.items():
            setattr(collection, field, value)
        await self._commit_or_conflict()
        await self.db_session.refresh(collection)
        return collection

    async def soft_delete(self, collection: CollectionModel) -> None:
        collection.active = False
        await self.db_session.commit()

    async def _commit_or_conflict(self) -> None:
        try:
            await self.db_session.commit()
        except IntegrityError as exc:
            await self.db_session.rollback()
            raise ConflictError(constraint=getattr(exc.orig, "constraint_name", None)) from exc
```

- `update`/`soft_delete` receive an instance **already loaded through `get_owned`**, so they can
  never touch another user's row. A bulk `update()`/`delete()` statement must include
  `.where(Model.user_id == user_id)`
- If `ConflictError` doesn't exist in `src/exceptions.py`, add it as a plain `Exception` subclass carrying `constraint`
- Aggregates (a study with sections and references) are written by **one** method with one commit

Register it on `AppRepository` (`app_repository.py`):

```python
self.collections = CollectionsRepository(db_session)
```

## 5. Use case — `src/application/use_cases/<context>.py`

```python
from uuid import UUID
from fastapi import HTTPException, status
from src.exceptions import ConflictError


class CollectionsUseCase:
    def __init__(self, repository: AppRepository, redis_repository: RedisRepository) -> None:
        self.repository       = repository
        self.redis_repository = redis_repository

    async def list_collections(self, payload_token: dict, page: int, per_page: int) -> CollectionPage:
        user_id = UUID(payload_token["sub"])
        items, total = await self.repository.collections.list_owned(user_id, page, per_page)
        return CollectionPage(items=[CollectionResponse.model_validate(i) for i in items],
                              total=total, page=page, per_page=per_page)

    async def create_collection(self, payload_token: dict, data: CollectionCreate) -> CollectionResponse:
        user_id = UUID(payload_token["sub"])
        try:
            collection = await self.repository.collections.create(user_id, data.model_dump())
        except ConflictError:
            raise HTTPException(status.HTTP_409_CONFLICT, detail="collection.duplicate_name")
        return CollectionResponse.model_validate(collection)

    async def update_collection(self, payload_token: dict, collection_id: UUID, data: CollectionUpdate) -> CollectionResponse:
        collection = await self._get_owned_or_404(payload_token, collection_id)
        try:
            collection = await self.repository.collections.update(collection, data.model_dump(exclude_unset=True))
        except ConflictError:
            raise HTTPException(status.HTTP_409_CONFLICT, detail="collection.duplicate_name")
        return CollectionResponse.model_validate(collection)

    async def delete_collection(self, payload_token: dict, collection_id: UUID) -> None:
        collection = await self._get_owned_or_404(payload_token, collection_id)
        await self.repository.collections.soft_delete(collection)

    async def _get_owned_or_404(self, payload_token: dict, collection_id: UUID):
        collection = await self.repository.collections.get_owned(UUID(payload_token["sub"]), collection_id)
        if not collection:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="collection.not_found")
        return collection
```

- Every referenced id (`study_id` added to a collection) is loaded with the **caller's** `user_id`
  before the write; not found → 404
- Never log names/descriptions/text — ids only

## 6. Route — `src/routes/api/v1/<context>_routes.py`

```python
@router.get(path="/collections", response_model=CollectionPage)
async def get_collections(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
):
    return await CollectionsUseCase(app_repository, redis_repository).list_collections(payload_token, page, per_page)


@router.post(path="/collections", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
async def post_collection(data: CollectionCreate, payload_token: dict = Depends(session_token_required),
                          app_repository: AppRepository = Depends(), redis_repository: RedisRepository = Depends()):
    return await CollectionsUseCase(app_repository, redis_repository).create_collection(payload_token, data)


@router.patch(path="/collections/{collection_id}", response_model=CollectionResponse)
...

@router.delete(path="/collections/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
...
```

- New router module → register in `src/routes/api/v1/__init__.py` with a tag
- The id of the record being changed goes in the **path** (new routes). Don't copy the old
  `PATCH /study` with `study_id` in the body
- No `user_id` path/query params on user routes

## 7. Verify

```bash
cd backend && python -c "import src.app"
cd backend && python -c "from src.app import create_app; app = create_app(); print([r.path for r in app.routes if 'collection' in r.path])"
```

Don't write tests. Update the README API table. Hand off to `dev-qa`.

## 8. Hand-off to dev-qa

```
New user-owned resource: Collection (table `collections`, model CollectionModel, routes /api/v1/collections).
Unique per user (active rows): name → 409 collection.duplicate_name.
References: study_id (must belong to the caller → 404 otherwise).
Soft delete via active=false.
Please deliver tests/integration/ownership/test_collections_ownership.py (user B vs user A on every
route + the study_id reference) and integration tests for the business rules once: happy paths,
409, 404, pagination total, soft delete.
```

## Definition of Done

- [ ] Model: `EntityModel`, plural table, `user_id` FK + index, `active`, per-user unique, re-exported
- [ ] Migration path handled (`backend-write-migration`)
- [ ] Repository: every query filtered by `user_id` (+ `active`), `create` sets `user_id` from the use case, soft delete, real `total`
- [ ] Attribute on `AppRepository`
- [ ] Schemas Create/Update/Response(+Page); no `user_id`; `extra="ignore"`
- [ ] Use case: owner from token, 404 for not-owned, references validated, stable error codes
- [ ] Route: `session_token_required`, `response_model`, id in path, registered
- [ ] No personal content in logs; Redis keys (if any) `u:{user_id}:`
- [ ] README API table updated; hand-off to `dev-qa` sent
