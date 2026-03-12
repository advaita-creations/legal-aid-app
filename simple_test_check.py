"""Quick test stats check."""
import subprocess
import os
from pathlib import Path

print("=== Backend Tests ===\n")
os.chdir("/Users/master/Documents/Outskill Projects/legal-aid-app/backend")
result = subprocess.run(["python3", "-m", "pytest", "--tb=short", "-q"], capture_output=True, text=True, timeout=30)
print(result.stdout)
if result.stderr:
    print("Errors:", result.stderr[:500])
print(f"Exit code: {result.returncode}")

print("\n=== Frontend Tests ===\n")
os.chdir("/Users/master/Documents/Outskill Projects/legal-aid-app/frontend")
result = subprocess.run(["npm", "run", "test", "--", "--run"], capture_output=True, text=True, timeout=30)
print(result.stdout)
if result.stderr:
    print("Errors:", result.stderr[:500])
print(f"Exit code: {result.returncode}")

print("\n=== Test Files ===")
print("Backend test files:")
for f in Path("/Users/master/Documents/Outskill Projects/legal-aid-app/backend").rglob("*test*.py"):
    print(f"  {f.relative_to(Path('/Users/master/Documents/Outskill Projects/legal-aid-app/backend'))}")

print("\nFrontend test files:")
for f in Path("/Users/master/Documents/Outskill Projects/legal-aid-app/frontend/src").rglob("*.test.*"):
    print(f"  {f.relative_to(Path('/Users/master/Documents/Outskill Projects/legal-aid-app/frontend'))}")
