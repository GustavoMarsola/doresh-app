from uuid import UUID
from fastapi import APIRouter, Request, Response, status, Depends
from src.infrastructure.repositories.app_repository import AppRepository
from src.infrastructure.repositories.redis_repository import RedisRepository
from src.schemas.studies_schemas import PostCreateStudySchema, GetStudiesSchema, PatchStudySchema
from src.application.use_cases.studies import StudiesUseCase
from src.common.decorators import session_token_required


router = APIRouter()


@router.post(path="/study", status_code=status.HTTP_201_CREATED)
async def post_study(
    request: Request,
    data: PostCreateStudySchema,
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> Response:
    return await StudiesUseCase(app_repository, redis_repository).create_study(payload_token, data)


@router.get(path="/studies", status_code=status.HTTP_200_OK)
async def get_studies(
    request: Request,
    params: GetStudiesSchema = Depends(),
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> Response:
    return await StudiesUseCase(app_repository, redis_repository).get_user_studies(payload_token, params)


@router.patch(path="/study", status_code=status.HTTP_200_OK)
async def patch_study(
    request: Request,
    data: PatchStudySchema,
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> Response:
    return await StudiesUseCase(app_repository, redis_repository).update_study(payload_token, data)


@router.delete(path="/study/{study_id}", status_code=status.HTTP_200_OK)
async def delete_study(
    request: Request,
    study_id: UUID,
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> Response:
    return await StudiesUseCase(app_repository, redis_repository).delete_study(payload_token, study_id)
