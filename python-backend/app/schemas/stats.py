from pydantic import BaseModel
from typing import List, Dict, Any

class SystemStatsResponse(BaseModel):
    redis_status: str
    db_status: str
    total_users: int
    total_enrollments: int
    active_templates: int
    average_match_score: float
    far: float
    frr: float

class DatabaseDumpResponse(BaseModel):
    users_table: List[Dict[str, Any]]
    templates_table: List[Dict[str, Any]]
    key_vault_table: List[Dict[str, Any]]

class VisualizeResponse(BaseModel):
    original_minutiae: List[float]
    template_biohash: str
