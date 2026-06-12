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
    
    # 1. users: unique email, unique employee_id
    await db.users.create_index("email", unique=True)
    await db.users.create_index("employee_id", unique=True)
    
    # 2. user_predictions: unique (user_id, match_id)
    await db.user_predictions.create_index([("user_id", 1), ("match_id", 1)], unique=True)
    
    # 3. seed default admin
    await seed_default_admin()

async def seed_default_admin():
    db = db_helper.db
    admin_email = settings.DEFAULT_ADMIN_EMAIL
    admin_employee_id = settings.DEFAULT_ADMIN_EMPLOYEE_ID
    admin_name = settings.DEFAULT_ADMIN_NAME
    
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        # Check if employee_id already exists to prevent conflict
        existing_emp = await db.users.find_one({"employee_id": admin_employee_id})
        if existing_emp:
            logger.warning(f"Employee ID {admin_employee_id} already exists for another user. Cannot seed admin.")
            return
            
        admin_doc = {
            "name": admin_name,
            "email": admin_email,
            "employee_id": admin_employee_id,
            "role": "admin",
            "active": True,
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(admin_doc)
        logger.info(f"Default admin user created: {admin_email} / {admin_employee_id}")
    else:
        logger.info("Default admin user already exists.")
