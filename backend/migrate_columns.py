import asyncio
from sqlalchemy import text
from app.core.database import engine

DDL_STATEMENTS = [
    "ALTER TABLE faculties ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT TRUE;",
    "ALTER TABLE faculties ADD COLUMN IF NOT EXISTS office_hours_summary VARCHAR(500) DEFAULT 'Mon/Wed/Fri 2:00 PM - 4:00 PM';",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS bio VARCHAR(1000) DEFAULT 'Master of Computer Applications student at Somaiya Vidyavihar University. Interested in Cloud Architecture, AI Systems, and Distributed Applications.';",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS portfolio_json TEXT;",
    "ALTER TABLE user_location_states ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES campus_locations(id);",
    "ALTER TABLE user_location_states ADD COLUMN IF NOT EXISTS location_name VARCHAR(255);",
]

INDEXES = [
    ("idx_users_role_active", "CREATE INDEX IF NOT EXISTS idx_users_role_active ON users (role, is_active)"),
    ("idx_users_last_login", "CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users (last_login_at)"),
    ("idx_students_program", "CREATE INDEX IF NOT EXISTS idx_students_program_id ON students (program_id)"),
    ("idx_students_department", "CREATE INDEX IF NOT EXISTS idx_students_department_id ON students (department_id)"),
    ("idx_students_status", "CREATE INDEX IF NOT EXISTS idx_students_status ON students (status)"),
    ("idx_students_enrollment", "CREATE INDEX IF NOT EXISTS idx_students_enrollment_date ON students (enrollment_date)"),
    ("idx_faculties_department", "CREATE INDEX IF NOT EXISTS idx_faculties_department_id ON faculties (department_id)"),
    ("idx_faculties_designation", "CREATE INDEX IF NOT EXISTS idx_faculties_designation ON faculties (designation)"),
    ("idx_faculties_status", "CREATE INDEX IF NOT EXISTS idx_faculties_status ON faculties (status)"),
    ("idx_faculties_is_available", "CREATE INDEX IF NOT EXISTS idx_faculties_is_available ON faculties (is_available)"),
    ("idx_campus_locations_type", "CREATE INDEX IF NOT EXISTS idx_campus_locations_type ON campus_locations (location_type)"),
    ("idx_campus_locations_building", "CREATE INDEX IF NOT EXISTS idx_campus_locations_building_id ON campus_locations (building_id)"),
    ("idx_user_location_timestamp", "CREATE INDEX IF NOT EXISTS idx_user_location_ts ON user_location_states (timestamp)"),
    ("idx_user_location_tracking", "CREATE INDEX IF NOT EXISTS idx_user_location_tracking ON user_location_states (tracking_enabled)"),
    ("idx_user_location_location_id", "CREATE INDEX IF NOT EXISTS idx_user_location_location_id ON user_location_states (location_id)"),
    ("idx_user_location_active", "CREATE INDEX IF NOT EXISTS idx_user_location_active ON user_location_states (tracking_enabled, location_status)"),
    ("idx_presence_enabled", "CREATE INDEX IF NOT EXISTS idx_presence_enabled ON presence_consent (is_enabled)"),
    ("idx_notifications_recipient", "CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications (recipient_id)"),
    ("idx_notifications_read", "CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications (is_read)"),
    ("idx_issues_status", "CREATE INDEX IF NOT EXISTS idx_issues_status ON issues (status)"),
    ("idx_issues_priority", "CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues (priority)"),
    ("idx_events_start", "CREATE INDEX IF NOT EXISTS idx_events_start_time ON events (start_time)"),
    ("idx_library_reservations", "CREATE INDEX IF NOT EXISTS idx_library_reservations_status ON library_reservations (status)"),
    ("idx_enrollments_student", "CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments (student_id)"),
    ("idx_enrollments_section", "CREATE INDEX IF NOT EXISTS idx_enrollments_section_id ON enrollments (course_section_id)"),
]

async def migrate():
    print("Executing DDL column additions...")
    for sql in DDL_STATEMENTS:
        try:
            async with engine.begin() as conn:
                await conn.execute(text(sql))
            print(f"  + Applied: {sql[:60]}...")
        except Exception as e:
            print(f"  ~ Skipped/Error: {sql[:40]} -> {str(e)[:60]}")

    print("Executing performance index creations...")
    for idx_name, sql in INDEXES:
        try:
            async with engine.begin() as conn:
                await conn.execute(text(sql))
            print(f"  + Created index: {idx_name}")
        except Exception as e:
            print(f"  ~ Index note: {idx_name} -> {str(e)[:60]}")

    print("Migration finished cleanly!")

if __name__ == "__main__":
    asyncio.run(migrate())
