"""
Key Vault service — AES-256-GCM encryption for biometric secret keys.

Encrypts/decrypts raw key material using the application's AES_MASTER_KEY.
Storage format: base64(nonce[12] ‖ tag[16] ‖ ciphertext).
"""

import base64

from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes

from app.config import settings


def _get_master_key() -> bytes:
    """Derive the 32-byte master key from the hex config value."""
    key = bytes.fromhex(settings.AES_MASTER_KEY)
    if len(key) != 32:
        raise ValueError(
            f"AES_MASTER_KEY must decode to exactly 32 bytes, got {len(key)}"
        )
    return key


def encrypt_key(raw_key: bytes) -> str:
    """Encrypt *raw_key* with AES-256-GCM and return a base64 string.

    Layout: ``base64(nonce[12] + tag[16] + ciphertext[…])``.
    """
    master = _get_master_key()
    nonce = get_random_bytes(12)          # 12 bytes — recommended for GCM
    cipher = AES.new(master, AES.MODE_GCM, nonce=nonce)
    ciphertext, tag = cipher.encrypt_and_digest(raw_key)
    blob = nonce + tag + ciphertext       # 12 + 16 + len(raw_key)
    return base64.b64encode(blob).decode("utf-8")


def decrypt_key(encrypted: str) -> bytes:
    """Reverse :func:`encrypt_key` — decode base64, split, decrypt."""
    blob = base64.b64decode(encrypted)
    nonce = blob[:12]
    tag = blob[12:28]
    ciphertext = blob[28:]

    master = _get_master_key()
    cipher = AES.new(master, AES.MODE_GCM, nonce=nonce)
    return cipher.decrypt_and_verify(ciphertext, tag)
