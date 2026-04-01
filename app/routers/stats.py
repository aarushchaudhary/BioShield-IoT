from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy.sql import text, func

from app.database import get_db
from app.redis_client import get_redis
from app.models.user import User
from app.models.template import Template, TemplateStatus
from app.models.audit_log import AuditLog, AuditAction
from app.schemas.stats import SystemStatsResponse
from app.dependencies.rbac import require_security_officer

router = APIRouter(prefix="/stats", tags=["System Statistics"], dependencies=[Depends(require_security_officer)])

@router.get("/", response_model=SystemStatsResponse)
def get_system_stats(db: Session = Depends(get_db)):
    """Fetch high-level system metrics to power the administrative dashboard."""
    # Check Database Connection
    db_status = "offline"
    try:
        if db.execute(text("SELECT 1")).scalar() == 1:
            db_status = "online"
    except Exception:
        db_status = "offline"

    # Check Redis Connectivity
    redis_status = "offline"
    try:
        r = get_redis()
        if r.ping():
            redis_status = "online"
    except Exception:
        redis_status = "offline"

    # Gathering analytical metrics
    total_users = db.query(User).count()
    
    # Calculate enrollments
    total_enrollments = db.query(AuditLog).filter(
        AuditLog.action == AuditAction.enroll,
        AuditLog.success == True
    ).count()

    active_templates = db.query(Template).filter(Template.status == TemplateStatus.active).count()

    # Calculate average matching score across all logged verification attempts
    avg_score = db.query(func.avg(AuditLog.match_score)).filter(AuditLog.match_score.isnot(None)).scalar()
    
    return SystemStatsResponse(
        redis_status=redis_status,
        db_status=db_status,
        total_users=total_users,
        total_enrollments=total_enrollments,
        active_templates=active_templates,
        average_match_score=float(avg_score) if avg_score else 0.0
    )
