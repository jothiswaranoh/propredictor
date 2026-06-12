from datetime import datetime
from typing import List, Optional
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
        predictions = await self.prediction_repo.get_all(sort_by="submitted_at", descending=True)
        user_cache = {}
        detailed_preds = []
        for p in predictions:
            match = await self.match_repo.get_by_id(p.match_id)
            if not match:
                continue
            is_correct = None
            if match.status == "completed":
                is_correct = (p.winning_team_id == match.winning_team_id)
            match_detail = await match_service.get_match_detail(match)
            
            uid = str(p.user_id)
            if uid not in user_cache:
                user = await self.user_repo.get_by_id(uid)
                user_cache[uid] = user.name if user else "Unknown User"
            user_name = user_cache[uid]

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

    async def delete_prediction(self, prediction_id: str) -> bool:
        return await self.prediction_repo.delete(prediction_id)
