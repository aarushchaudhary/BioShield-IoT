"""
Auth middleware — FastAPI dependency for extracting & validating the
Bearer token from the Authorization header.

Flow:
  1. Extract ``Bearer <token>`` from the header.
  2. Decrypt and verify the PASETO token.
  3. Check Redis blocklist — if ``blocklist:{jti}`` exists, the token
     has been revoked (logged out).  → 401.
  4. Return the decoded claims dict.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.services.auth import verify_access_token
from app.redis_client import get_redis

_bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> dict:
    """FastAPI dependency — returns the token payload or raises 401."""
    token = credentials.credentials

    # ── Verify token signature & expiry ───────────────────────────────
    try:
        payload = verify_access_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ── Check Redis blocklist ─────────────────────────────────────────
    jti = payload.get("jti")
    if jti:
        r = get_redis()
        if r.exists(f"blocklist:{jti}"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )

    return payload
