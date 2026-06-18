from contextlib import asynccontextmanager
from redis.asyncio import Redis
from src.settings import get_settings


def _create_redis_engine() -> Redis:
    s = get_settings().redis_settings
    return Redis(
        host=s.redis_host,
        port=s.redis_port,
        username=s.redis_user,
        password=s.redis_password,
        socket_timeout=s.redis_socket_timeout,
        max_connections=s.redis_max_conns,
        health_check_interval=s.redis_health_check_interval,
    )


async_engine = _create_redis_engine()


@asynccontextmanager
async def get_redis_connection():
    async with async_engine as connection:
        yield connection
