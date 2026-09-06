"""Migration: add geofence fields to CampusLocation and create location-tracking tables."""

import asyncio
from sqlalchemy import text
from app.core.database import engine, Base
from app.models.user_location import UserLocationState
from app.models.admin_rush_override import AdminRushOverride


async def migrate():
    async with engine.begin() as conn:
        print("Adding geofence_radius_meters, capacity, operational_status to campus_locations...")
        await conn.execute(text(
            "ALTER TABLE campus_locations ADD COLUMN IF NOT EXISTS "
            "geofence_radius_meters FLOAT DEFAULT 80.0;"
        ))
        await conn.execute(text(
            "ALTER TABLE campus_locations ADD COLUMN IF NOT EXISTS capacity INTEGER;"
        ))
        await conn.execute(text(
            "ALTER TABLE campus_locations ADD COLUMN IF NOT EXISTS operational_status VARCHAR(30) DEFAULT 'operational';"
        ))

        print("Creating user_location_states table...")
        await conn.run_sync(UserLocationState.__table__.create, checkfirst=True)

        print("Creating admin_rush_overrides table...")
        await conn.run_sync(AdminRushOverride.__table__.create, checkfirst=True)

        print("Seeding campus location capacities and geofence radii...")
        campus_locations = [
            ("Main Academic Block (MAB)", 500, 80.0),
            ("Computer Science Building (CSB)", 400, 80.0),
            ("Library & Learning Center", 300, 80.0),
            ("Student Center", 200, 80.0),
            ("Hostel Complex", 150, 100.0),
            ("Main Gate", 0, 50.0),
            ("Central Library", 300, 80.0),
            ("Main Canteen", 150, 80.0),
            ("Maggi Point", 30, 50.0),
            ("Frankie", 25, 50.0),
            ("Photocopy", 20, 50.0),
            ("Gargi Plaza", 60, 60.0),
            ("Ground", 500, 120.0),
            ("Aurobindo Building", 350, 80.0),
            ("Bhaskaracharya Building", 450, 80.0),
            ("Aryabhata Building", 400, 80.0),
            ("Somaiya Sports Complex", 200, 120.0),
        ]
        for name, capacity, radius in campus_locations:
            await conn.execute(text(
                "UPDATE campus_locations SET capacity = :cap, geofence_radius_meters = :rad "
                "WHERE LOWER(name) LIKE LOWER(:name) AND (capacity IS NULL OR capacity = 0);"
            ), {"cap": capacity, "rad": radius, "name": name})

    print("Migration completed successfully!")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(migrate())
