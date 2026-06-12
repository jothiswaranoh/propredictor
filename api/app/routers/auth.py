from fastapi import APIRouter, Depends
from app.schemas.auth import LoginRequest, Token
from app.services.auth import AuthService
from app.dependencies import get_auth_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    user = await auth_service.authenticate_user(login_data.email, login_data.employee_id)
    token_str = auth_service.create_token_for_user(user)
    return Token(access_token=token_str)
