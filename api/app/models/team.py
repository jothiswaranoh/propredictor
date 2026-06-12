from datetime import datetime
from app.models.base import MongoBaseModel

class Team(MongoBaseModel):
    name: str
    short_name: str
    logo_url: str
    active: bool = True
    created_at: datetime
