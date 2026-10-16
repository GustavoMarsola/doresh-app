import secrets
from uuid import UUID
from functools import wraps
from jwt import ExpiredSignatureError, InvalidTokenError
from fastapi import Depends, Request, HTTPException, status

from src.common.authentication import decode_token, ACCESS_TOKEN_TYPE
from src.infrastructure.repositories.app_repository import AppRepository
from src.infrastructure.repositories.redis_repository import RedisRepository
from src.application.use_cases.sessions import SessionsUseCase
from src.settings import get_settings


def api_key_required(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        request: Request = kwargs.get("request")
        if request is None:
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break

        if request is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Request object not found",
            )

        api_key = request.headers.get("x-api-key")
        expected_key = get_settings().app_settings.x_api_key
        if not api_key or not secrets.compare_digest(api_key, expected_key):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or invalid X-API-Key",
            )

        return await func(*args, **kwargs)

    return wrapper


def _unauthorized(code: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=code,
        headers={"WWW-Authenticate": "Bearer"},
    )


def _parse_uuid(value) -> UUID | None:
    try:
        return UUID(str(value))
    except (TypeError, ValueError):
        return None


async def session_token_required(
    request: Request,
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> dict:
    """
    Validate the Bearer access token and that its login session is still active.
    Returns the token payload; `sub` is the authenticated user id.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise _unauthorized("auth.missing_token")
    token = auth_header.split(" ", 1)[1]
    try:
        payload = decode_token(token)
    except ExpiredSignatureError:
        raise _unauthorized("auth.token_expired")
    except InvalidTokenError:
        raise _unauthorized("auth.invalid_token")

    if payload.get("type") != ACCESS_TOKEN_TYPE:
        raise _unauthorized("auth.invalid_token")

    user_id    = _parse_uuid(payload.get("sub"))
    session_id = _parse_uuid(payload.get("session_id"))
    if user_id is None or session_id is None:
        raise _unauthorized("auth.invalid_token")

    sessions = SessionsUseCase(app_repository, redis_repository)
    if not await sessions.is_session_active(user_id, session_id):
        raise _unauthorized("auth.session_revoked")

    return payload


def rate_limiter(action: str, max_attempts: int, window_seconds: int):
    """FastAPI dependency factory: limits attempts per client IP for a given action (e.g. login, register)."""

    async def _dependency(
        request: Request,
        redis_repository: RedisRepository = Depends(),
    ) -> None:
        client_ip = request.client.host if request.client else "unknown"
        key = f"rate_limit:{action}:{client_ip}"
        attempts = await redis_repository.increment_with_ttl(key, window_seconds)
        if attempts > max_attempts:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many attempts. Try again later.",
            )

    return _dependency
