import logging
from datetime import datetime
from typing import List
from app.database import db_helper
from app.schemas.leaderboard import LeaderboardEntry, LeaderboardResponse
from app.repositories.user import UserRepository

logger = logging.getLogger(__name__)

class LeaderboardService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def get_current_leaderboard(self) -> LeaderboardResponse:
        db = db_helper.db
        
        # Try fetching from cache collection `leaderboard_cache` first
        cursor = db.leaderboard_cache.find().sort("rank", 1)
        cache_entries = await cursor.to_list(length=1000)
        
        if cache_entries:
            entries = [
                LeaderboardEntry(
                    user_id=str(entry["user_id"]),
                    name=entry["name"],
                    email=entry["email"],
                    points=entry["points"],
                    rank=entry["rank"]
                ) for entry in cache_entries
            ]
            return LeaderboardResponse(leaderboard=entries)
            
        # Fallback to dynamic calculation if cache is empty
        return await self.generate_leaderboard()

    async def generate_leaderboard(self) -> LeaderboardResponse:
        db = db_helper.db
        
        # Aggregation pipeline to compute points for all active users
        pipeline = [
            { "$match": { "active": True } },
            {
                "$lookup": {
                    "from": "user_predictions",
                    "localField": "_id",
                    "foreignField": "user_id",
                    "as": "predictions"
                }
            },
            { "$unwind": { "path": "$predictions", "preserveNullAndEmptyArrays": True } },
            {
                "$lookup": {
                    "from": "matches",
                    "localField": "predictions.match_id",
                    "foreignField": "_id",
                    "as": "match"
                }
            },
            { "$unwind": { "path": "$match", "preserveNullAndEmptyArrays": True } },
            {
                "$project": {
                    "_id": 1,
                    "name": 1,
                    "email": 1,
                    "is_correct": {
                        "$cond": [
                            {
                                "$and": [
                                    { "$eq": ["$match.status", "completed"] },
                                    { "$eq": ["$predictions.winning_team_id", "$match.winning_team_id"] }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            },
            {
                "$group": {
                    "_id": "$_id",
                    "name": { "$first": "$name" },
                    "email": { "$first": "$email" },
                    "points": { "$sum": "$is_correct" }
                }
            },
            {
                "$sort": {
                    "points": -1,
                    "name": 1
                }
            }
        ]
        
        cursor = db.users.aggregate(pipeline)
        results = await cursor.to_list(length=1000)
        
        # Assign ranks
        entries = []
        current_rank = 1
        previous_points = None
        
        for idx, row in enumerate(results):
            points = row["points"]
            # Handle rank tieing logic: if points match previous, share rank. Else, rank is index + 1
            if previous_points is not None and points < previous_points:
                current_rank = idx + 1
            
            entries.append({
                "user_id": str(row["_id"]),
                "name": row["name"],
                "email": row["email"],
                "points": points,
                "rank": current_rank,
                "calculated_at": datetime.utcnow()
            })
            previous_points = points

        # Update cache collection: clear first, then insert
        if entries:
            await db.leaderboard_cache.delete_many({})
            await db.leaderboard_cache.insert_many(entries)
            
        logger.info(f"Leaderboard cache generated with {len(entries)} entries.")
        
        return LeaderboardResponse(
            leaderboard=[
                LeaderboardEntry(
                    user_id=entry["user_id"],
                    name=entry["name"],
                    email=entry["email"],
                    points=entry["points"],
                    rank=entry["rank"]
                ) for entry in entries
            ]
        )
