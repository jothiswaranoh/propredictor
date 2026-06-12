from datetime import datetime
from typing import Optional
from app.models.base import MongoBaseModel, PyObjectId

class UserPrediction(MongoBaseModel):
    user_id: PyObjectId
    match_id: PyObjectId
    winning_team_id: Optional[PyObjectId] = None
    submitted_at: datetime
