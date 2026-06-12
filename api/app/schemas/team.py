from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, HttpUrl
from app.schemas import ISTDateTime

class TeamBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    short_name: str = Field(..., min_length=2, max_length=10)
    logo_url: str = Field(..., description="URL to team logo image")
    active: bool = True

class TeamCreate(TeamBase):
    pass

class TeamUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    short_name: Optional[str] = Field(None, min_length=2, max_length=10)
    logo_url: Optional[str] = None
    active: Optional[bool] = None

class TeamResponse(BaseModel):
    id: str
    name: str
    short_name: str
    logo_url: str
    active: bool
    created_at: ISTDateTime

    model_config = {
        "from_attributes": True
    }

class TeamPaginatedResponse(BaseModel):
    teams: List[TeamResponse]
    total: int
    page: int
    limit: int
    pages: int
