#!/usr/bin/env python3
"""Database schema repair and sync script.

Drops empty, schema-mismatched tables and executes Base.metadata.create_all
to ensure all 52 models strictly align with PostgreSQL.
"""

import asyncio
import sys
from pathlib import Path

# Add backend directory to python path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from app.core.database import engine, Base
import app.models  # Import all 52 models to register on Base.metadata
import asyncpg


async def repair_and_sync():
    print("=== Starting Database Schema Alignment ===")
    
    # 1. Connect directly via asyncpg to drop empty out-of-sync tables
    conn = await asyncpg.connect(
        user="campus_nexus",
        password="campus_nexus_pass",
        database="campus_nexus",
        host="localhost",
        port=5432,
    )
    
    tables_to_realign = [
        "issue_reports",
        "issues",
        "issue_clusters",
        "found_items",
        "lost_items",
        "lost_found_matches",
    ]
    
    for tbl in tables_to_realign:
        try:
            cnt = await conn.fetchval(f"SELECT count(*) FROM {tbl}")
            if cnt == 0:
                print(f"Dropping empty out-of-sync table: {tbl}")
                await conn.execute(f"DROP TABLE IF EXISTS {tbl} CASCADE;")
        except Exception as e:
            print(f"Note on {tbl}: {e}")
            await conn.execute(f"DROP TABLE IF EXISTS {tbl} CASCADE;")
            
    await conn.close()
    
    # 2. Run Base.metadata.create_all through SQLAlchemy async engine
    print("Running SQLAlchemy create_all for all registered models...")
    async with engine.begin() as conn_engine:
        await conn_engine.run_sync(Base.metadata.create_all)
    
    print("=== Checking all tables in public schema ===")
    conn2 = await asyncpg.connect(
        user="campus_nexus",
        password="campus_nexus_pass",
        database="campus_nexus",
        host="localhost",
        port=5432,
    )
    tables = await conn2.fetch(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    )
    for t in tables:
        print(" +", t["table_name"])
        
    print(f"\nTotal tables in public schema: {len(tables)}")
    await conn2.close()
    print("=== Schema Alignment Complete! ===")


if __name__ == "__main__":
    asyncio.run(repair_and_sync())
