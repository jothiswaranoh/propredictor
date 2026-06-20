from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas import ISTDateTime

class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    username: str = Field(..., min_length=2, max_length=50)
    password: str = Field(..., min_length=2, max_length=50)
    role: str = Field(default="user", pattern="^(admin|user)$")
    active: bool = True
    avatar: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    username: Optional[str] = Field(None, min_length=2, max_length=50)
    password: Optional[str] = Field(None, min_length=2, max_length=50)
    role: Optional[str] = Field(None, pattern="^(admin|user)$")
    active: Optional[bool] = None
    avatar: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    name: str
    username: str
    password: str
    role: str
    active: bool
    avatar: Optional[str] = None
    created_at: ISTDateTime

    model_config = {
        "from_attributes": True
    }

class UserPaginatedResponse(BaseModel):
    users: List[UserResponse]
    total: int
    page: int
    limit: int
    pages: int

from app.schemas.prediction import PredictionDetailResponse

class UserProfileStats(BaseModel):
    user_id: str
    name: str
    username: str
    avatar: Optional[str] = None
    points: int
    rank: int
    predictions: int
    accuracy: float

class PublicUserProfileResponse(BaseModel):
    profile: UserProfileStats
    prediction_history: List[PredictionDetailResponse]
