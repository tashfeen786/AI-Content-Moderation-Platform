from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# --- Policy Schemas ---
class PolicyUpdate(BaseModel):
    isEnabled: bool = Field(..., description="Enable or disable this category")
    threshold: int = Field(..., ge=0, le=100, description="Confidence threshold (0-100)")
    enforcement: str = Field(..., pattern="^(Auto-Block|Flag-for-Review)$")

class PolicyResponse(BaseModel):
    category: str
    isEnabled: bool
    threshold: int
    enforcement: str
    updatedAt: Optional[datetime] = None

# --- Appeal Schemas ---
class AppealCreate(BaseModel):
    submission_id: str
    justification: str = Field(..., min_length=10)

class AppealReview(BaseModel):
    status: str = Field(..., pattern="^(Accepted|Rejected)$")
    admin_response: Optional[str] = Field(None, max_length=500)

class AppealResponse(BaseModel):
    id: str
    user_id: str
    user_email: str
    submission_id: str
    justification: str
    status: str  # Pending, Accepted, Rejected
    admin_response: Optional[str]
    created_at: datetime
    resolved_at: Optional[datetime]

# --- Analytics Schemas ---
class VerdictDistribution(BaseModel):
    outcome: str
    count: int

class CategoryBreakdownStats(BaseModel):
    category: str
    detected_count: int

class UserRanking(BaseModel):
    user_id: str
    user_email: str
    submission_count: int
    violation_count: int