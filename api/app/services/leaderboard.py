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

    async def get_current_leaderboard(
        self,
        page: int = 1,
        limit: int = 10,
        search: str = None,
        sort_by: str = "rank",
        sort_order: str = "asc"
    ) -> LeaderboardResponse:
        # Always generate real-time data as requested
        await self.generate_leaderboard()
        
        db = db_helper.db
        query = {}
        if search and search.strip():
            query["name"] = {"$regex": search.strip(), "$options": "i"}
            
        total = await db.leaderboard_cache.count_documents(query)
        import math
        pages = math.ceil(total / limit) if total > 0 else 1
        
        sort_dir = 1 if sort_order == "asc" else -1
        sort_key = sort_by
        if sort_key not in ["rank", "points", "predictions", "accuracy"]:
            sort_key = "rank"
            
        sort_criteria = [(sort_key, sort_dir)]
        if sort_key != "name":
            sort_criteria.append(("name", 1))
            
        cursor = db.leaderboard_cache.find(query).sort(sort_criteria).skip((page - 1) * limit).limit(limit)
        results = await cursor.to_list(length=limit)
        
        return LeaderboardResponse(
            leaderboard=[
                LeaderboardEntry(
                    user_id=row["user_id"],
                    name=row["name"],
                    username=row["username"],
                    points=row["points"],
                    rank=row["rank"],
                    avatar=row.get("avatar"),
                    predictions=row["predictions"],
                    accuracy=row["accuracy"]
                ) for row in results
            ],
            total=total,
            page=page,
            pages=pages
        )

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
                    "username": { "$ifNull": ["$username", "$email"] },
                    "avatar": 1,
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
                    },
                    "has_prediction": {
                        "$cond": [
                            { "$ifNull": ["$predictions._id", False] },
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
                    "username": { "$first": "$username" },
                    "avatar": { "$first": "$avatar" },
                    "points": { "$sum": "$is_correct" },
                    "total_predictions": { "$sum": "$has_prediction" }
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
            total_predictions = row.get("total_predictions", 0)
            accuracy = round((points / total_predictions) * 100, 1) if total_predictions > 0 else 0.0
            
            # Handle rank tieing logic: if points match previous, share rank. Else, rank is index + 1
            if previous_points is not None and points < previous_points:
                current_rank = idx + 1
            
            entries.append({
                "user_id": str(row["_id"]),
                "name": row["name"],
                "username": row.get("username") or row.get("email") or "",
                "avatar": row.get("avatar"),
                "points": points,
                "rank": current_rank,
                "predictions": total_predictions,
                "accuracy": accuracy,
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
                    username=entry["username"],
                    points=entry["points"],
                    rank=entry["rank"],
                    avatar=entry.get("avatar"),
                    predictions=entry["predictions"],
                    accuracy=entry["accuracy"]
                ) for entry in entries
            ],
            total=len(entries),
            page=1,
            pages=1
        )
