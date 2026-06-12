import asyncio
import os
from datetime import UTC, datetime
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = os.getenv(
    "MONGO_URI",
    ""
)

CREATED_AT = datetime.now(UTC)

# Removed the duplicate Mexico entry from the list
TEAMS_TO_SEED = [
    { "name": "Algeria", "short_name": "ALG", "logo_url": "https://flagcdn.com/w320/dz.png" },
    { "name": "Argentina", "short_name": "ARG", "logo_url": "https://flagcdn.com/w320/ar.png" },
    { "name": "Australia", "short_name": "AUS", "logo_url": "https://flagcdn.com/w320/au.png" },
    { "name": "Austria", "short_name": "AUT", "logo_url": "https://flagcdn.com/w320/at.png" },
    { "name": "Belgium", "short_name": "BEL", "logo_url": "https://flagcdn.com/w320/be.png" },
    { "name": "Bosnia and Herzegovina", "short_name": "BIH", "logo_url": "https://flagcdn.com/w320/ba.png" },
    { "name": "Brazil", "short_name": "BRA", "logo_url": "https://flagcdn.com/w320/br.png" },
    { "name": "Canada", "short_name": "CAN", "logo_url": "https://flagcdn.com/w320/ca.png" },
    { "name": "Cape Verde", "short_name": "CPV", "logo_url": "https://flagcdn.com/w320/cv.png" },
    { "name": "Colombia", "short_name": "COL", "logo_url": "https://flagcdn.com/w320/co.png" },
    { "name": "Croatia", "short_name": "CRO", "logo_url": "https://flagcdn.com/w320/hr.png" },
    { "name": "Curaçao", "short_name": "CUW", "logo_url": "https://flagcdn.com/w320/cw.png" },
    { "name": "Czechia", "short_name": "CZE", "logo_url": "https://flagcdn.com/w320/cz.png" },
    { "name": "DR Congo", "short_name": "COD", "logo_url": "https://flagcdn.com/w320/cd.png" },
    { "name": "Ecuador", "short_name": "ECU", "logo_url": "https://flagcdn.com/w320/ec.png" },
    { "name": "Egypt", "short_name": "EGY", "logo_url": "https://flagcdn.com/w320/eg.png" },
    { "name": "England", "short_name": "ENG", "logo_url": "https://flagcdn.com/w320/gb-eng.png" },
    { "name": "France", "short_name": "FRA", "logo_url": "https://flagcdn.com/w320/fr.png" },
    { "name": "Germany", "short_name": "GER", "logo_url": "https://flagcdn.com/w320/de.png" },
    { "name": "Ghana", "short_name": "GHA", "logo_url": "https://flagcdn.com/w320/gh.png" },
    { "name": "Haiti", "short_name": "HAI", "logo_url": "https://flagcdn.com/w320/ht.png" },
    { "name": "Iran", "short_name": "IRN", "logo_url": "https://flagcdn.com/w320/ir.png" },
    { "name": "Iraq", "short_name": "IRQ", "logo_url": "https://flagcdn.com/w320/iq.png" },
    { "name": "Japan", "short_name": "JPN", "logo_url": "https://flagcdn.com/w320/jp.png" },
    { "name": "Jordan", "short_name": "JOR", "logo_url": "https://flagcdn.com/w320/jo.png" },
    { "name": "Mexico", "short_name": "MEX", "logo_url": "https://flagcdn.com/w320/mx.png" },
    { "name": "Morocco", "short_name": "MAR", "logo_url": "https://flagcdn.com/w320/ma.png" },
    { "name": "Netherlands", "short_name": "NED", "logo_url": "https://flagcdn.com/w320/nl.png" },
    { "name": "New Zealand", "short_name": "NZL", "logo_url": "https://flagcdn.com/w320/nz.png" },
    { "name": "Norway", "short_name": "NOR", "logo_url": "https://flagcdn.com/w320/no.png" },
    { "name": "Panama", "short_name": "PAN", "logo_url": "https://flagcdn.com/w320/pa.png" },
    { "name": "Paraguay", "short_name": "PAR", "logo_url": "https://flagcdn.com/w320/py.png" },
    { "name": "Portugal", "short_name": "POR", "logo_url": "https://flagcdn.com/w320/pt.png" },
    { "name": "Qatar", "short_name": "QAT", "logo_url": "https://flagcdn.com/w320/qa.png" },
    { "name": "Saudi Arabia", "short_name": "KSA", "logo_url": "https://flagcdn.com/w320/sa.png" },
    { "name": "Scotland", "short_name": "SCO", "logo_url": "https://flagcdn.com/w320/gb-sct.png" },
    { "name": "Senegal", "short_name": "SEN", "logo_url": "https://flagcdn.com/w320/sn.png" },
    { "name": "South Africa", "short_name": "RSA", "logo_url": "https://flagcdn.com/w320/za.png" },
    { "name": "South Korea", "short_name": "KOR", "logo_url": "https://flagcdn.com/w320/kr.png" },
    { "name": "Spain", "short_name": "ESP", "logo_url": "https://flagcdn.com/w320/es.png" },
    { "name": "Sweden", "short_name": "SWE", "logo_url": "https://flagcdn.com/w320/se.png" },
    { "name": "Switzerland", "short_name": "SUI", "logo_url": "https://flagcdn.com/w320/ch.png" },
    { "name": "Tunisia", "short_name": "TUN", "logo_url": "https://flagcdn.com/w320/tn.png" },
    { "name": "Türkiye", "short_name": "TUR", "logo_url": "https://flagcdn.com/w320/tr.png" },
    { "name": "United States", "short_name": "USA", "logo_url": "https://flagcdn.com/w320/us.png" },
    { "name": "Uruguay", "short_name": "URU", "logo_url": "https://flagcdn.com/w320/uy.png" },
    { "name": "Uzbekistan", "short_name": "UZB", "logo_url": "https://flagcdn.com/w320/uz.png" },
    { "name": "Côte d'Ivoire", "short_name": "CIV", "logo_url": "https://flagcdn.com/w320/ci.png" }
]

async def seed_teams() -> None:
    print(f"Connecting to MongoDB: {MONGO_URI}")
    client = AsyncIOMotorClient(MONGO_URI)
    try:
        db_name = MONGO_URI.rsplit("/", 1)[-1].split("?")[0]
        db = client[db_name]

        # Verify connection
        await client.admin.command("ping")
        print("✅ MongoDB connection successful")

        # Create unique indexes on name and short_name
        await db.teams.create_index("name", unique=True)
        await db.teams.create_index("short_name", unique=True)

        seeded_count = 0
        for team in TEAMS_TO_SEED:
            existing = await db.teams.find_one({
                "$or": [
                    {"name": team["name"]},
                    {"short_name": team["short_name"]}
                ]
            })
            if existing:
                print(f"⚠️ Team already exists: {team['name']} ({team['short_name']})")
                continue

            team_doc = {
                "name": team["name"],
                "short_name": team["short_name"],
                "logo_url": team["logo_url"],
                "active": True,
                "created_at": CREATED_AT
            }
            await db.teams.insert_one(team_doc)
            print(f"✅ Seeded team: {team['name']} ({team['short_name']})")
            seeded_count += 1

        print(f"\n🎉 Team seeding completed. Added {seeded_count} team(s).")
    except Exception as exc:
        print(f"❌ Error during seeding: {exc}")
        raise
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(seed_teams())