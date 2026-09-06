"""Fix SQLAlchemy Enum compatibility issues in model files."""

import re
from pathlib import Path

models_dir = Path(r"C:\Users\kshit\.gemini\antigravity-ide\campus-nexus\backend\app\models")
files = list(models_dir.glob("*.py"))

# Skip __init__.py
files = [f for f in files if f.name != "__init__.py"]

for filepath in files:
    content = filepath.read_text(encoding="utf-8")
    
    # Replace Enum(...) with String(...) in Column/mapped_column
    # Pattern: Column(Enum(...), ...) or mapped_column(Enum(...), ...)
    original = content
    
    # Replace Column(Enum(XXX), with Column(String(50), 
    content = re.sub(r'Column\(Enum\(([^)]+)\)(,[^)]*)?\)', r'Column(String(50))', content)
    
    # Replace mapped_column(Enum(XXX), with mapped_column(String(50), 
    content = re.sub(r'mapped_column\(Enum\(([^)]+)\)(,[^)]*)?\)', r'mapped_column(String(50))', content)
    
    if content != original:
        filepath.write_text(content, encoding="utf-8")
        print(f"Updated: {filepath.name}")
    else:
        print(f"No changes: {filepath.name}")

print("\nDone!")
