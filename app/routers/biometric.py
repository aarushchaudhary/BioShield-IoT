import os
import uuid
import base64
import numpy as np
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from Crypto.Cipher import AES

from app.database import get_db
from app.config import settings
from app.redis_client import get_redis
from app.models.template import Template, TemplateStatus
from app.models.key_vault import KeyVault
from app.models.audit_log import AuditAction
from app.schemas.biometric import EnrollRequest, VerifyRequest, CancelRequest, BiometricResponse, VerifyResponse
from app.dependencies.rbac import require_user
from app.middleware.auth import get_current_user
from app.services.audit import log_event
from app.services.biohash import generate_transformation_matrix, compute_biohash, hamming_distance, is_match

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/biometric", tags=["Biometric"])

def encrypt_key(plain_key: bytes) -> str:
    master_key = bytes.fromhex(settings.AES_MASTER_KEY)
    nonce = os.urandom(12)
    cipher = AES.new(master_key, AES.MODE_GCM, nonce=nonce)
    ciphertext, tag = cipher.encrypt_and_digest(plain_key)
    # GCM tag is 16 bytes, nonce is 12 bytes
    combined = nonce + tag + ciphertext
    return base64.b64encode(combined).decode("utf-8")

def decrypt_key(encrypted_key_b64: str) -> bytes:
    master_key = bytes.fromhex(settings.AES_MASTER_KEY)
    raw = base64.b64decode(encrypted_key_b64)
    nonce = raw[:12]
    tag = raw[12:28]
    ciphertext = raw[28:]
    cipher = AES.new(master_key, AES.MODE_GCM, nonce=nonce)
    return cipher.decrypt_and_verify(ciphertext, tag)



@router.post("/enroll", response_model=BiometricResponse)
def enroll(
    body: EnrollRequest,
    request: Request,
    current_user: dict = Depends(require_user),
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else "unknown"
    target_uid_str = str(body.user_id)
    token_uid_str = current_user.get("user_id")

    if target_uid_str != token_uid_str and current_user.get("role") != "admin":
        log_event(db, token_uid_str, AuditAction.enroll, False, ip, error_message="Enroll mismatch")
        raise HTTPException(status_code=403, detail="Not authorized to enroll for this user")

    try:
        active_t = db.query(Template).filter_by(user_id=body.user_id, status=TemplateStatus.active).first()
        if active_t:
            raise ValueError("User already has an active template. Cancel it first.")

        # Determine next version
        last_t = db.query(Template).filter_by(user_id=body.user_id).order_by(Template.version.desc()).first()
        version = last_t.version + 1 if last_t else 1

        # Cryptography
        key = os.urandom(32)
        encrypted_b64 = encrypt_key(key)
        matrix = generate_transformation_matrix(key, len(body.feature_vector), 512)
        biohash = compute_biohash(body.feature_vector, matrix)

        # Database transaction
        kv = KeyVault(user_id=body.user_id, encrypted_key=encrypted_b64)
        db.add(kv)
        db.flush() # get kv.id

        tmpl = Template(
            user_id=body.user_id,
            biohash=biohash,
            key_reference=kv.id,
            status=TemplateStatus.active,
            version=version
        )
        db.add(tmpl)
        db.commit()

        # Cache original minutiae for dashboard visualization securely for a limited time (1 hour)
        r = get_redis()
        try:
            import json
            r.setex(f"visualize:{body.user_id}", 3600, json.dumps(body.feature_vector))
        except Exception as e:
            logger.warning(f"Failed to cache visualization data: {e}")

        log_event(db, body.user_id, AuditAction.enroll, True, ip)
        return BiometricResponse(
            status="success", 
            message="Biometric template registered successfully",
            biohash=biohash
        )
    except ValueError as e:
        log_event(db, body.user_id, AuditAction.enroll, False, ip, error_message=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Enroll exception: {str(e)}")
        log_event(db, body.user_id, AuditAction.enroll, False, ip, error_message=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/verify", response_model=VerifyResponse)
def verify(
    body: VerifyRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else "unknown"
    target_uid_str = str(body.user_id)
    caller_uid_str = current_user.get("user_id")
    caller_role = current_user.get("role")

    if target_uid_str != caller_uid_str and caller_role not in ["admin", "security_officer"]:
        log_event(db, caller_uid_str, AuditAction.verify, False, ip, error_message="Unauthorized verify target")
        raise HTTPException(status_code=403, detail="Not authorized")

    try:
        t = db.query(Template).filter_by(user_id=body.user_id, status=TemplateStatus.active).first()
        if not t:
            raise ValueError("No active template found")

        kv = db.query(KeyVault).filter_by(id=t.key_reference).first()
        if not kv:
            raise ValueError("Key vault reference missing")

        key = decrypt_key(kv.encrypted_key)
        matrix = generate_transformation_matrix(key, len(body.feature_vector), 512)
        new_hash = compute_biohash(body.feature_vector, matrix)

        _, score = hamming_distance(t.biohash, new_hash)
        match_status = is_match(t.biohash, new_hash, threshold=0.35)

        log_event(db, body.user_id, AuditAction.verify, match_status, ip, match_score=score)

        return VerifyResponse(
            status="success" if match_status else "failure",
            message="Match successful" if match_status else "Match failed",
            match_score=score,
            is_match=match_status
        )
    except ValueError as e:
        log_event(db, body.user_id, AuditAction.verify, False, ip, error_message=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Verify exception: {str(e)}")
        log_event(db, body.user_id, AuditAction.verify, False, ip, error_message=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/cancel", response_model=BiometricResponse)
def cancel(
    body: CancelRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else "unknown"
    target_uid_str = str(body.user_id)
    caller_uid_str = current_user.get("user_id")
    caller_role = current_user.get("role")

    if target_uid_str != caller_uid_str and caller_role != "admin":
        log_event(db, caller_uid_str, AuditAction.cancel, False, ip, error_message="Unauthorized cancel attempt")
        raise HTTPException(status_code=403, detail="Not authorized to cancel this user")

    try:
        t = db.query(Template).filter_by(user_id=body.user_id, status=TemplateStatus.active).first()
        if not t:
            raise ValueError("No active template found to cancel")

        t.status = TemplateStatus.cancelled
        t.cancelled_at = datetime.now(timezone.utc)
        db.commit()

        # Blocklist all Redis sessions for this user
        r = get_redis()
        revoked_count = 0
        for session_key in r.scan_iter("session:*"):
            if r.get(session_key) == target_uid_str:
                jti = session_key.split(":", 1)[1]
                ttl = r.ttl(session_key)
                if ttl and ttl > 0:
                    r.setex(f"blocklist:{jti}", ttl, "revoked_by_cancel")
                r.delete(session_key)
                revoked_count += 1

        log_event(db, body.user_id, AuditAction.cancel, True, ip)
        return BiometricResponse(status="success", message=f"Template cancelled and {revoked_count} user sessions revoked")

    except ValueError as e:
        log_event(db, body.user_id, AuditAction.cancel, False, ip, error_message=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Cancel exception: {str(e)}")
        log_event(db, body.user_id, AuditAction.cancel, False, ip, error_message=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")
