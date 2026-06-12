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
        # Check duplicate email
        existing_email = await self.user_repo.get_by_email(user_data.email)
        if existing_email:
            raise ConflictException("Email already exists")
        
        # Check duplicate employee_id
        existing_emp = await self.user_repo.get_all(filter_query={"employee_id": user_data.employee_id})
        if existing_emp:
            raise ConflictException("Employee ID already exists")

        user_dict = user_data.model_dump()
        user_dict["created_at"] = datetime.utcnow()
        return await self.user_repo.create(user_dict)

    async def update_user(self, user_id: str, user_data: UserUpdate) -> User:
        user = await self.get_user_by_id(user_id)
        
        update_dict = user_data.model_dump(exclude_unset=True)
        
        if "email" in update_dict and update_dict["email"] != user.email:
            existing = await self.user_repo.get_by_email(update_dict["email"])
            if existing:
                raise ConflictException("Email already exists")

        if "employee_id" in update_dict and update_dict["employee_id"] != user.employee_id:
            existing = await self.user_repo.get_all(filter_query={"employee_id": update_dict["employee_id"]})
            if existing:
                raise ConflictException("Employee ID already exists")

        return await self.user_repo.update(user_id, update_dict)

    async def delete_user(self, user_id: str) -> bool:
        await self.get_user_by_id(user_id)
        return await self.user_repo.delete(user_id)
