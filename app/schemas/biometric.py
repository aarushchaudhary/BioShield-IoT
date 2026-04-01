from pydantic import BaseModel, Field
from typing import List
import uuid

class EnrollRequest(BaseModel):
    user_id: uuid.UUID
    feature_vector: List[float] = Field(..., min_length=1, description="Raw biometric feature vector")

class VerifyRequest(BaseModel):
    user_id: uuid.UUID
    feature_vector: List[float] = Field(..., min_length=1, description="Raw biometric feature vector to verify")

class CancelRequest(BaseModel):
    user_id: uuid.UUID = Field(..., description="User ID whose biometric templates should be cancelled")

class BiometricResponse(BaseModel):
    message: str
    status: str

class VerifyResponse(BiometricResponse):
    match_score: float = Field(..., description="Hamming distance score of the match")
    is_match: bool = Field(..., description="Whether the verification was successful")
