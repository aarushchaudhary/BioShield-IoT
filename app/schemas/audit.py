import uuid
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.audit_log import AuditAction

class AuditEventResponse(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID]
    action: AuditAction
    success: bool
    match_score: Optional[float]
    ip_address: str
    error_message: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AuditListResponse(BaseModel):
    items: List[AuditEventResponse]
    total: int
