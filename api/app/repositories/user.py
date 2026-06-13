from typing import Optional
from app.models.user import User
from app.repositories.base import BaseRepository

class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(model=User, collection_name="users")

    async def get_by_username(self, username: str) -> Optional[User]:
        doc = await self.collection.find_one({"username": username})
        return self.model(**doc) if doc else None

    async def get_by_username_and_password(self, username: str, password: str) -> Optional[User]:
        doc = await self.collection.find_one({"username": username, "password": password})
        return self.model(**doc) if doc else None
