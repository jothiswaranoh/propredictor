from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.exceptions import AuthException, ForbiddenException
from app.repositories.user import UserRepository
from app.repositories.team import TeamRepository
from app.repositories.match import MatchRepository
from app.repositories.prediction import PredictionRepository
from app.services.auth import AuthService
from app.services.user import UserService
from app.services.team import TeamService
from app.services.match import MatchService
from app.services.prediction import PredictionService
from app.services.leaderboard import LeaderboardService
from app.models.user import User

security = HTTPBearer()

# Repository dependencies
def get_user_repo() -> UserRepository:
    return UserRepository()

def get_team_repo() -> TeamRepository:
    return TeamRepository()

def get_match_repo() -> MatchRepository:
    return MatchRepository()

def get_prediction_repo() -> PredictionRepository:
    return PredictionRepository()

# Service dependencies
def get_auth_service(user_repo: UserRepository = Depends(get_user_repo)) -> AuthService:
    return AuthService(user_repo)

def get_user_service(user_repo: UserRepository = Depends(get_user_repo)) -> UserService:
    return UserService(user_repo)

def get_team_service(team_repo: TeamRepository = Depends(get_team_repo)) -> TeamService:
    return TeamService(team_repo)

def get_match_service(
    match_repo: MatchRepository = Depends(get_match_repo),
    team_repo: TeamRepository = Depends(get_team_repo)
) -> MatchService:
    return MatchService(match_repo, team_repo)

def get_prediction_service(
    prediction_repo: PredictionRepository = Depends(get_prediction_repo),
    match_repo: MatchRepository = Depends(get_match_repo),
    team_repo: TeamRepository = Depends(get_team_repo),
    user_repo: UserRepository = Depends(get_user_repo)
) -> PredictionService:
    return PredictionService(prediction_repo, match_repo, team_repo, user_repo)

def get_leaderboard_service(user_repo: UserRepository = Depends(get_user_repo)) -> LeaderboardService:
    return LeaderboardService(user_repo)

# Authentication dependencies
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service),
    user_service: UserService = Depends(get_user_service)
) -> User:
    token = credentials.credentials
    payload = auth_service.verify_access_token(token)
    user_id = payload.get("user_id")
    user = await user_service.get_user_by_id(user_id)
    if not user.active:
        raise AuthException("User account is inactive")
    return user

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise ForbiddenException("Requires administrator role")
    return current_user

async def require_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user
