import secrets
from functools import wraps
from jwt import ExpiredSignatureError, InvalidTokenError
from fastapi import Depends, Request, HTTPException, status

from src.common.authentication import decode_token
from src.settings import get_settings
from src.infrastructure.repositories.redis_repository import RedisRepository

SESSION_BLACKLIST_PREFIX = "session_blacklist:"


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


async def session_token_required(
    request: Request,
    redis_repository: RedisRepository = Depends(),
) -> dict:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )
    token = auth_header.split(" ")[1]
    try:
        payload = decode_token(token)
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )

    session_id = payload.get("session_id")
    if session_id and await redis_repository.exists_key(f"{SESSION_BLACKLIST_PREFIX}{session_id}"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been logged out",
        )

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
