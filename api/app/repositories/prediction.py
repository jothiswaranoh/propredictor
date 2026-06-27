from typing import Optional, List
from bson import ObjectId
from app.models.prediction import UserPrediction
from app.repositories.base import BaseRepository

class PredictionRepository(BaseRepository[UserPrediction]):
    def __init__(self):
        super().__init__(model=UserPrediction, collection_name="user_predictions")

    async def get_by_user_and_match(self, user_id: str, match_id: str) -> Optional[UserPrediction]:
        u_id = self._to_object_id(user_id)
        m_id = self._to_object_id(match_id)
        doc = await self.collection.find_one({"user_id": u_id, "match_id": m_id})
        return self.model(**doc) if doc else None

    async def get_by_user(self, user_id: str) -> List[UserPrediction]:
        u_id = self._to_object_id(user_id)
        return await self.get_all(filter_query={"user_id": u_id}, sort_by="submitted_at", descending=True)

    async def get_by_user_and_matches(self, user_id: str, match_ids: List[str]) -> List[UserPrediction]:
        u_id = self._to_object_id(user_id)
        m_ids = [self._to_object_id(mid) for mid in match_ids]
        return await self.get_all(filter_query={"user_id": u_id, "match_id": {"$in": m_ids}})
