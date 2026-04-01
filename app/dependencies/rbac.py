"""
Role-Based Access Control (RBAC) dependencies.

Each dependency wraps ``get_current_user`` and verifies the caller's
role.  Returns the token payload on success; raises 403 otherwise.
"""

from fastapi import Depends, HTTPException, status

from app.middleware.auth import get_current_user


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Allow only users with the ``admin`` role."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required",
        )
    return current_user


def require_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Allow only users with the ``user`` role."""
    if current_user.get("role") != "user":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User role required",
        )
    return current_user


def require_security_officer(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Allow only users with the ``security_officer`` role."""
    if current_user.get("role") != "security_officer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Security officer role required",
        )
    return current_user
