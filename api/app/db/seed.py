import asyncio
import os
from datetime import UTC, datetime

from motor.motor_asyncio import AsyncIOMotorClient


MONGO_URI = os.getenv(
    "MONGO_URI",
    "",
)

CREATED_AT = datetime.now(UTC)

USERS_TO_SEED = [
    {
        "name": "Athu",
        "email": "athu@gmail.com",
        "password": "HAI-200",
        "role": "user",
        "active": True,
        "created_at": CREATED_AT,
    },

]


async def seed_users() -> None:
    print(f"Connecting to MongoDB: {MONGO_URI}")

    client = AsyncIOMotorClient(MONGO_URI)

    try:
        db_name = MONGO_URI.rsplit("/", 1)[-1].split("?")[0]
        db = client[db_name]

        # Verify connection
        await client.admin.command("ping")
        print("✅ MongoDB connection successful")

        # Create indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("password", unique=True)

        seeded_count = 0

        for user in USERS_TO_SEED:
            existing_user = await db.users.find_one(
                {
                    "$or": [
                        {"email": user["email"]},
                        {"password": user["password"]},
                    ]
                }
            )

            if existing_user:
                print(
                    f"⚠️ User already exists: "
                    f"{user['email']} ({user['password']})"
                )
                continue

            await db.users.insert_one(user)

            print(
                f"✅ Seeded: "
                f"{user['name']} "
                f"({user['email']})"
            )

            seeded_count += 1

        print(
            f"\n🎉 Seeding completed. "
            f"Added {seeded_count} user(s)."
        )

    except Exception as exc:
        print(f"❌ Error during seeding: {exc}")
        raise

    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(seed_users())