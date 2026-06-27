from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from app.models.match import Match
from app.repositories.match import MatchRepository
from app.repositories.team import TeamRepository
from app.schemas.match import MatchCreate, MatchUpdate, MatchResultUpdate, MatchDetailResponse
from app.schemas.team import TeamResponse
from app.exceptions import NotFoundException, BadRequestException

class MatchService:
    def __init__(self, match_repo: MatchRepository, team_repo: TeamRepository):
        self.match_repo = match_repo
        self.team_repo = team_repo

    async def get_match_by_id(self, match_id: str) -> Match:
        match = await self.match_repo.get_by_id(match_id)
        if not match:
            raise NotFoundException("Match not found")
        return match

    async def get_match_detail(self, match: Match, user_prediction: Optional[dict] = None, teams_map: Optional[dict] = None) -> MatchDetailResponse:
        if teams_map is not None:
            team1 = teams_map.get(str(match.team1_id))
            team2 = teams_map.get(str(match.team2_id))
        else:
            team1 = await self.team_repo.get_by_id(match.team1_id)
            team2 = await self.team_repo.get_by_id(match.team2_id)
        
        team1_resp = TeamResponse.model_validate(team1) if team1 else None
        team2_resp = TeamResponse.model_validate(team2) if team2 else None
        
        return MatchDetailResponse(
            id=str(match.id),
            team1_id=str(match.team1_id),
            team2_id=str(match.team2_id),
            team1=team1_resp,
            team2=team2_resp,
            match_date=match.match_date,
            prediction_open_time=match.prediction_open_time,
            prediction_close_time=match.prediction_close_time,
            status=match.status,
            winning_team_id=str(match.winning_team_id) if match.winning_team_id else None,
            created_at=match.created_at,
            user_prediction=user_prediction
        )

    async def get_all_matches_detailed(self) -> List[MatchDetailResponse]:
        matches = await self.match_repo.get_all(sort_by="match_date")
        
        team_ids = set()
        for m in matches:
            team_ids.add(str(m.team1_id))
            team_ids.add(str(m.team2_id))
            
        teams_map = {}
        if team_ids:
            team_obj_ids = [self.team_repo._to_object_id(tid) for tid in team_ids]
            teams = await self.team_repo.get_all(filter_query={"_id": {"$in": team_obj_ids}})
            teams_map = {str(t.id): t for t in teams}
            
        detailed_matches = []
        for m in matches:
            detailed = await self.get_match_detail(m, teams_map=teams_map)
            detailed_matches.append(detailed)
        return detailed_matches

    async def get_active_matches_detailed(self) -> List[MatchDetailResponse]:
        matches = await self.match_repo.get_active_matches()
        
        team_ids = set()
        for m in matches:
            team_ids.add(str(m.team1_id))
            team_ids.add(str(m.team2_id))
            
        teams_map = {}
        if team_ids:
            team_obj_ids = [self.team_repo._to_object_id(tid) for tid in team_ids]
            teams = await self.team_repo.get_all(filter_query={"_id": {"$in": team_obj_ids}})
            teams_map = {str(t.id): t for t in teams}
            
        detailed_matches = []
        for m in matches:
            detailed = await self.get_match_detail(m, teams_map=teams_map)
            detailed_matches.append(detailed)
        return detailed_matches

    async def create_match(self, match_data: MatchCreate) -> Match:
        team1 = await self.team_repo.get_by_id(match_data.team1_id)
        team2 = await self.team_repo.get_by_id(match_data.team2_id)
        
        if not team1 or not team1.active:
            raise BadRequestException("Team 1 is invalid or inactive")
        if not team2 or not team2.active:
            raise BadRequestException("Team 2 is invalid or inactive")
            
        match_dict = match_data.model_dump()
        match_dict["created_at"] = datetime.utcnow()
        match_dict["team1_id"] = self.team_repo._to_object_id(match_data.team1_id)
        match_dict["team2_id"] = self.team_repo._to_object_id(match_data.team2_id)
        if match_data.winning_team_id:
            match_dict["winning_team_id"] = self.team_repo._to_object_id(match_data.winning_team_id)
        else:
            match_dict["winning_team_id"] = None
            
        return await self.match_repo.create(match_dict)

    async def update_match(self, match_id: str, match_data: MatchUpdate) -> Match:
        match = await self.get_match_by_id(match_id)
        update_dict = match_data.model_dump(exclude_unset=True)
        
        t1_id = update_dict.get("team1_id") or str(match.team1_id)
        t2_id = update_dict.get("team2_id") or str(match.team2_id)
        
        if t1_id == t2_id:
            raise BadRequestException("team1_id and team2_id must be different")
            
        if "team1_id" in update_dict:
            team1 = await self.team_repo.get_by_id(update_dict["team1_id"])
            if not team1 or not team1.active:
                raise BadRequestException("Team 1 is invalid or inactive")
            update_dict["team1_id"] = self.team_repo._to_object_id(update_dict["team1_id"])

        if "team2_id" in update_dict:
            team2 = await self.team_repo.get_by_id(update_dict["team2_id"])
            if not team2 or not team2.active:
                raise BadRequestException("Team 2 is invalid or inactive")
            update_dict["team2_id"] = self.team_repo._to_object_id(update_dict["team2_id"])

        if "winning_team_id" in update_dict:
            if update_dict["winning_team_id"]:
                w_id = update_dict["winning_team_id"]
                if w_id != t1_id and w_id != t2_id:
                    raise BadRequestException("winning_team_id must be one of the match teams")
                update_dict["winning_team_id"] = self.team_repo._to_object_id(w_id)
            else:
                update_dict["winning_team_id"] = None

        return await self.match_repo.update(match_id, update_dict)

    async def delete_match(self, match_id: str) -> bool:
        await self.get_match_by_id(match_id)
        return await self.match_repo.delete(match_id)

    async def declare_match_result(self, match_id: str, result_data: MatchResultUpdate) -> Match:
        match = await self.get_match_by_id(match_id)
        
        w_id = result_data.winning_team_id
        t1_id = str(match.team1_id)
        t2_id = str(match.team2_id)
        
        if w_id:
            if w_id != t1_id and w_id != t2_id:
                raise BadRequestException("Winning team must be team1 or team2")
            winning_obj_id = self.team_repo._to_object_id(w_id)
        else:
            winning_obj_id = None
            
        update_dict = {
            "status": "completed",
            "winning_team_id": winning_obj_id
        }
        
        return await self.match_repo.update(match_id, update_dict)

    async def get_paginated_matches_detailed(
        self,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        team_id: Optional[str] = None,
        date: Optional[str] = None,
        user_side: bool = False
    ) -> dict:
        search_filter = None
        if search:
            matched_teams = await self.team_repo.get_all(filter_query={
                "name": {"$regex": search, "$options": "i"}
            })
            team_ids = [t.id for t in matched_teams]
            
            if team_ids:
                team_obj_ids = [self.team_repo._to_object_id(tid) for tid in team_ids]
                search_filter = {
                    "$or": [
                        {"team1_id": {"$in": team_obj_ids}},
                        {"team2_id": {"$in": team_obj_ids}}
                    ]
                }
            else:
                search_filter = {"_id": ObjectId()}
                
        status_filter = None
        if status and status != "all":
            if user_side:
                now = datetime.utcnow()
                if status == "live":
                    status_filter = {
                        "prediction_open_time": {"$lte": now},
                        "prediction_close_time": {"$gte": now},
                        "status": {"$ne": "completed"}
                    }
                elif status == "upcoming":
                    status_filter = {
                        "status": "upcoming",
                        "$or": [
                            {"prediction_open_time": {"$gt": now}},
                            {"prediction_close_time": {"$lt": now}}
                        ]
                    }
                elif status == "completed":
                    status_filter = {"status": "completed"}
            else:
                status_filter = {"status": status}

        team_filter = None
        if team_id and team_id != "all":
            team_filter = {
                "$or": [
                    {"team1_id": self.match_repo._to_object_id(team_id)},
                    {"team2_id": self.match_repo._to_object_id(team_id)}
                ]
            }

        date_filter = None
        if date:
            try:
                from datetime import timedelta
                parsed_date = datetime.strptime(date, "%Y-%m-%d")
                utc_start = parsed_date - timedelta(hours=5, minutes=30)
                utc_end = utc_start + timedelta(days=1) - timedelta(microseconds=1)
                date_filter = {"match_date": {"$gte": utc_start, "$lte": utc_end}}
            except Exception:
                date_filter = None
            
        filter_query = {}
        conditions = []
        if search_filter:
            conditions.append(search_filter)
        if status_filter:
            conditions.append(status_filter)
        if team_filter:
            conditions.append(team_filter)
        if date_filter:
            conditions.append(date_filter)
            
        if conditions:
            if len(conditions) == 1:
                filter_query = conditions[0]
            else:
                filter_query = {"$and": conditions}
                
        matches, total = await self.match_repo.get_paginated(
            filter_query=filter_query,
            sort_by="match_date",
            descending=True,
            page=page,
            limit=limit
        )
        
        # Batch query teams to prevent N+1 queries
        team_ids = set()
        for m in matches:
            team_ids.add(str(m.team1_id))
            team_ids.add(str(m.team2_id))
            
        teams_map = {}
        if team_ids:
            team_obj_ids = [self.team_repo._to_object_id(tid) for tid in team_ids]
            teams = await self.team_repo.get_all(filter_query={"_id": {"$in": team_obj_ids}})
            teams_map = {str(t.id): t for t in teams}
            
        detailed_matches = []
        for m in matches:
            detailed = await self.get_match_detail(m, teams_map=teams_map)
            detailed_matches.append(detailed)
            
        pages = (total + limit - 1) // limit if limit > 0 else 0
        
        tab_counts = None
        if user_side:
            now = datetime.utcnow()
            completed_count = await self.match_repo.collection.count_documents({"status": "completed"})
            live_count = await self.match_repo.collection.count_documents({
                "prediction_open_time": {"$lte": now},
                "prediction_close_time": {"$gte": now},
                "status": {"$ne": "completed"}
            })
            upcoming_count = await self.match_repo.collection.count_documents({
                "status": "upcoming",
                "$or": [
                    {"prediction_open_time": {"$gt": now}},
                    {"prediction_close_time": {"$lt": now}}
                ]
            })
            all_count = await self.match_repo.collection.count_documents({})
            tab_counts = {
                "all": all_count,
                "live": live_count,
                "upcoming": upcoming_count,
                "completed": completed_count
            }
            
        return {
            "matches": detailed_matches,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": pages,
            "tab_counts": tab_counts
        }
