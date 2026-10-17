import logging
from uuid import UUID
from redis.exceptions import RedisError
from src.infrastructure.repositories.app_repository import AppRepository
from src.infrastructure.repositories.redis_repository import RedisRepository
from src.settings import get_settings

_logger = logging.getLogger(__name__)

SESSION_ACTIVE  = "active"
SESSION_REVOKED = "revoked"


def session_cache_key(user_id: UUID, session_id: UUID) -> str:
    return f"u:{user_id}:auth:session:{session_id}"


class SessionsUseCase:
    """
    Answers "is this login session still active?" for every authenticated request.

    The answer is cached in Redis for a short TTL. Revocation writes a "revoked" marker that
    outlives any access token, and positive answers are written with NX so they never
    overwrite it. If Redis is unavailable the check falls back to PostgreSQL.
    """

    def __init__(self, repository: AppRepository, redis_repository: RedisRepository) -> None:
        self.repository       = repository
        self.redis_repository = redis_repository
        auth_settings         = get_settings().auth_settings
        self.active_ttl       = auth_settings.session_cache_ttl_seconds
        self.revoked_ttl      = auth_settings.access_token_expire_minutes * 60

    async def is_session_active(self, user_id: UUID, session_id: UUID) -> bool:
        key = session_cache_key(user_id, session_id)

        cached = await self._safe_get(key)
        if cached == SESSION_REVOKED:
            return False
        if cached == SESSION_ACTIVE:
            return True

        session = await self.repository.users.get_active_session(user_id, session_id)
        if session is None:
            return False

        try:
            await self.redis_repository.insert_key_ttl_if_absent(key, SESSION_ACTIVE, self.active_ttl)
        except RedisError:
            _logger.warning("Session cache unavailable on write")
        return True

    async def mark_revoked(self, user_id: UUID, session_id: UUID) -> None:
        try:
            await self.redis_repository.insert_key_ttl(
                session_cache_key(user_id, session_id), SESSION_REVOKED, self.revoked_ttl
            )
        except RedisError:
            _logger.error("Session cache unavailable on revoke; cached state may live for up to %ss", self.active_ttl)

    async def _safe_get(self, key: str) -> str | None:
        try:
            return await self.redis_repository.get_key(key)
        except RedisError:
            _logger.warning("Session cache unavailable on read; falling back to database")
            return None
