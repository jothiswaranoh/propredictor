from datetime import datetime
from typing import Optional
from app.models.base import MongoBaseModel

class User(MongoBaseModel):
    name: str
    email: str
    password: str
    role: str = "user"  # "admin" or "user"
    active: bool = True
    avatar: Optional[str] = None
    created_at: datetime
