from fastapi import APIRouter, Depends, Path
from typing import List, Optional
from app.models.user import User
from app.schemas.user import UserResponse
from app.schemas.match import MatchDetailResponse
from app.schemas.prediction import PredictionSubmit, PredictionResponse, PredictionDetailResponse
from app.schemas.leaderboard import LeaderboardResponse
from app.dependencies import (
    get_current_user,
    get_match_service,
    get_prediction_service,
    get_leaderboard_service,
    get_prediction_repo,
    get_user_repo
)
from pydantic import BaseModel, Field

class PasswordUpdate(BaseModel):
    new_password: str = Field(..., min_length=2, max_length=50)

class ProfileUpdate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    avatar: Optional[str] = None
from app.services.match import MatchService
from app.services.prediction import PredictionService
from app.services.leaderboard import LeaderboardService

router = APIRouter(tags=["User Operations"])

@router.get("/api/users/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """
    Get the authenticated user's profile information.
    """
    return current_user

@router.put("/api/users/me", response_model=UserResponse)
async def update_my_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    user_repo = Depends(get_user_repo)
):
    """
    Update the authenticated user's profile.
    """
    update_data = {"name": profile_data.name}
    if profile_data.avatar is not None:
        update_data["avatar"] = profile_data.avatar

    updated_user = await user_repo.update(str(current_user.id), update_data)
    return updated_user

@router.put("/api/users/me/password", response_model=UserResponse)
async def update_my_password(
    password_data: PasswordUpdate,
    current_user: User = Depends(get_current_user),
    user_repo = Depends(get_user_repo)
):
    """
    Update the authenticated user's password.
    """
    updated_user = await user_repo.update(str(current_user.id), {"password": password_data.new_password})
    return updated_user

@router.get("/api/matches", response_model=List[MatchDetailResponse])
async def list_matches(
    current_user: User = Depends(get_current_user),
    match_service: MatchService = Depends(get_match_service),
    prediction_repo = Depends(get_prediction_repo)
):
    """
    List all matches with team details and embed the user's prediction (if submitted).
    """
    matches = await match_service.get_all_matches_detailed()
    for m in matches:
        pred = await prediction_repo.get_by_user_and_match(current_user.id, m.id)
        if pred:
            m.user_prediction = {
                "id": str(pred.id),
                "winning_team_id": str(pred.winning_team_id) if pred.winning_team_id is not None else None,
                "submitted_at": pred.submitted_at.isoformat()
            }
    return matches

@router.get("/api/matches/active", response_model=List[MatchDetailResponse])
async def list_active_matches(
    current_user: User = Depends(get_current_user),
    match_service: MatchService = Depends(get_match_service),
    prediction_repo = Depends(get_prediction_repo)
):
    """
    List matches whose prediction window is currently active.
    """
    matches = await match_service.get_active_matches_detailed()
    for m in matches:
        pred = await prediction_repo.get_by_user_and_match(current_user.id, m.id)
        if pred:
            m.user_prediction = {
                "id": str(pred.id),
                "winning_team_id": str(pred.winning_team_id) if pred.winning_team_id is not None else None,
                "submitted_at": pred.submitted_at.isoformat()
            }
    return matches

@router.post("/api/predictions/{match_id}", response_model=PredictionResponse)
async def submit_prediction(
    prediction_data: PredictionSubmit,
    match_id: str = Path(..., description="ID of the match to predict"),
    current_user: User = Depends(get_current_user),
    prediction_service: PredictionService = Depends(get_prediction_service)
):
    """
    Submit a prediction for a match. The prediction window must be open.
    Predictions are final and cannot be modified.
    """
    prediction = await prediction_service.submit_prediction(
        user_id=current_user.id,
        match_id=match_id,
        prediction_data=prediction_data
    )
    return prediction

@router.get("/api/predictions/history", response_model=List[PredictionDetailResponse])
async def get_prediction_history(
    current_user: User = Depends(get_current_user),
    prediction_service: PredictionService = Depends(get_prediction_service),
    match_service: MatchService = Depends(get_match_service)
):
    """
    Get current user's prediction history, showing match results and prediction correctness.
    """
    return await prediction_service.get_user_prediction_history(
        user_id=current_user.id,
        match_service=match_service
    )

@router.get("/api/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    current_user: User = Depends(get_current_user),
    leaderboard_service: LeaderboardService = Depends(get_leaderboard_service)
):
    """
    Retrieve the current leaderboard rankings.
    """
    return await leaderboard_service.get_current_leaderboard()
