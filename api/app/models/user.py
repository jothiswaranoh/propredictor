from datetime import datetime
from app.models.base import MongoBaseModel

class User(MongoBaseModel):
    name: str
    email: str
    employee_id: str
    role: str = "user"  # "admin" or "user"
    active: bool = True
    created_at: datetime
