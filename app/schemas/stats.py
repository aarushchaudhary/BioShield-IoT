from pydantic import BaseModel

class SystemStatsResponse(BaseModel):
    redis_status: str
    db_status: str
    total_users: int
    total_enrollments: int
    active_templates: int
    average_match_score: float
