from typing import Optional
from app.models.user import User
from app.repositories.base import BaseRepository

class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(model=User, collection_name="users")

    async def get_by_email(self, email: str) -> Optional[User]:
        doc = await self.collection.find_one({"email": email})
        return self.model(**doc) if doc else None

    async def get_by_email_and_employee_id(self, email: str, employee_id: str) -> Optional[User]:
        doc = await self.collection.find_one({"email": email, "employee_id": employee_id})
        return self.model(**doc) if doc else None
