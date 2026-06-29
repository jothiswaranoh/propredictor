import asyncio
import logging
import sys
import os

# Add the parent directory to sys.path so we can import 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import db_helper, connect_to_mongo, close_mongo_connection
from app.repositories.user import UserRepository
from app.utils.security import hash_password

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("migration")

async def main():
    logger.info("Starting password migration backfill...")
    
    # Initialize DB connection
    await connect_to_mongo()
    
    user_repo = UserRepository()
    
    # Retrieve all users
    try:
        users = await user_repo.get_all()
    except Exception as e:
        logger.error(f"Failed to retrieve users: {e}")
        await close_mongo_connection()
        return

    total_users = len(users)
    migrated_count = 0
    skipped_count = 0
    failures = 0

    for user in users:
        try:
            # Check if the password is already a bcrypt hash
            if user.password.startswith("$2") and len(user.password) >= 60:
                skipped_count += 1
                continue
                
            # Hash the plain-text password
            hashed_password = hash_password(user.password)
            
            # Update the user record
            await user_repo.update(str(user.id), {"password": hashed_password})
            migrated_count += 1
            
        except Exception as e:
            logger.error(f"Failed to migrate user {user.username} ({user.id}): {e}")
            failures += 1

    logger.info("Password migration backfill complete.")
    logger.info(f"Total users processed: {total_users}")
    logger.info(f"Migrated count: {migrated_count}")
    logger.info(f"Skipped count (already hashed): {skipped_count}")
    logger.info(f"Failures: {failures}")
    
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(main())
