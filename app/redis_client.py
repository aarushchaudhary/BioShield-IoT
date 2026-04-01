"""
Redis connection pool and helper.
"""

import redis

from app.config import settings

# ── Connection pool ───────────────────────────────────────────────────
_pool = redis.ConnectionPool.from_url(
    settings.REDIS_URL,
    password=settings.REDIS_PASSWORD or None,
    decode_responses=True,
    max_connections=20,
)


def get_redis() -> redis.Redis:
    """Return a Redis client bound to the shared connection pool."""
    return redis.Redis(connection_pool=_pool)
