from redis.asyncio import Redis
from fastapi import Depends
from src.infrastructure.repositories import get_redis_repo


class RedisRepository:
    def __init__(self, connection: Redis = Depends(get_redis_repo)) -> None:
        self._conn = connection

    async def get_key(self, key: str):
        value = await self._conn.get(key)
        return value.decode("utf-8") if value else None

    async def insert_key(self, key: str, value):
        return await self._conn.set(key, value)

    async def insert_key_ttl(self, key: str, value, time_in_seconds: int):
        return await self._conn.set(name=key, ex=time_in_seconds, value=value)

    async def exists_key(self, key: str):
        exists = await self._conn.exists(key)
        return bool(exists) if exists else None

    async def insert_hash(self, key: str, field: str, value):
        return await self._conn.hset(key, field, value)

    async def get_hash(self, key: str, field: str):
        value = await self._conn.hget(key, field)
        return value.decode("utf-8") if value else None

    async def delete_hash(self, key: str, field: str):
        return await self._conn.hdel(key, field)

    async def insert_hash_ttl(self, key: str, field: str, value, time_in_seconds: int):
        await self._conn.hset(key, field, value)
        await self._conn.expire(key, time_in_seconds)

    async def setex_refresh_token(self, key: str, value: str, time_in_seconds: int):
        return await self._conn.setex(key, time_in_seconds, value)

    async def delete_key(self, key: str):
        return await self._conn.delete(key)
