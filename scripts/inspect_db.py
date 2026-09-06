#!/usr/bin/env python3
"""Interactive Campus NEXUS PostgreSQL Database Inspector.

Usage:
    python scripts/inspect_db.py              # Lists all tables and row counts
    python scripts/inspect_db.py <table_name> # Shows first 10 rows in that table
"""

import asyncio
import sys
import asyncpg
from tabulate import tabulate

DB_CONFIG = {
    "user": "campus_nexus",
    "password": "campus_nexus_pass",
    "database": "campus_nexus",
    "host": "localhost",
    "port": 5432,
}


async def inspect(table_name: str | None = None):
    conn = await asyncpg.connect(**DB_CONFIG)
    
    if not table_name:
        print("\n========================================================")
        print("          CAMPUS NEXUS POSTGRESQL TABLES               ")
        print("========================================================")
        print(f"Connected to: postgresql://{DB_CONFIG['user']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}\n")
        
        # Get all tables in public schema
        rows = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        
        summary = []
        for r in rows:
            t = r["table_name"]
            try:
                cnt = await conn.fetchval(f'SELECT count(*) FROM "{t}"')
                summary.append([t, cnt])
            except Exception as e:
                summary.append([t, f"Err: {e}"])
                
        print(tabulate(summary, headers=["Table Name", "Row Count"], tablefmt="fancy_grid"))
        print("\nTip: Run 'python scripts/inspect_db.py <table_name>' to view table rows.")
        print("Example: python scripts/inspect_db.py buildings\n")

    else:
        print(f"\n=== Table: {table_name} (Top 10 Records) ===")
        try:
            records = await conn.fetch(f'SELECT * FROM "{table_name}" LIMIT 10')
            if not records:
                print(f"Table '{table_name}' is empty.")
            else:
                headers = list(records[0].keys())
                rows = []
                for rec in records:
                    row = []
                    for val in rec.values():
                        # Truncate long strings/UUIDs for clean terminal display
                        s_val = str(val) if val is not None else "NULL"
                        if len(s_val) > 35:
                            s_val = s_val[:32] + "..."
                        row.append(s_val)
                    rows.append(row)
                print(tabulate(rows, headers=headers, tablefmt="fancy_grid"))
        except Exception as e:
            print(f"Error querying table '{table_name}': {e}")
            
    await conn.close()


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else None
    # Ensure tabulate is available or fallback
    try:
        from tabulate import tabulate
    except ImportError:
        def tabulate(rows, headers, **kwargs):
            out = [" | ".join(str(h) for h in headers), "-" * 60]
            for r in rows:
                out.append(" | ".join(str(c) for c in r))
            return "\n".join(out)

    asyncio.run(inspect(target))
