from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from app.models.prediction import UserPrediction
from app.repositories.prediction import PredictionRepository
from app.repositories.match import MatchRepository
from app.repositories.team import TeamRepository
from app.repositories.user import UserRepository
from app.schemas.prediction import PredictionSubmit, PredictionDetailResponse
from app.exceptions import NotFoundException, BadRequestException, ConflictException

class PredictionService:
    def __init__(self, prediction_repo: PredictionRepository, match_repo: MatchRepository, team_repo: TeamRepository, user_repo: UserRepository):
        self.prediction_repo = prediction_repo
        self.match_repo = match_repo
        self.team_repo = team_repo
        self.user_repo = user_repo

    async def submit_prediction(self, user_id: str, match_id: str, prediction_data: PredictionSubmit) -> UserPrediction:
        now = datetime.utcnow()
        
        match = await self.match_repo.get_by_id(match_id)
        if not match:
            raise NotFoundException("Match not found")
            
        if now < match.prediction_open_time:
            raise BadRequestException("Prediction window is not open yet")
        if now > match.prediction_close_time:
            raise BadRequestException("Prediction window is closed")
            
        w_team_id = prediction_data.winning_team_id
        if w_team_id is not None:
            t1_str = str(match.team1_id)
            t2_str = str(match.team2_id)
            if w_team_id != t1_str and w_team_id != t2_str:
                raise BadRequestException("Predicted winning team must be one of the teams playing in this match")
            
        existing = await self.prediction_repo.get_by_user_and_match(user_id, match_id)
        if existing:
            update_data = {
                "winning_team_id": self.prediction_repo._to_object_id(w_team_id) if w_team_id is not None else None,
                "submitted_at": now
            }
            return await self.prediction_repo.update(str(existing.id), update_data)

        pred_dict = {
            "user_id": self.prediction_repo._to_object_id(user_id),
            "match_id": self.prediction_repo._to_object_id(match_id),
            "winning_team_id": self.prediction_repo._to_object_id(w_team_id) if w_team_id is not None else None,
            "submitted_at": now
        }
        return await self.prediction_repo.create(pred_dict)

    async def get_user_prediction_history(self, user_id: str, match_service) -> List[PredictionDetailResponse]:
        predictions = await self.prediction_repo.get_by_user(user_id)
        user = await self.user_repo.get_by_id(user_id)
        user_name = user.name if user else "Unknown User"
        detailed_preds = []
        for p in predictions:
            match = await self.match_repo.get_by_id(p.match_id)
            if not match:
                continue
                
            is_correct = None
            if match.status == "completed":
                is_correct = (p.winning_team_id == match.winning_team_id)
                
            match_detail = await match_service.get_match_detail(match)
            
            detailed_preds.append(
                PredictionDetailResponse(
                    id=str(p.id),
                    user_id=str(p.user_id),
                    user_name=user_name,
                    match_id=str(p.match_id),
                    winning_team_id=str(p.winning_team_id) if p.winning_team_id is not None else None,
                    submitted_at=p.submitted_at,
                    match=match_detail,
                    is_correct=is_correct
                )
            )
        return detailed_preds

    async def get_all_predictions_detailed(self, match_service) -> List[PredictionDetailResponse]:
        import asyncio
        predictions = await self.prediction_repo.get_all(sort_by="submitted_at", descending=True)
        if not predictions:
            return []
            
        unique_match_ids = list({p.match_id for p in predictions})
        unique_user_ids = list({p.user_id for p in predictions})
        
        matches_list, users_list = await asyncio.gather(
            self.match_repo.get_all(filter_query={"_id": {"$in": [self.prediction_repo._to_object_id(mid) for mid in unique_match_ids]}}),
            self.user_repo.get_all(filter_query={"_id": {"$in": [self.prediction_repo._to_object_id(uid) for uid in unique_user_ids]}})
        )
        
        match_map = {str(m.id): m for m in matches_list}
        user_map = {str(u.id): u.name for u in users_list}
        
        async def build_detail(p):
            match = match_map.get(str(p.match_id))
            if not match:
                return None
            is_correct = None
            if match.status == "completed":
                is_correct = (p.winning_team_id == match.winning_team_id)
            match_detail = await match_service.get_match_detail(match)
            user_name = user_map.get(str(p.user_id), "Unknown User")
            return PredictionDetailResponse(
                id=str(p.id),
                user_id=str(p.user_id),
                user_name=user_name,
                match_id=str(p.match_id),
                winning_team_id=str(p.winning_team_id) if p.winning_team_id is not None else None,
                submitted_at=p.submitted_at,
                match=match_detail,
                is_correct=is_correct
            )
            
        details = await asyncio.gather(*(build_detail(p) for p in predictions))
        return [d for d in details if d is not None]

    async def get_paginated_predictions_detailed(
        self,
        match_service,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None
    ) -> dict:
        search_filter = None
        if search:
            # Match users
            matched_users = await self.user_repo.get_all(filter_query={
                "$or": [
                    {"name": {"$regex": search, "$options": "i"}},
                    {"username": {"$regex": search, "$options": "i"}}
                ]
            })
            user_ids = [self.prediction_repo._to_object_id(u.id) for u in matched_users]
            
            # Match teams
            matched_teams = await self.team_repo.get_all(filter_query={
                "name": {"$regex": search, "$options": "i"}
            })
            team_ids = [t.id for t in matched_teams]
            
            # Match matches involving matched teams
            match_ids = []
            if team_ids:
                matched_matches = await self.match_repo.get_all(filter_query={
                    "$or": [
                        {"team1_id": {"$in": [self.prediction_repo._to_object_id(tid) for tid in team_ids]}},
                        {"team2_id": {"$in": [self.prediction_repo._to_object_id(tid) for tid in team_ids]}}
                    ]
                })
                match_ids = [self.prediction_repo._to_object_id(m.id) for m in matched_matches]
            
            search_conditions = []
            if user_ids:
                search_conditions.append({"user_id": {"$in": user_ids}})
            if match_ids:
                search_conditions.append({"match_id": {"$in": match_ids}})
                
            if search_conditions:
                search_filter = {"$or": search_conditions}
            else:
                search_filter = {"_id": ObjectId()}

        status_filter = None
        if status and status != "all":
            if status == "pending":
                pending_matches = await self.match_repo.get_all(filter_query={"status": {"$ne": "completed"}})
                pending_match_ids = [self.prediction_repo._to_object_id(m.id) for m in pending_matches]
                status_filter = {"match_id": {"$in": pending_match_ids}}
            elif status == "correct":
                completed_matches = await self.match_repo.get_all(filter_query={"status": "completed"})
                correct_conditions = []
                for m in completed_matches:
                    correct_conditions.append({
                        "match_id": self.prediction_repo._to_object_id(m.id),
                        "winning_team_id": self.prediction_repo._to_object_id(m.winning_team_id) if m.winning_team_id is not None else None
                    })
                if correct_conditions:
                    status_filter = {"$or": correct_conditions}
                else:
                    status_filter = {"_id": ObjectId()}
            elif status == "incorrect":
                completed_matches = await self.match_repo.get_all(filter_query={"status": "completed"})
                incorrect_conditions = []
                for m in completed_matches:
                    incorrect_conditions.append({
                        "match_id": self.prediction_repo._to_object_id(m.id),
                        "winning_team_id": {"$ne": self.prediction_repo._to_object_id(m.winning_team_id) if m.winning_team_id is not None else None}
                    })
                if incorrect_conditions:
                    status_filter = {"$or": incorrect_conditions}
                else:
                    status_filter = {"_id": ObjectId()}

        filter_query = {}
        conditions = []
        if search_filter:
            conditions.append(search_filter)
        if status_filter:
            conditions.append(status_filter)
            
        if conditions:
            if len(conditions) == 1:
                filter_query = conditions[0]
            else:
                filter_query = {"$and": conditions}

        predictions, total = await self.prediction_repo.get_paginated(
            filter_query=filter_query,
            sort_by="submitted_at",
            descending=True,
            page=page,
            limit=limit
        )

        import asyncio
        if not predictions:
            return {
                "predictions": [],
                "total": total,
                "page": page,
                "limit": limit,
                "pages": 0
            }
            
        unique_match_ids = list({p.match_id for p in predictions})
        unique_user_ids = list({p.user_id for p in predictions})
        
        matches_list, users_list = await asyncio.gather(
            self.match_repo.get_all(filter_query={"_id": {"$in": [self.prediction_repo._to_object_id(mid) for mid in unique_match_ids]}}),
            self.user_repo.get_all(filter_query={"_id": {"$in": [self.prediction_repo._to_object_id(uid) for uid in unique_user_ids]}})
        )
        
        match_map = {str(m.id): m for m in matches_list}
        user_map = {str(u.id): u.name for u in users_list}
        
        async def build_detail(p):
            match = match_map.get(str(p.match_id))
            if not match:
                return None
            is_correct = None
            if match.status == "completed":
                is_correct = (p.winning_team_id == match.winning_team_id)
            match_detail = await match_service.get_match_detail(match)
            user_name = user_map.get(str(p.user_id), "Unknown User")
            return PredictionDetailResponse(
                id=str(p.id),
                user_id=str(p.user_id),
                user_name=user_name,
                match_id=str(p.match_id),
                winning_team_id=str(p.winning_team_id) if p.winning_team_id is not None else None,
                submitted_at=p.submitted_at,
                match=match_detail,
                is_correct=is_correct
            )
            
        details = await asyncio.gather(*(build_detail(p) for p in predictions))
        detailed_preds = [d for d in details if d is not None]
        
        pages = (total + limit - 1) // limit if limit > 0 else 0
        
        return {
            "predictions": detailed_preds,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": pages
        }

    async def get_dashboard_stats(self, match_service) -> dict:
        import asyncio
        total_users_task = self.user_repo.collection.count_documents({})
        total_teams_task = self.team_repo.collection.count_documents({})
        active_matches_task = self.match_repo.collection.count_documents({"status": {"$ne": "completed"}})
        total_predictions_task = self.prediction_repo.collection.count_documents({})
        recent_preds_task = self.get_paginated_predictions_detailed(
            match_service=match_service,
            page=1,
            limit=5
        )
        
        total_users, total_teams, active_matches, total_predictions, recent_preds_dict = await asyncio.gather(
            total_users_task,
            total_teams_task,
            active_matches_task,
            total_predictions_task,
            recent_preds_task
        )
        
        return {
            "total_users": total_users,
            "total_teams": total_teams,
            "active_matches": active_matches,
            "total_predictions": total_predictions,
            "recent_predictions": recent_preds_dict["predictions"]
        }

    async def delete_prediction(self, prediction_id: str) -> bool:
        return await self.prediction_repo.delete(prediction_id)
