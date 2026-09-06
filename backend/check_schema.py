import asyncio
from sqlalchemy import text
from app.core.database import engine

async def check():
    async with engine.connect() as conn:
        res1 = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='faculties'"))
        print("faculties cols:", [r[0] for r in res1.fetchall()])
        res2 = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='students'"))
        print("students cols:", [r[0] for r in res2.fetchall()])

if __name__ == "__main__":
    asyncio.run(check())
