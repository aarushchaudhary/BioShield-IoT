import logging
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog, AuditAction

logger = logging.getLogger(__name__)

def log_event(
    db: Session,
    user_id,
    action: AuditAction,
    success: bool,
    ip_address: str,
    match_score: float = None,
    error_message: str = None
):
    """
    Creates an AuditLog entry. Never raises exceptions to the caller,
    ensuring that audit logging failures don't break the main flow.
    """
    try:
        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            success=success,
            ip_address=ip_address,
            match_score=match_score,
            error_message=error_message
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to write audit log for action '{action}': {str(e)}")
