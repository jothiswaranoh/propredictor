from fastapi import APIRouter, Depends, status
from app.schemas.auth import LoginRequest, Token
from app.schemas.user import UserCreate, UserResponse
from app.services.auth import AuthService
from app.dependencies import get_auth_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    user = await auth_service.authenticate_user(login_data.username, login_data.password)
    token_str = auth_service.create_token_for_user(user)
    return Token(access_token=token_str)

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    user_data: UserCreate,
    auth_service: AuthService = Depends(get_auth_service)
):
    user = await auth_service.register_user(user_data)
    return user
