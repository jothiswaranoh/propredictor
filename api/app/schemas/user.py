from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.schemas import ISTDateTime

class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    employee_id: str = Field(..., min_length=2, max_length=50)
    role: str = Field(default="user", pattern="^(admin|user)$")
    active: bool = True

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    employee_id: Optional[str] = Field(None, min_length=2, max_length=50)
    role: Optional[str] = Field(None, pattern="^(admin|user)$")
    active: Optional[bool] = None

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    employee_id: str
    role: str
    active: bool
    created_at: ISTDateTime

    model_config = {
        "from_attributes": True
    }
