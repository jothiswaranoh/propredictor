from pydantic import BaseModel
from typing import List, Optional

class LeaderboardEntry(BaseModel):
    user_id: str
    name: str
    username: str
    points: int
    rank: int
    avatar: Optional[str] = None
    predictions: int = 0
    accuracy: float = 0.0

class LeaderboardResponse(BaseModel):
    leaderboard: List[LeaderboardEntry]
