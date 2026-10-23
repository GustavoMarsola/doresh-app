from uuid import UUID
from fastapi import Depends
from sqlalchemy import select, delete, asc, desc, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from src.infrastructure.repositories import get_session_repo
from src.infrastructure.database.models.studies_models import (
    StudyModel,
    StudySectionModel,
    StudyReferenceModel,
)
from src.schemas.studies_schemas import (
    PostCreateStudySchema,
    GetStudiesSchema,
    PatchStudySchema,
)


class StudiesRepository:
    def __init__(self, db_session: AsyncSession = Depends(get_session_repo)) -> None:
        self.db_session = db_session

    async def register_study(self, user_id: UUID, data: PostCreateStudySchema) -> StudyModel:
        study_data = data.model_dump(exclude={"sections", "references"})
        study_data["user_id"] = user_id

        new_study = StudyModel(**study_data)
        self.db_session.add(new_study)
        await self.db_session.flush()  # gera o ID antes de inserir filhos

        for i, section in enumerate(data.sections):
            self.db_session.add(StudySectionModel(
                study_id=new_study.id,
                title=section.title,
                text=section.text,
                order_index=section.order_index if section.order_index is not None else i,
            ))

        for ref in data.references:
            self.db_session.add(StudyReferenceModel(
                study_id=new_study.id,
                book=ref.book,
                chapter=ref.chapter,
                verse_start=ref.verse_start,
                verse_end=ref.verse_end,
            ))

        await self.db_session.commit()

        # Re-query para carregar os relacionamentos via selectin
        stmt = select(StudyModel).where(StudyModel.id == new_study.id)
        result = await self.db_session.execute(stmt)
        return result.scalar_one()

    async def get_studies_by_user_id(self, user_id: UUID, params: GetStudiesSchema) -> tuple[list[StudyModel], int]:
        order_col = getattr(StudyModel, params.sort_by)
        order_fn  = desc if params.order == "desc" else asc
        offset    = (params.page - 1) * params.per_page

        filters = [StudyModel.user_id == user_id, StudyModel.active == True]
        if params.q and params.q.strip():
            term = f"%{params.q.strip()}%"
            filters.append(or_(StudyModel.title.ilike(term), StudyModel.introduction.ilike(term)))

        total = await self.db_session.scalar(select(func.count()).select_from(StudyModel).where(*filters))

        stmt = (
            select(StudyModel)
            .where(*filters)
            .order_by(order_fn(order_col), desc(StudyModel.id))
            .limit(params.per_page)
            .offset(offset)
        )
        result = await self.db_session.execute(stmt)
        # selectin carrega sections e references automaticamente
        return list(result.scalars().all()), total or 0

    async def get_user_study(self, user_id: UUID, study_id: UUID) -> StudyModel | None:
        """Estudo ativo do usuário; None se não existir ou for de outra pessoa."""
        stmt = (
            select(StudyModel)
            .where(StudyModel.id == study_id, StudyModel.user_id == user_id, StudyModel.active == True)
            .execution_options(populate_existing=True)
        )
        result = await self.db_session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_active_study(self, study_id: UUID) -> StudyModel | None:
        """Estudo ativo de qualquer pessoa: só para leitura onde o dono o partilhou (ex.: nota de grupo)."""
        stmt = (
            select(StudyModel)
            .where(StudyModel.id == study_id, StudyModel.active == True)
            .execution_options(populate_existing=True)
        )
        result = await self.db_session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_active_titles(self, study_ids: list[UUID]) -> dict[UUID, str]:
        if not study_ids:
            return {}
        stmt = select(StudyModel.id, StudyModel.title).where(StudyModel.id.in_(study_ids), StudyModel.active == True)
        result = await self.db_session.execute(stmt)
        return {study_id: title for study_id, title in result.all()}

    async def update_study(self, user_id: UUID, data: PatchStudySchema) -> StudyModel | None:
        study = await self.get_user_study(user_id, data.study_id)
        if not study:
            return None

        if data.title        is not None: study.title        = data.title
        if data.introduction is not None: study.introduction = data.introduction
        if data.conclusion   is not None: study.conclusion   = data.conclusion
        study.updated_at = func.now()

        # Seções: substitui todas, na ordem enviada (a ordem é única por estudo)
        if data.sections is not None:
            await self.db_session.execute(delete(StudySectionModel).where(StudySectionModel.study_id == study.id))
            await self.db_session.flush()
            for i, section in enumerate(data.sections):
                self.db_session.add(StudySectionModel(
                    study_id=study.id,
                    title=section.title,
                    text=section.text,
                    order_index=i,
                ))

        # Referências: substitui se enviadas (inclusive lista vazia)
        if data.references is not None:
            await self.db_session.execute(delete(StudyReferenceModel).where(StudyReferenceModel.study_id == study.id))
            for ref in data.references:
                self.db_session.add(StudyReferenceModel(
                    study_id=study.id,
                    book=ref.book,
                    chapter=ref.chapter,
                    verse_start=ref.verse_start,
                    verse_end=ref.verse_end,
                ))

        await self.db_session.commit()
        return await self.get_user_study(user_id, data.study_id)

    async def deactivate_study(self, user_id: UUID, study_id: UUID) -> bool:
        study = await self.get_user_study(user_id, study_id)
        if not study:
            return False
        study.active = False
        await self.db_session.commit()
        return True
