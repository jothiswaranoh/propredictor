from app.models.team import Team
from app.repositories.base import BaseRepository

class TeamRepository(BaseRepository[Team]):
    def __init__(self):
        super().__init__(model=Team, collection_name="teams")
