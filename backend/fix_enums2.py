"""Fix remaining SQLAlchemy Enum compatibility issues."""

import re
from pathlib import Path

models_dir = Path(r"C:\Users\kshit\.gemini\antigravity-ide\campus-nexus\backend\app\models")
files = list(models_dir.glob("*.py"))
files = [f for f in files if f.name != "__init__.py"]

for filepath in files:
    content = filepath.read_text(encoding="utf-8")
    original = content
    
    # Pattern: Enum(SomeEnum), default=SomeEnum.VALUE, ...
    # Replace with String(50)
    content = re.sub(
        r'Enum\(([A-Z][a-zA-Z0-9_]*)\)(,\s*default=[A-Z][a-zA-Z0-9_]*\.[A-Z][a-zA-Z0-9_]*)?(,\s*nullable=[a-zA-Z]*)?(,\s*index=[a-zA-Z]*)?',
        r'String(50)\2\3\4',
        content
    )
    
    if content != original:
        filepath.write_text(content, encoding="utf-8")
        print(f"Updated: {filepath.name}")
    else:
        print(f"No changes: {filepath.name}")

print("\nDone!")
