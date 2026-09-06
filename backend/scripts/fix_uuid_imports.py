"""Add missing UUID imports to model files."""

import re
from pathlib import Path

MODELS_DIR = Path(r"C:\Users\kshit\.gemini\antigravity-ide\campus-nexus\backend\app\models")

UUID_PATTERN = re.compile(r'UUID\(as_uuid=True\)')


def fix_imports(file_path):
    """Add UUID import if needed."""
    content = file_path.read_text()
    
    if "UUID(as_uuid=True)" not in content:
        return False
    
    if "from sqlalchemy.dialects.postgresql import UUID as PG_UUID" in content:
        return False
    
    if "from sqlalchemy import UUID" in content:
        return False
    
    # Add UUID import
    lines = content.split("\n")
    for i, line in enumerate(lines):
        if line.startswith("from sqlalchemy import"):
            if "UUID" not in line:
                lines[i] = line.replace("from sqlalchemy import", "from sqlalchemy import UUID,")
            break
    
    new_content = "\n".join(lines)
    if new_content != content:
        file_path.write_text(new_content)
        print(f"Fixed imports: {file_path.name}")
        return True
    return False


def main():
    """Fix all model files."""
    fixed = 0
    for file_path in MODELS_DIR.glob("*.py"):
        if file_path.name == "__init__.py":
            continue
        if fix_imports(file_path):
            fixed += 1
    
    print(f"\nFixed imports in {fixed} files")


if __name__ == "__main__":
    main()
