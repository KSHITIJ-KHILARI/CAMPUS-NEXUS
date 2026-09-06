"""Helper script to sync database schema for newly added models."""

import asyncio
from app.core.database import engine, Base
from app.models import EmergencyReport, PresenceConsent


async def create_all():
    print("Connecting to PostgreSQL and creating new tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created successfully!")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(create_all())
