from fastapi import APIRouter, Depends, Path, status, Query
from typing import List, Optional
from app.models.user import User
from app.schemas.team import TeamCreate, TeamUpdate, TeamResponse, TeamPaginatedResponse
from app.schemas.match import MatchCreate, MatchUpdate, MatchResponse, MatchDetailResponse, MatchResultUpdate, MatchPaginatedResponse
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserPaginatedResponse
from app.schemas.prediction import PredictionDetailResponse, PredictionPaginatedResponse, AdminDashboardStatsResponse
from app.schemas.leaderboard import LeaderboardResponse
from app.dependencies import (
    require_admin,
    get_team_service,
    get_match_service,
    get_user_service,
    get_prediction_service,
    get_leaderboard_service
)
from app.services.team import TeamService
from app.services.match import MatchService
from app.services.user import UserService
from app.services.prediction import PredictionService
from app.services.leaderboard import LeaderboardService

router = APIRouter(prefix="/api/admin", tags=["Admin Operations"], dependencies=[Depends(require_admin)])

# --- Team CRUD APIs ---

@router.post("/teams", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    team_data: TeamCreate,
    team_service: TeamService = Depends(get_team_service)
):
    """
    Create a new team.
    """
    return await team_service.create_team(team_data)

@router.get("/teams", response_model=TeamPaginatedResponse)
async def list_teams(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    active: Optional[bool] = Query(None),
    team_service: TeamService = Depends(get_team_service)
):
    """
    List all teams with server-side pagination, search, and status filtering.
    """
    return await team_service.get_paginated_teams(
        page=page,
        limit=limit,
        search=search,
        active=active
    )

@router.get("/teams/{team_id}", response_model=TeamResponse)
async def get_team(
    team_id: str = Path(..., description="The team ID"),
    team_service: TeamService = Depends(get_team_service)
):
    """
    Get a specific team by ID.
    """
    return await team_service.get_team_by_id(team_id)

@router.put("/teams/{team_id}", response_model=TeamResponse)
async def update_team(
    team_data: TeamUpdate,
    team_id: str = Path(..., description="The team ID"),
    team_service: TeamService = Depends(get_team_service)
):
    """
    Update details of an existing team.
    """
    return await team_service.update_team(team_id, team_data)

@router.delete("/teams/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(
    team_id: str = Path(..., description="The team ID"),
    team_service: TeamService = Depends(get_team_service)
):
    """
    Delete a team by ID.
    """
    await team_service.delete_team(team_id)
    return None

# --- Match CRUD APIs ---

@router.post("/matches", response_model=MatchResponse, status_code=status.HTTP_201_CREATED)
async def create_match(
    match_data: MatchCreate,
    match_service: MatchService = Depends(get_match_service)
):
    """
    Create a new match schedule.
    """
    return await match_service.create_match(match_data)

@router.get("/matches", response_model=MatchPaginatedResponse)
async def list_matches(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    team_id: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    match_service: MatchService = Depends(get_match_service)
):
    """
    List all matches with team details and pagination.
    """
    return await match_service.get_paginated_matches_detailed(
        page=page,
        limit=limit,
        search=search,
        status=status,
        team_id=team_id,
        date=date
    )

@router.get("/matches/{match_id}", response_model=MatchDetailResponse)
async def get_match(
    match_id: str = Path(..., description="The match ID"),
    match_service: MatchService = Depends(get_match_service)
):
    """
    Get detailed information for a match.
    """
    match = await match_service.get_match_by_id(match_id)
    return await match_service.get_match_detail(match)

@router.put("/matches/{match_id}", response_model=MatchResponse)
async def update_match(
    match_data: MatchUpdate,
    match_id: str = Path(..., description="The match ID"),
    match_service: MatchService = Depends(get_match_service)
):
    """
    Update details of an existing match (times, status, teams).
    """
    return await match_service.update_match(match_id, match_data)

@router.delete("/matches/{match_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_match(
    match_id: str = Path(..., description="The match ID"),
    match_service: MatchService = Depends(get_match_service)
):
    """
    Delete a match schedule by ID.
    """
    await match_service.delete_match(match_id)
    return None

# --- User Management APIs ---

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    user_service: UserService = Depends(get_user_service)
):
    """
    Create a new user.
    """
    return await user_service.create_user(user_data)

@router.get("/users", response_model=UserPaginatedResponse)
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    active: Optional[bool] = Query(None),
    user_service: UserService = Depends(get_user_service)
):
    """
    List registered users with server-side pagination, search, and filtering.
    """
    return await user_service.get_paginated_users(
        page=page,
        limit=limit,
        search=search,
        role=role,
        active=active
    )

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str = Path(..., description="The user ID"),
    user_service: UserService = Depends(get_user_service)
):
    """
    Get user details by ID.
    """
    return await user_service.get_user_by_id(user_id)

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_data: UserUpdate,
    user_id: str = Path(..., description="The user ID"),
    user_service: UserService = Depends(get_user_service)
):
    """
    Update user roles, status, name, etc.
    """
    return await user_service.update_user(user_id, user_data)

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str = Path(..., description="The user ID to delete"),
    user_service: UserService = Depends(get_user_service)
):
    """
    Delete a user by ID.
    """
    await user_service.delete_user(user_id)

# --- Predictions and Leaderboard Action APIs ---

@router.get("/predictions", response_model=PredictionPaginatedResponse)
async def view_predictions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    prediction_service: PredictionService = Depends(get_prediction_service),
    match_service: MatchService = Depends(get_match_service)
):
    """
    View predictions submitted by all users with server-side pagination, search, and filtering.
    """
    return await prediction_service.get_paginated_predictions_detailed(
        match_service=match_service,
        page=page,
        limit=limit,
        search=search,
        status=status
    )

@router.get("/dashboard/stats", response_model=AdminDashboardStatsResponse)
async def view_dashboard_stats(
    prediction_service: PredictionService = Depends(get_prediction_service),
    match_service: MatchService = Depends(get_match_service)
):
    """
    Get all counts and statistics required for the Admin dashboard in a single network call.
    """
    return await prediction_service.get_dashboard_stats(match_service=match_service)

@router.delete("/predictions/{prediction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prediction(
    prediction_id: str = Path(..., description="The prediction ID to delete"),
    prediction_service: PredictionService = Depends(get_prediction_service)
):
    """
    Delete a user prediction.
    """
    await prediction_service.delete_prediction(prediction_id)

@router.post("/matches/{match_id}/result", response_model=MatchResponse)
async def update_match_result(
    result_data: MatchResultUpdate,
    match_id: str = Path(..., description="The match ID"),
    match_service: MatchService = Depends(get_match_service)
):
    """
    Declare the winning team and set match status to completed.
    """
    return await match_service.declare_match_result(match_id, result_data)

@router.post("/leaderboard/generate", response_model=LeaderboardResponse)
async def generate_leaderboard(
    leaderboard_service: LeaderboardService = Depends(get_leaderboard_service)
):
    """
    Manually compile results and generate/cache the current leaderboard rankings.
    """
    return await leaderboard_service.generate_leaderboard()
