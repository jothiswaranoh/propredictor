from datetime import datetime
from typing import List
from app.models.team import Team
from app.repositories.team import TeamRepository
from app.schemas.team import TeamCreate, TeamUpdate
from app.exceptions import NotFoundException, ConflictException

class TeamService:
    def __init__(self, team_repo: TeamRepository):
        self.team_repo = team_repo

    async def get_team_by_id(self, team_id: str) -> Team:
        team = await self.team_repo.get_by_id(team_id)
        if not team:
            raise NotFoundException("Team not found")
        return team

    async def get_all_teams(self, active_only: bool = False) -> List[Team]:
        filter_query = {"active": True} if active_only else {}
        return await self.team_repo.get_all(filter_query=filter_query, sort_by="name")

    async def create_team(self, team_data: TeamCreate) -> Team:
        existing = await self.team_repo.get_all(filter_query={"name": team_data.name})
        if existing:
            raise ConflictException("Team with this name already exists")
            
        team_dict = team_data.model_dump()
        team_dict["created_at"] = datetime.utcnow()
        return await self.team_repo.create(team_dict)

    async def update_team(self, team_id: str, team_data: TeamUpdate) -> Team:
        team = await self.get_team_by_id(team_id)
        update_dict = team_data.model_dump(exclude_unset=True)
        
        if "name" in update_dict and update_dict["name"] != team.name:
            existing = await self.team_repo.get_all(filter_query={"name": update_dict["name"]})
            if existing:
                raise ConflictException("Team with this name already exists")
                
        return await self.team_repo.update(team_id, update_dict)

    async def delete_team(self, team_id: str) -> bool:
        await self.get_team_by_id(team_id)
        return await self.team_repo.delete(team_id)
