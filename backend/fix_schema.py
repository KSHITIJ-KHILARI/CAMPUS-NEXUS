"""Database schema fix script for Campus NEXUS.

Fixes known divergences between SQLAlchemy models and the actual PostgreSQL schema:
1. Adds missing columns (rooms.status, lifts.direction)
2. Fixes FK references (student_schedules.student_id -> students.id)
3. Fixes FK references (faculty_availability.faculty_id -> faculties.id)
4. Fixes lift_status_records.lift_id type to match lifts.id (VARCHAR)
5. Ensures all model-defined tables exist
"""

import asyncio
from sqlalchemy import text
from app.core.database import engine, Base
from app.models import (
    User, Student, Faculty, Admin, Department, Program, Course, CourseSection, Enrollment,
    Building, Floor, Room, Classroom, Laboratory, CampusLocation, Facility,
    Lift, LiftStatusRecord, Equipment, Resource,
    Timetable, ClassSession, RoomBooking, FacultyAvailability, StudentSchedule,
    CrowdReport, CrowdState, BuzzPost, Issue, IssueReport, IssueCluster,
    LostItem, FoundItem, LostFoundMatch,
    Event, EventRegistration, Notification, NotificationPreference,
    CampusState, AuditLog, AgentExecution, ToolExecution,
    Simulation, SimulationScenario, SimulationResult, OptimizationRun, OptimizationResult,
    LibraryBook, LibraryBookCopy, LibraryReservation, LibrarySeat,
    LearningResource, ResourceBookmark, FAQEntry, KnowledgeDocument,
    EmergencyReport, PresenceConsent
)


async def fix_schema():
    print("Starting database schema fixes...")
    
    async with engine.begin() as conn:
        # 1. Add missing columns to rooms
        print("Adding rooms.status column...")
        await conn.execute(text("""
            ALTER TABLE rooms 
            ADD COLUMN IF NOT EXISTS status VARCHAR(50) NULL
        """))
        
        # 2. Add missing columns to lifts
        print("Adding lifts.direction column...")
        await conn.execute(text("""
            ALTER TABLE lifts 
            ADD COLUMN IF NOT EXISTS direction VARCHAR(50) NOT NULL DEFAULT 'idle'
        """))
        
        # 3. Fix student_schedules.student_id FK
        print("Fixing student_schedules.student_id foreign key...")
        # Add a temporary integer column
        await conn.execute(text("""
            ALTER TABLE student_schedules 
            ADD COLUMN IF NOT EXISTS student_id_new INTEGER
        """))
        
        # Map UUID student_id to integer student ID
        await conn.execute(text("""
            UPDATE student_schedules 
            SET student_id_new = (
                SELECT s.id FROM students s 
                WHERE s.user_id = student_schedules.student_id
            )
        """))
        
        # Drop old FK constraint
        await conn.execute(text("""
            ALTER TABLE student_schedules 
            DROP CONSTRAINT IF EXISTS student_schedules_student_id_fkey
        """))
        
        # Drop old column and rename new one
        await conn.execute(text("""
            ALTER TABLE student_schedules 
            DROP COLUMN student_id
        """))
        
        await conn.execute(text("""
            ALTER TABLE student_schedules 
            RENAME COLUMN student_id_new TO student_id
        """))
        
        # Set NOT NULL
        await conn.execute(text("""
            ALTER TABLE student_schedules 
            ALTER COLUMN student_id SET NOT NULL
        """))
        
        # Add new FK constraint
        await conn.execute(text("""
            ALTER TABLE student_schedules 
            ADD CONSTRAINT student_schedules_student_id_fkey 
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        """))
        
        # 4. Fix faculty_availability.faculty_id FK
        print("Fixing faculty_availability.faculty_id foreign key...")
        # Add a temporary integer column
        await conn.execute(text("""
            ALTER TABLE faculty_availability 
            ADD COLUMN IF NOT EXISTS faculty_id_new INTEGER
        """))
        
        # Map UUID faculty_id to integer faculty ID
        await conn.execute(text("""
            UPDATE faculty_availability 
            SET faculty_id_new = (
                SELECT f.id FROM faculties f 
                WHERE f.user_id = faculty_availability.faculty_id
            )
        """))
        
        # Drop old FK constraint
        await conn.execute(text("""
            ALTER TABLE faculty_availability 
            DROP CONSTRAINT IF EXISTS faculty_availability_faculty_id_fkey
        """))
        
        # Drop old column and rename new one
        await conn.execute(text("""
            ALTER TABLE faculty_availability 
            DROP COLUMN faculty_id
        """))
        
        await conn.execute(text("""
            ALTER TABLE faculty_availability 
            RENAME COLUMN faculty_id_new TO faculty_id
        """))
        
        # Set NOT NULL
        await conn.execute(text("""
            ALTER TABLE faculty_availability 
            ALTER COLUMN faculty_id SET NOT NULL
        """))
        
        # Add new FK constraint
        await conn.execute(text("""
            ALTER TABLE faculty_availability 
            ADD CONSTRAINT faculty_availability_faculty_id_fkey 
            FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE
        """))
        
        # 5. Fix lift_status_records.lift_id to match lifts.id (VARCHAR)
        print("Fixing lift_status_records.lift_id type...")
        # Drop old FK constraint
        res = await conn.execute(text("""
            SELECT tc.constraint_name 
            FROM information_schema.table_constraints tc 
            WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'lift_status_records' 
            AND tc.constraint_name LIKE '%lift_id%'
        """))
        fk_rows = res.fetchall()
        for row in fk_rows:
            await conn.execute(text(f"""
                ALTER TABLE lift_status_records 
                DROP CONSTRAINT IF EXISTS {row[0]}
            """))
        
        # Change column type from INTEGER to VARCHAR to match lifts.id
        await conn.execute(text("""
            ALTER TABLE lift_status_records 
            ALTER COLUMN lift_id TYPE VARCHAR 
            USING lift_id::varchar
        """))
        
        # Re-add FK constraint
        await conn.execute(text("""
            ALTER TABLE lift_status_records 
            ADD CONSTRAINT lift_status_records_lift_id_fkey 
            FOREIGN KEY (lift_id) REFERENCES lifts(id) ON DELETE CASCADE
        """))
        
        # 6. Create any missing tables that models define but DB might lack
        print("Creating any missing tables from models...")
        await conn.run_sync(Base.metadata.create_all, checkfirst=True)
    
    print("Schema fixes completed successfully!")


if __name__ == "__main__":
    asyncio.run(fix_schema())
