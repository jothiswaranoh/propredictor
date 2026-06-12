from datetime import datetime
from typing import Optional
from app.models.base import MongoBaseModel, PyObjectId

class Match(MongoBaseModel):
    team1_id: PyObjectId
    team2_id: PyObjectId
    match_date: datetime
    prediction_open_time: datetime
    prediction_close_time: datetime
    status: str = "upcoming"  # upcoming, live, completed
    winning_team_id: Optional[PyObjectId] = None
    created_at: datetime
