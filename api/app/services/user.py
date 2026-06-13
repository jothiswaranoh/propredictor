from datetime import datetime
from typing import List, Optional
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.user import UserCreate, UserUpdate
from app.exceptions import ConflictException, NotFoundException

class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def get_user_by_id(self, user_id: str) -> User:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        return user

    async def get_all_users(self) -> List[User]:
        return await self.user_repo.get_all(sort_by="name")

    async def create_user(self, user_data: UserCreate) -> User:
        # Check duplicate username
        existing_username = await self.user_repo.get_by_username(user_data.username)
        if existing_username:
            raise ConflictException("Username already exists")

        user_dict = user_data.model_dump()
        user_dict["created_at"] = datetime.utcnow()
        return await self.user_repo.create(user_dict)

    async def update_user(self, user_id: str, user_data: UserUpdate) -> User:
        user = await self.get_user_by_id(user_id)
        
        update_dict = user_data.model_dump(exclude_unset=True)
        
        if "username" in update_dict and update_dict["username"] != user.username:
            existing = await self.user_repo.get_by_username(update_dict["username"])
            if existing:
                raise ConflictException("Username already exists")

        return await self.user_repo.update(user_id, update_dict)

    async def delete_user(self, user_id: str) -> bool:
        await self.get_user_by_id(user_id)
        return await self.user_repo.delete(user_id)

    async def get_paginated_users(
        self,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        role: Optional[str] = None,
        active: Optional[bool] = None
    ):
        filter_query = {}
        
        if search:
            filter_query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"username": {"$regex": search, "$options": "i"}}
            ]
            
        if role:
            filter_query["role"] = role
            
        if active is not None:
            filter_query["active"] = active
            
        users, total = await self.user_repo.get_paginated(
            filter_query=filter_query,
            sort_by="name",
            page=page,
            limit=limit
        )
        
        pages = (total + limit - 1) // limit if limit > 0 else 0
        
        return {
            "users": users,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": pages
        }
