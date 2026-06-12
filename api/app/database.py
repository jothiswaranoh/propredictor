import logging
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_helper = Database()

async def connect_to_mongo():
    logger.info("Connecting to MongoDB...")
    db_helper.client = AsyncIOMotorClient(settings.MONGO_URI)
    db_name = settings.MONGO_URI.split("/")[-1].split("?")[0] or "football_prediction"
    db_helper.db = db_helper.client[db_name]
    logger.info(f"Connected to database: {db_name}")
    await init_db()

async def close_mongo_connection():
    if db_helper.client:
        db_helper.client.close()
        logger.info("MongoDB connection closed.")

async def init_db():
    db = db_helper.db

    # 1. users: unique email
    await db.users.create_index("email", unique=True)

    # Drop outdated unique employee_id index if it exists
    try:
        await db.users.drop_index("employee_id_1")
        logger.info("Successfully dropped outdated unique index 'employee_id_1' from users collection.")
    except Exception:
        pass
    
    # 2. user_predictions: unique (user_id, match_id)
    await db.user_predictions.create_index([("user_id", 1), ("match_id", 1)], unique=True)
    
