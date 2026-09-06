"""Add missing uuid imports to model files."""

from pathlib import Path

models_dir = Path(r"C:\Users\kshit\.gemini\antigravity-ide\campus-nexus\backend\app\models")
files = list(models_dir.glob("*.py"))
files = [f for f in files if f.name != "__init__.py"]

for filepath in files:
    content = filepath.read_text(encoding="utf-8")
    
    # Check if file uses uuid.UUID but doesn't import uuid
    if "uuid.UUID" in content and "import uuid" not in content:
        # Add import uuid after the last import statement
        lines = content.split("\n")
        last_import_idx = 0
        for i, line in enumerate(lines):
            if line.startswith("import ") or line.startswith("from "):
                last_import_idx = i
        
        lines.insert(last_import_idx + 1, "import uuid")
        content = "\n".join(lines)
        filepath.write_text(content, encoding="utf-8")
        print(f"Added uuid import: {filepath.name}")
    else:
        print(f"OK: {filepath.name}")

print("\nDone!")
