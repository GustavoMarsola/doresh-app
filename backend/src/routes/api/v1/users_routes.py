from uuid import UUID
from fastapi import APIRouter, Request, Response, status, Depends
from src.infrastructure.repositories.app_repository import AppRepository
from src.infrastructure.repositories.redis_repository import RedisRepository
from src.schemas.users_schemas import PostRegisterUserSchema, PostAuthenticateUserSchema
from src.application.use_cases.users import UsersUseCase
from src.common.decorators import session_token_required, api_key_required


router = APIRouter(prefix="/user")


@router.post(path="/register", status_code=status.HTTP_201_CREATED)
@api_key_required
async def post_user(
    request: Request,
    data: PostRegisterUserSchema,
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> Response:
    return await UsersUseCase(app_repository, redis_repository).register_user(data)


@router.get(path="/verify-email/{verification_id}", status_code=status.HTTP_200_OK)
async def get_verify_email(
    request: Request,
    verification_id: UUID,
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> Response:
    return await UsersUseCase(app_repository, redis_repository).verify_email(verification_id)


@router.post(path="/authenticate", status_code=status.HTTP_200_OK)
@api_key_required
async def post_authenticate_user(
    request: Request,
    data: PostAuthenticateUserSchema,
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> Response:
    return await UsersUseCase(app_repository, redis_repository).authenticate_user(data)


@router.get(path="/profile", status_code=status.HTTP_200_OK)
async def get_user_profile(
    request: Request,
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> Response:
    return await UsersUseCase(app_repository, redis_repository).user_profile(payload_token)


@router.post(path="/logout", status_code=status.HTTP_200_OK)
async def post_logout_user(
    request: Request,
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> Response:
    return await UsersUseCase(app_repository, redis_repository).logout_user(payload_token)
