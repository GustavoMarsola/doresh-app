from uuid import UUID
from typing import Literal
from fastapi import APIRouter, Request, Response, status, Depends
from src.infrastructure.repositories.app_repository import AppRepository
from src.infrastructure.repositories.redis_repository import RedisRepository
from src.schemas.users_schemas import (
    PostRegisterUserSchema,
    PostAuthenticateUserSchema,
    RefreshTokenRequest,
    RefreshTokenResponse,
    PostForgotPasswordSchema,
    PostResetPasswordSchema,
    DeleteAccountSchema,
)
from src.application.use_cases.users import UsersUseCase
from src.common.decorators import session_token_required, api_key_required, rate_limiter


router = APIRouter(prefix="/user")


@router.post(
    path="/register",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limiter("register", max_attempts=5, window_seconds=60))],
)
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


@router.post(
    path="/authenticate",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(rate_limiter("authenticate", max_attempts=10, window_seconds=60))],
)
@api_key_required
async def post_authenticate_user(
    request: Request,
    data: PostAuthenticateUserSchema,
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> Response:
    return await UsersUseCase(app_repository, redis_repository).authenticate_user(data)


@router.post(
    path="/refresh",
    status_code=status.HTTP_200_OK,
    response_model=RefreshTokenResponse,
    responses={status.HTTP_401_UNAUTHORIZED: {"description": "auth.invalid_refresh_token"}},
)
@api_key_required
async def post_refresh_session(
    request: Request,
    data: RefreshTokenRequest,
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> RefreshTokenResponse:
    return await UsersUseCase(app_repository, redis_repository).refresh_session(data)


@router.post(
    path="/password/forgot",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(rate_limiter("password_forgot", max_attempts=5, window_seconds=60))],
)
@api_key_required
async def post_forgot_password(
    request: Request,
    data: PostForgotPasswordSchema,
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> Response:
    return await UsersUseCase(app_repository, redis_repository).request_password_reset(data)


@router.post(
    path="/password/reset",
    status_code=status.HTTP_200_OK,
    responses={status.HTTP_400_BAD_REQUEST: {"description": "auth.invalid_reset_token"}},
    dependencies=[Depends(rate_limiter("password_reset", max_attempts=10, window_seconds=60))],
)
@api_key_required
async def post_reset_password(
    request: Request,
    data: PostResetPasswordSchema,
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> Response:
    return await UsersUseCase(app_repository, redis_repository).reset_password(data)


@router.delete(
    path="/account",
    status_code=status.HTTP_200_OK,
    responses={status.HTTP_403_FORBIDDEN: {"description": "account.invalid_password"}},
    dependencies=[Depends(rate_limiter("delete_account", max_attempts=5, window_seconds=60))],
)
async def delete_account(
    request: Request,
    data: DeleteAccountSchema,
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> Response:
    return await UsersUseCase(app_repository, redis_repository).delete_account(payload_token, data)


@router.get(path="/profile", status_code=status.HTTP_200_OK)
async def get_user_profile(
    request: Request,
    version: Literal["nvi", "ara"] = "nvi",
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> Response:
    return await UsersUseCase(app_repository, redis_repository).user_profile(payload_token, version)


@router.post(path="/logout", status_code=status.HTTP_200_OK)
async def post_logout_user(
    request: Request,
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> Response:
    return await UsersUseCase(app_repository, redis_repository).logout_user(payload_token)
