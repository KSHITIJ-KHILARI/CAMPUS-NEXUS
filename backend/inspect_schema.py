import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect('postgresql://campus_nexus:campus_nexus_pass@localhost:5432/campus_nexus')
    
    # Get all tables
    tables = await conn.fetch("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
    """)
    
    print("=== TABLES ===")
    for t in tables:
        print(t['table_name'])
    
    # Get columns for key tables
    key_tables = ['users', 'students', 'faculties', 'buildings', 'rooms', 'events', 'issues', 'library_books', 'library_reservations', 'emergency_reports', 'presence_consent', 'faculty_availability']
    
    for table in key_tables:
        cols = await conn.fetch("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = $1 AND table_schema = 'public'
            ORDER BY ordinal_position
        """, table)
        
        print(f"\n=== {table.upper()} ===")
        for col in cols:
            print(f"  {col['column_name']}: {col['data_type']} {'NULL' if col['is_nullable'] == 'YES' else 'NOT NULL'} {col['column_default'] or ''}")
    
    await conn.close()

asyncio.run(main())
