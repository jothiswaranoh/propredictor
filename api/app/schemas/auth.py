from pydantic import BaseModel, Field
from typing import Optional

class LoginRequest(BaseModel):
    username: str = Field(..., description="Username")
    password: str = Field(..., description="Unique Password")

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: str
    username: str
    role: str
