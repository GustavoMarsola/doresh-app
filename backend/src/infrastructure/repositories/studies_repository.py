from uuid import UUID
from fastapi import Depends
from sqlalchemy import select, delete, asc, desc
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
    StudyReferenceSchema,
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

    async def get_studies_by_user_id(self, user_id: UUID, params: GetStudiesSchema) -> list[StudyModel]:
        order_col = getattr(StudyModel, params.sort_by, StudyModel.created_at)
        order_fn  = desc if params.order == "desc" else asc
        offset    = (params.page - 1) * params.per_page

        stmt = (
            select(StudyModel)
            .where(StudyModel.user_id == user_id, StudyModel.active == True)
            .order_by(order_fn(order_col))
            .limit(params.per_page)
            .offset(offset)
        )
        result = await self.db_session.execute(stmt)
        # selectin carrega sections e references automaticamente
        return result.scalars().all()

    async def get_study_by_id(self, study_id: UUID) -> StudyModel | None:
        stmt = select(StudyModel).where(StudyModel.id == study_id)
        result = await self.db_session.execute(stmt)
        return result.scalar_one_or_none()

    async def update_study(self, data: PatchStudySchema) -> None:
        study = await self.get_study_by_id(data.study_id)
        if study:
            if data.title        is not None: study.title        = data.title
            if data.introduction is not None: study.introduction = data.introduction
            if data.conclusion   is not None: study.conclusion   = data.conclusion
            await self.db_session.commit()

        # Atualiza seções por ID
        for section_patch in data.sections:
            stmt = select(StudySectionModel).where(
                StudySectionModel.id == section_patch.id,
                StudySectionModel.study_id == data.study_id,
            )
            result = await self.db_session.execute(stmt)
            section = result.scalar_one_or_none()
            if section:
                if section_patch.title       is not None: section.title       = section_patch.title
                if section_patch.text        is not None: section.text        = section_patch.text
                if section_patch.order_index is not None: section.order_index = section_patch.order_index
        if data.sections:
            await self.db_session.commit()

        # Substitui referências se explicitamente enviadas (inclusive lista vazia)
        if data.references is not None:
            await self.db_session.execute(
                delete(StudyReferenceModel).where(StudyReferenceModel.study_id == data.study_id)
            )
            for ref in data.references:
                self.db_session.add(StudyReferenceModel(
                    study_id=data.study_id,
                    book=ref.book,
                    chapter=ref.chapter,
                    verse_start=ref.verse_start,
                    verse_end=ref.verse_end,
                ))
            await self.db_session.commit()

    async def deactivate_study(self, study_id: UUID) -> StudyModel:
        study = await self.get_study_by_id(study_id)
        if not study:
            raise ValueError("Study not found or already inactive")
        study.active = False
        await self.db_session.commit()
        return study
