from pydantic import BaseModel
from typing import List, Optional

class LeaderboardEntry(BaseModel):
    user_id: str
    name: str
    email: str
    points: int
    rank: int
    avatar: Optional[str] = None

class LeaderboardResponse(BaseModel):
    leaderboard: List[LeaderboardEntry]
