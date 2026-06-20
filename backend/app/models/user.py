from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserInDB(BaseModel):
    name: str
    email: EmailStr
    hashed_password: str
    role: str = "user"  # default role
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        # MongoDB se aane wale _id ko str mein convert karega
        arbitrary_types_allowed = True