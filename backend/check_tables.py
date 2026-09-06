import asyncio
from app.core.database import engine
from sqlalchemy import text

async def check():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"))
        tables = [r[0] for r in result.fetchall()]
        print(f"Total tables: {len(tables)}")
        for t in tables:
            print(f"  {t}")
        # Check for key tables
        key_tables = ['student_schedules', 'faculty_availabilities', 'campus_locations', 'crowd_states', 'user_locations', 'digital_twins', 'rush_overrides', 'issue_reports', 'event_registrations', 'library_reservations', 'notifications', 'programs', 'departments', 'course_sections']
        print("\nKey table check:")
        for kt in key_tables:
            exists = kt in tables
            print(f"  {kt}: {'EXISTS' if exists else 'MISSING'}")

asyncio.run(check())
