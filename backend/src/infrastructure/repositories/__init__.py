from src.infrastructure.redis.settings import get_redis_connection
from src.infrastructure.database.settings import get_db_session


async def get_redis_repo():
    async with get_redis_connection() as connection:
        yield connection


async def get_session_repo():
    async with get_db_session() as session:
        yield session
