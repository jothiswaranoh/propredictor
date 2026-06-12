from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, model_validator
from app.schemas.team import TeamResponse
from app.schemas import ISTDateTime

class MatchBase(BaseModel):
    team1_id: str
    team2_id: str
    match_date: datetime
    prediction_open_time: datetime
    prediction_close_time: datetime
    status: str = Field(default="upcoming", pattern="^(upcoming|live|completed)$")
    winning_team_id: Optional[str] = None

    @model_validator(mode="after")
    def validate_match_times_and_teams(self) -> 'MatchBase':
        if self.team1_id == self.team2_id:
            raise ValueError("team1_id and team2_id must be different")
        if self.prediction_open_time >= self.prediction_close_time:
            raise ValueError("prediction_open_time must be before prediction_close_time")
        if self.prediction_close_time > self.match_date:
            raise ValueError("prediction_close_time must be before or equal to match_date")
        return self

class MatchCreate(MatchBase):
    pass

class MatchUpdate(BaseModel):
    team1_id: Optional[str] = None
    team2_id: Optional[str] = None
    match_date: Optional[datetime] = None
    prediction_open_time: Optional[datetime] = None
    prediction_close_time: Optional[datetime] = None
    status: Optional[str] = Field(None, pattern="^(upcoming|live|completed)$")
    winning_team_id: Optional[str] = None

    @model_validator(mode="after")
    def validate_update(self) -> 'MatchUpdate':
        if self.team1_id is not None and self.team2_id is not None:
            if self.team1_id == self.team2_id:
                raise ValueError("team1_id and team2_id must be different")
        return self

class MatchResponse(BaseModel):
    id: str
    team1_id: str
    team2_id: str
    match_date: ISTDateTime
    prediction_open_time: ISTDateTime
    prediction_close_time: ISTDateTime
    status: str
    winning_team_id: Optional[str] = None
    created_at: ISTDateTime

    model_config = {
        "from_attributes": True
    }

class MatchDetailResponse(BaseModel):
    id: str
    team1_id: str
    team2_id: str
    team1: Optional[TeamResponse] = None
    team2: Optional[TeamResponse] = None
    match_date: ISTDateTime
    prediction_open_time: ISTDateTime
    prediction_close_time: ISTDateTime
    status: str
    winning_team_id: Optional[str] = None
    created_at: ISTDateTime
    user_prediction: Optional[dict] = None  # Embeds user's prediction details if relevant

    model_config = {
        "from_attributes": True
    }

class MatchResultUpdate(BaseModel):
    winning_team_id: Optional[str] = Field(default=None, description="ID of winning team, or null/None if draw")
    status: str = Field(default="completed", pattern="^completed$")
