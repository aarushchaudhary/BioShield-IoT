"""
Auth service — password hashing (bcrypt) and PASETO v4.local token lifecycle.
"""

import json
import uuid
from datetime import datetime, timezone, timedelta

from passlib.context import CryptContext
import pyseto
from pyseto import Key

from app.config import settings

# ── Password hashing ─────────────────────────────────────────────────

_pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    """Return a bcrypt hash of *plain*."""
    return _pwd_ctx.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if *plain* matches *hashed*."""
    return _pwd_ctx.verify(plain, hashed)


# ── PASETO v4.local tokens ───────────────────────────────────────────

def _get_paseto_key() -> Key:
    """Build a pyseto v4 local symmetric key from the config secret."""
    raw = bytes.fromhex(settings.PASETO_SECRET_KEY)
    return Key.new(version=4, purpose="local", key=raw)


def create_access_token(
    user_id: str,
    email: str,
    role: str,
) -> tuple[str, str, datetime]:
    """Create a PASETO v4.local token.

    Returns
    -------
    tuple[str, str, datetime]
        ``(token_string, jti, expiry_datetime)``
    """
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    jti = str(uuid.uuid4())

    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "jti": jti,
        "iat": now.isoformat(),
        "exp": exp.isoformat(),
    }

    key = _get_paseto_key()
    token = pyseto.encode(key, payload=json.dumps(payload).encode("utf-8"))

    return token.decode("utf-8") if isinstance(token, bytes) else str(token), jti, exp


def verify_access_token(token: str) -> dict:
    """Decrypt and validate a PASETO v4.local token.

    Returns the claims dict.  Raises ``pyseto.DecryptError`` or
    ``ValueError`` on failure.
    """
    key = _get_paseto_key()
    decoded = pyseto.decode(key, token)

    payload = json.loads(decoded.payload)

    # Check expiry
    exp = datetime.fromisoformat(payload["exp"])
    if datetime.now(timezone.utc) > exp:
        raise ValueError("Token has expired")

    return payload
