from pydantic import BaseModel
from typing import List

class LeaderboardEntry(BaseModel):
    user_id: str
    name: str
    email: str
    points: int
    rank: int

class LeaderboardResponse(BaseModel):
    leaderboard: List[LeaderboardEntry]
