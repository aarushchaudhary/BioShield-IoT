"""
Role-Based Access Control (RBAC) dependencies.

For the Hackathon Demo, these are mocked to pass immediately.
"""

from fastapi import Depends
from app.middleware.auth import get_current_user

def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Mocked for demo."""
    return current_user

def require_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Mocked for demo."""
    return current_user

def require_security_officer(current_user: dict = Depends(get_current_user)) -> dict:
    """Mocked for demo."""
    return current_user
