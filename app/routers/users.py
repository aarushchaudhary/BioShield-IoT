from typing import List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.template import Template, TemplateStatus
from app.schemas.user import UserResponse, UserCreate, UserDeactivate
from app.dependencies.rbac import require_admin
from app.services.auth import hash_password

router = APIRouter(prefix="/users", tags=["Users"], dependencies=[Depends(require_admin)])

@router.get("/", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    """List all users along with a flag indicating if they have an active biometric template."""
    users = db.query(User).all()
    results = []
    
    for u in users:
        # Check for active template
        active_t = db.query(Template).filter(Template.user_id == u.id, Template.status == TemplateStatus.active).first()
        
        user_data = UserResponse.model_validate(u)
        user_data.has_active_template = bool(active_t)
        results.append(user_data)
        
    return results

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(body: UserCreate, db: Session = Depends(get_db)):
    """Create a new user."""
    # Check if email is available
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_pwd = hash_password(body.password)
    
    new_user = User(
        email=body.email,
        hashed_password=hashed_pwd,
        role=body.role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Newly created user has no active template
    resp = UserResponse.model_validate(new_user)
    resp.has_active_template = False
    return resp

@router.patch("/{user_id}/deactivate", response_model=UserResponse)
def deactivate_user(user_id: uuid.UUID, db: Session = Depends(get_db)):
    """Soft-delete a user by marking them inactive."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_active = False
    db.commit()
    db.refresh(user)
    
    resp = UserResponse.model_validate(user)
    
    # Determine active template status recursively for correctness
    active_t = db.query(Template).filter(Template.user_id == user.id, Template.status == TemplateStatus.active).first()
    resp.has_active_template = bool(active_t)
    
    return resp
