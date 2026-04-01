from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.audit_log import AuditLog, AuditAction
from app.schemas.audit import AuditListResponse, AuditEventResponse
from app.dependencies.rbac import require_security_officer

router = APIRouter(prefix="/audit", tags=["Audit"], dependencies=[Depends(require_security_officer)])

@router.get("/latest")
def get_latest_audit_logs(limit: int = 5, db: Session = Depends(get_db)):
    """Used by the frontend dashboard to poll for live device activity."""
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": str(log.id),
            "user_id": str(log.user_id),
            "action": log.action.name,
            "success": log.success,
            "match_score": float(log.match_score) if log.match_score else None,
            "timestamp": log.created_at.isoformat()
        } for log in logs
    ]

@router.get("/", response_model=AuditListResponse)
def get_audit_logs(
    action: Optional[AuditAction] = Query(None, description="Filter by action type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Retrieve paginated audit logs, optionally filtered by action."""
    query = db.query(AuditLog)
    
    if action:
        query = query.filter(AuditLog.action == action)
        
    total = query.count()
    items = query.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()
    
    return AuditListResponse(
        total=total,
        items=[AuditEventResponse.model_validate(item) for item in items]
    )
