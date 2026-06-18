import json
import logging
from uuid import UUID
from fastapi import Response, status
from src.infrastructure.repositories.app_repository import AppRepository
from src.infrastructure.repositories.redis_repository import RedisRepository
from src.schemas.studies_schemas import PostCreateStudySchema, GetStudiesSchema, PatchStudySchema
from src.common.utilities import serialize

_logger = logging.getLogger(__name__)


class StudiesUseCase:
    def __init__(self, repository: AppRepository, redis_repository: RedisRepository) -> None:
        self.repository       = repository
        self.redis_repository = redis_repository

    async def create_study(self, payload_token: dict, data: PostCreateStudySchema) -> Response:
        user_id = payload_token.get("sub")
        study   = await self.repository.studies.register_study(user_id, data)
        response_data = serialize({
            "message": "Study created successfully",
            "study":   study,
        })
        return Response(content=json.dumps(response_data), status_code=status.HTTP_201_CREATED)

    async def get_user_studies(self, payload_token: dict, params: GetStudiesSchema) -> Response:
        user_id = payload_token.get("sub")
        studies = await self.repository.studies.get_studies_by_user_id(user_id, params)
        response_data = serialize({
            "message":  "Studies retrieved successfully",
            "user_id":  user_id,
            "page":     params.page,
            "per_page": params.per_page,
            "total":    len(studies),
            "studies":  studies,
        })
        return Response(content=json.dumps(response_data), status_code=status.HTTP_200_OK)

    async def update_study(self, payload_token: dict, data: PatchStudySchema) -> Response:
        await self.repository.studies.update_study(data)
        return Response(
            content=json.dumps({"message": "Study updated successfully"}),
            status_code=status.HTTP_200_OK,
        )

    async def delete_study(self, payload_token: dict, study_id: UUID) -> Response:
        await self.repository.studies.deactivate_study(study_id)
        return Response(
            content=json.dumps({"message": "Study deleted successfully"}),
            status_code=status.HTTP_200_OK,
        )
