"""
Auth router — ``/auth`` prefix.

POST /auth/login   — public, returns PASETO token
POST /auth/logout  — authenticated, revokes token via Redis blocklist
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.audit_log import AuditLog, AuditAction
from app.models.template import Template, TemplateStatus
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserResponse
from app.services.auth import verify_password, create_access_token
from app.middleware.auth import get_current_user
from app.redis_client import get_redis
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── POST /auth/login ──────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
def login(
    body: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Authenticate with email + password, receive a PASETO token."""
    ip = request.client.host if request.client else "unknown"

    # Look up the user
    user = db.query(User).filter(User.email == body.email).first()

    if not user or not verify_password(body.password, user.hashed_password):
        # Log failed attempt
        db.add(AuditLog(
            user_id=user.id if user else None,
            action=AuditAction.login,
            success=False,
            ip_address=ip,
            error_message="Invalid credentials",
        ))
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not user.is_active:
        db.add(AuditLog(
            user_id=user.id,
            action=AuditAction.login,
            success=False,
            ip_address=ip,
            error_message="Account is deactivated",
        ))
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    # Create token
    token, jti, exp = create_access_token(
        user_id=str(user.id),
        email=user.email,
        role=user.role.value,
    )

    # Store session in Redis with TTL
    ttl_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    r = get_redis()
    r.setex(f"session:{jti}", ttl_seconds, str(user.id))

    # Audit log — success
    db.add(AuditLog(
        user_id=user.id,
        action=AuditAction.login,
        success=True,
        ip_address=ip,
    ))
    db.commit()

    return TokenResponse(
        access_token=token,
        expires_in=ttl_seconds,
        user_id=str(user.id)
    )


# ── GET /auth/me ─────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return the currently authenticated user's profile."""
    user_id = current_user.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
        
    active_t = db.query(Template).filter(
        Template.user_id == user.id, 
        Template.status == TemplateStatus.active
    ).first()
    
    user_data = UserResponse.model_validate(user)
    user_data.has_active_template = bool(active_t)
    return user_data


# ── POST /auth/logout ────────────────────────────────────────────────

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Revoke the current token by adding its JTI to the Redis blocklist."""
    ip = request.client.host if request.client else "unknown"
    jti = current_user["jti"]

    r = get_redis()

    # Calculate remaining TTL from the session key
    remaining_ttl = r.ttl(f"session:{jti}")
    if remaining_ttl and remaining_ttl > 0:
        # Blocklist the JTI for the remaining session lifetime
        r.setex(f"blocklist:{jti}", remaining_ttl, "revoked")

    # Remove the session
    r.delete(f"session:{jti}")

    # Audit log
    db.add(AuditLog(
        user_id=current_user.get("user_id"),
        action=AuditAction.logout,
        success=True,
        ip_address=ip,
    ))
    db.commit()

    return None
