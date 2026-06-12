from datetime import datetime
from typing import List
from app.models.match import Match
from app.repositories.base import BaseRepository

class MatchRepository(BaseRepository[Match]):
    def __init__(self):
        super().__init__(model=Match, collection_name="matches")

    async def get_active_matches(self) -> List[Match]:
        now = datetime.utcnow()
        query = {
            "prediction_open_time": {"$lte": now},
            "prediction_close_time": {"$gte": now},
            "status": {"$ne": "completed"}
        }
        return await self.get_all(filter_query=query, sort_by="match_date")
