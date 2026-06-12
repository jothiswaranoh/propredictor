import pytest
import asyncio
import os
from typing import AsyncGenerator
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient

# Force test configuration
os.environ["MONGO_URI"] = "mongodb://localhost:27017/football_test"
os.environ["JWT_SECRET"] = "testsecretkeytestsecretkeytestsecretkeytestsecretkey"

from app.main import app
from app.database import db_helper, init_db
from app.config import settings

@pytest.fixture(scope="session")
def event_loop():
    try:
        return asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        return loop

@pytest.fixture(scope="function", autouse=True)
async def clean_db():
    # Setup connection
    db_helper.client = AsyncIOMotorClient(settings.MONGO_URI)
    db_helper.db = db_helper.client["football_test"]
    
    # Clear collections to start fresh
    await db_helper.db.users.delete_many({})
    await db_helper.db.teams.delete_many({})
    await db_helper.db.matches.delete_many({})
    await db_helper.db.user_predictions.delete_many({})
    await db_helper.db.leaderboard_cache.delete_many({})
    
    # Initialize indexes and default admin
    await init_db()
    
    yield db_helper.db
    
    # Close connection
    db_helper.client.close()

@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
