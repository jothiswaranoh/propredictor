from datetime import datetime, timedelta
import jwt
from typing import Optional
from app.config import settings
from app.exceptions import AuthException
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.user import UserCreate
from app.utils.security import hash_password, verify_password

class AuthService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def register_user(self, user_data: UserCreate) -> User:
        existing_user = await self.user_repo.get_by_username(user_data.username)
        if existing_user:
            raise AuthException("Username already registered")
        
        user_dict = user_data.model_dump()
        user_dict["password"] = hash_password(user_dict["password"])
        user_dict["created_at"] = datetime.utcnow()
        user = await self.user_repo.create(user_dict)
        return user

    async def authenticate_user(self, username: str, password: str) -> User:
        user = await self.user_repo.get_by_username(username)
        if not user:
            raise AuthException("Invalid username or password")
            
        is_valid, needs_rehash = verify_password(password, user.password)
        if not is_valid:
            raise AuthException("Invalid username or password")
            
        if needs_rehash:
            # Hash the password and update in the database
            hashed_password = hash_password(password)
            await self.user_repo.update(str(user.id), {"password": hashed_password})
            # Also update the in-memory user object if needed later in the flow
            user.password = hashed_password
        if not user.active:
            raise AuthException("User account is inactive")
        return user

    def create_token_for_user(self, user: User) -> str:
        token_data = {
            "sub": str(user.id),
            "username": user.username,
            "role": user.role
        }
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        token_data.update({"exp": expire})
        return jwt.encode(token_data, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    def verify_access_token(self, token: str) -> dict:
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
            user_id: str = payload.get("sub")
            username: str = payload.get("username")
            role: str = payload.get("role")
            if user_id is None or username is None or role is None:
                raise AuthException("Could not validate credentials")
            return {"user_id": user_id, "username": username, "role": role}
        except jwt.ExpiredSignatureError:
            raise AuthException("Token has expired")
        except jwt.PyJWTError:
            raise AuthException("Could not validate credentials")
