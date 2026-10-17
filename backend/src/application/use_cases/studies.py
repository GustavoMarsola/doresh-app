import json
import logging
from datetime import datetime, timezone
from math import ceil
from uuid import UUID
from fastapi import Response, status
from src.infrastructure.repositories.app_repository import AppRepository
from src.infrastructure.repositories.redis_repository import RedisRepository
from src.infrastructure.database.models.studies_models import StudyModel
from src.schemas.studies_schemas import PostCreateStudySchema, GetStudiesSchema, PatchStudySchema
from src.common.utilities import serialize
from src.exceptions import NotFoundException

_logger = logging.getLogger(__name__)

def _not_found() -> Response:
    return Response(
        content=json.dumps({"message": "Study not found", "code": "study_not_found"}),
        status_code=status.HTTP_404_NOT_FOUND,
    )


def _user_id(payload_token: dict) -> UUID:
    return UUID(payload_token["sub"])


def _utc(value: datetime) -> datetime:
    # O banco grava timestamp sem fuso, em UTC: explicita o fuso para o cliente converter certo
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def study_to_dict(study: StudyModel) -> dict:
    """Formato público de um estudo (sem user_id nem campos internos)."""
    return serialize({
        "id":           study.id,
        "title":        study.title,
        "introduction": study.introduction,
        "conclusion":   study.conclusion,
        "ai_generated": study.ai_generated,
        "created_at":   _utc(study.created_at),
        "updated_at":   _utc(study.updated_at),
        "sections": [
            {"id": s.id, "title": s.title, "text": s.text, "order_index": s.order_index}
            for s in sorted(study.sections, key=lambda s: s.order_index)
        ],
        "references": [
            {"book": r.book, "chapter": r.chapter, "verse_start": r.verse_start, "verse_end": r.verse_end}
            for r in study.references
        ],
    })


class StudiesUseCase:
    def __init__(self, repository: AppRepository, redis_repository: RedisRepository) -> None:
        self.repository       = repository
        self.redis_repository = redis_repository

    async def create_study(self, payload_token: dict, data: PostCreateStudySchema) -> Response:
        user_id = _user_id(payload_token)
        study   = await self.repository.studies.register_study(user_id, data)
        response_data = {"message": "Study created successfully", "study": study_to_dict(study)}
        return Response(content=json.dumps(response_data), status_code=status.HTTP_201_CREATED)

    async def get_user_studies(self, payload_token: dict, params: GetStudiesSchema) -> Response:
        user_id        = _user_id(payload_token)
        studies, total = await self.repository.studies.get_studies_by_user_id(user_id, params)
        response_data = {
            "message":  "Studies retrieved successfully",
            "page":     params.page,
            "per_page": params.per_page,
            "total":    total,
            "pages":    ceil(total / params.per_page) if total else 0,
            "studies":  [study_to_dict(s) for s in studies],
        }
        return Response(content=json.dumps(response_data), status_code=status.HTTP_200_OK)

    async def get_user_study(self, payload_token: dict, study_id: UUID) -> Response:
        study = await self.repository.studies.get_user_study(_user_id(payload_token), study_id)
        if not study:
            return _not_found()
        response_data = {"message": "Study retrieved successfully", "study": study_to_dict(study)}
        return Response(content=json.dumps(response_data), status_code=status.HTTP_200_OK)

    async def update_study(self, payload_token: dict, data: PatchStudySchema) -> Response:
        study = await self.repository.studies.update_study(_user_id(payload_token), data)
        if not study:
            return _not_found()
        response_data = {"message": "Study updated successfully", "study": study_to_dict(study)}
        return Response(content=json.dumps(response_data), status_code=status.HTTP_200_OK)

    async def delete_study(self, payload_token: dict, study_id: UUID) -> Response:
        deleted = await self.repository.studies.deactivate_study(_user_id(payload_token), study_id)
        if not deleted:
            return _not_found()
        return Response(
            content=json.dumps({"message": "Study deleted successfully"}),
            status_code=status.HTTP_200_OK,
        )
