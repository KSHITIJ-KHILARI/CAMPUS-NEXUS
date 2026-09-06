"""Fix foreign key type mismatches in Campus Nexus models."""

import re
from pathlib import Path

MODELS_DIR = Path(r"C:\Users\kshit\.gemini\antigravity-ide\campus-nexus\backend\app\models")

# Map of table names to their primary key types
PK_TYPES = {
    "users": "uuid",
    "students": "int",
    "faculties": "int",
    "admins": "int",
    "departments": "int",
    "programs": "int",
    "courses": "int",
    "course_sections": "int",
    "enrollments": "int",
    "buildings": "int",
    "floors": "int",
    "rooms": "int",
    "classrooms": "int",
    "laboratories": "int",
    "campus_locations": "int",
    "facilities": "int",
    "lifts": "string",
    "lift_status_records": "string",
    "equipment": "string",
    "resources": "string",
    "timetables": "string",
    "class_sessions": "string",
    "room_bookings": "string",
    "faculty_availability": "string",
    "student_schedules": "string",
    "crowd_reports": "int",
    "crowd_states": "int",
    "buzz_posts": "int",
    "issues": "string",
    "issue_reports": "string",
    "issue_clusters": "string",
    "lost_items": "int",
    "found_items": "int",
    "events": "string",
    "event_registrations": "string",
    "notifications": "string",
    "notification_preferences": "string",
    "campus_states": "string",
    "audit_logs": "string",
    "agent_executions": "string",
    "tool_executions": "string",
    "simulations": "string",
    "simulation_scenarios": "string",
    "simulation_results": "string",
    "optimization_runs": "string",
    "optimization_results": "string",
}

# Pattern to find ForeignKey references
FK_PATTERN = re.compile(r'ForeignKey\("([^"]+)"\)')


def get_pk_type(table_name):
    """Get the primary key type for a table."""
    return PK_TYPES.get(table_name, "string")


def fix_model_file(file_path):
    """Fix foreign key type mismatches in a model file."""
    content = file_path.read_text()
    original = content
    
    # Find all ForeignKey references
    for match in FK_PATTERN.finditer(content):
        fk_ref = match.group(1)
        table_name = fk_ref.split(".")[0]
        pk_type = get_pk_type(table_name)
        
        if pk_type == "string":
            continue  # No fix needed
        
        # Find the line with this ForeignKey
        lines = content.split("\n")
        for i, line in enumerate(lines):
            if fk_ref in line and "ForeignKey" in line:
                # Check if the column type needs to be changed
                if "Column(String" in line and pk_type == "int":
                    lines[i] = line.replace("Column(String,", "Column(Integer,")
                elif "Column(String" in line and pk_type == "uuid":
                    lines[i] = line.replace("Column(String,", 'Column(UUID(as_uuid=True),')
                elif "Mapped[int | None]" in line or "Mapped[int]" in line:
                    # Already correct type
                    pass
                elif "Mapped[uuid.UUID" in line:
                    # Already correct type
                    pass
                break
        
        content = "\n".join(lines)
    
    if content != original:
        file_path.write_text(content)
        print(f"Fixed: {file_path.name}")
        return True
    return False


def main():
    """Fix all model files."""
    fixed = 0
    for file_path in MODELS_DIR.glob("*.py"):
        if file_path.name == "__init__.py":
            continue
        if fix_model_file(file_path):
            fixed += 1
    
    print(f"\nFixed {fixed} files")


if __name__ == "__main__":
    main()
