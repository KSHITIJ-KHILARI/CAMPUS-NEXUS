"""Redis client setup for caching and pub/sub messaging.

Provides a lazily-initialised :class:`redis.asyncio.Redis` instance,
pub/sub helpers, and in-memory development fallbacks consumed throughout
the application when Redis is unavailable during local development.
"""

import json
import logging
from typing import Any

import redis.asyncio as redis

from app.core.config import settings

logger = logging.getLogger(__name__)

_redis_client: redis.Redis | None = None
_redis_available: bool | None = None
_memory_cache: dict[str, str] = {}


def get_redis() -> redis.Redis:
    """Return a cached Redis client instance."""
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(
            settings.REDIS_URL,
            max_connections=settings.REDIS_MAX_CONNECTIONS,
            decode_responses=True,
            socket_connect_timeout=0.5,
            socket_timeout=0.5,
            retry_on_timeout=False,
        )
    return _redis_client


async def is_redis_online() -> bool:
    """Check if the Redis service is online and responding."""
    global _redis_available
    if _redis_available is False:
        return False
    try:
        client = get_redis()
        pong = await client.ping()
        _redis_available = bool(pong)
        return _redis_available
    except Exception as exc:
        if _redis_available is not False:
            logger.warning("Redis is currently unavailable (%s). Using development fallback.", exc)
        _redis_available = False
        return False


async def close_redis() -> None:
    """Close the Redis client connection."""
    global _redis_client
    if _redis_client is not None:
        try:
            await _redis_client.close(close_connections=True)
        except Exception:
            pass
        _redis_client = None
        logger.info("Redis client connection closed")


async def cache_get(key: str) -> str | None:
    """Retrieve a value from the cache."""
    if await is_redis_online():
        client = get_redis()
        try:
            return await client.get(key)
        except Exception as exc:
            logger.warning("Redis GET failed for key %s: %s", key, exc)
    return _memory_cache.get(key)


async def cache_set(key: str, value: str, expire: int = 3600) -> bool:
    """Store a value in the cache with an optional expiry."""
    if await is_redis_online():
        client = get_redis()
        try:
            if expire > 0:
                return await client.setex(key, expire, value)
            return await client.set(key, value)
        except Exception as exc:
            logger.warning("Redis SET failed for key %s: %s", key, exc)
    _memory_cache[key] = value
    return True


async def cache_delete(key: str) -> int:
    """Delete a key from the cache."""
    if await is_redis_online():
        client = get_redis()
        try:
            return await client.delete(key)
        except Exception as exc:
            logger.warning("Redis DELETE failed for key %s: %s", key, exc)
    return 1 if _memory_cache.pop(key, None) is not None else 0


async def publish_message(channel: str, message: Any) -> int:
    """Publish a JSON-serialisable message to a pub/sub channel."""
    if await is_redis_online():
        client = get_redis()
        try:
            return await client.publish(channel, json.dumps(message))
        except Exception as exc:
            logger.warning("Redis PUBLISH failed for channel %s: %s", channel, exc)
    return 0


async def subscribe_to_channel(channel: str):
    """Subscribe to a Redis pub/sub channel."""
    client = get_redis()
    pubsub = client.pubsub()
    await pubsub.subscribe(channel)
    return pubsub
