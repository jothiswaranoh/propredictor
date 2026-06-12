from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.match import MatchDetailResponse
from app.schemas import ISTDateTime

class PredictionSubmit(BaseModel):
    winning_team_id: Optional[str] = Field(None, description="The ID of the predicted winning team, or None/null for Draw")

class PredictionResponse(BaseModel):
    id: str
    user_id: str
    match_id: str
    winning_team_id: Optional[str] = None
    submitted_at: ISTDateTime

    model_config = {
        "from_attributes": True
    }

class PredictionDetailResponse(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str] = None
    match_id: str
    winning_team_id: Optional[str] = None
    submitted_at: ISTDateTime
    match: Optional[MatchDetailResponse] = None
    is_correct: Optional[bool] = None  # None if match not completed, True/False if completed

    model_config = {
        "from_attributes": True
    }
