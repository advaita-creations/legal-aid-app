"""Check test stats for both frontend and backend."""
import subprocess
import json
import os
from pathlib import Path

print("=== Backend Tests (pytest-django) ===\n")
backend_dir = Path("/Users/master/Documents/Outskill Projects/legal-aid-app/backend")
os.chdir(backend_dir)

try:
    # Run pytest with coverage report
    result = subprocess.run(
        ["python3", "-m", "pytest", "--tb=short", "--cov=.", "--cov-report=json", "--cov-report=term-missing"],
        capture_output=True,
        text=True,
        timeout=60,
    )
    print("STDOUT:")
    print(result.stdout)
    if result.stderr:
        print("STDERR:")
        print(result.stderr)
    print(f"\nExit code: {result.returncode}")
    
    # Parse coverage.json if it exists
    if os.path.exists("coverage.json"):
        with open("coverage.json") as f:
            cov = json.load(f)
        total = cov["totals"]["percent_covered"]
        print(f"\nOverall coverage: {total:.1f}%")
        for f in sorted(cov["files"].keys()):
            if f.startswith("apps/") or f.startswith("utils/"):
                pct = cov["files"][f]["summary"]["percent_covered"]
                print(f"  {f}: {pct:.1f}%")
except Exception as e:
    print(f"Backend test error: {e}")

print("\n" + "="*50 + "\n")

print("=== Frontend Tests (vitest) ===\n")
frontend_dir = Path("/Users/master/Documents/Outskill Projects/legal-aid-app/frontend")
os.chdir(frontend_dir)

try:
    # Check if vitest is available
    npm_test = subprocess.run(
        ["npm", "run", "test", "--", "--run", "--reporter=json", "--outputFile=test-results.json"],
        capture_output=True,
        text=True,
        timeout=60,
    )
    print("STDOUT:")
    print(npm_test.stdout)
    if npm_test.stderr:
        print("STDERR:")
        print(npm_test.stderr)
    print(f"\nExit code: {npm_test.returncode}")
    
    # Parse test results if available
    if os.path.exists("test-results.json"):
        with open("test-results.json") as f:
            tr = json.load(f)
        if "numTotalTests" in tr:
            passed = tr["numPassedTests"]
            failed = tr["numFailedTests"]
            total = tr["numTotalTests"]
            print(f"\nFrontend tests: {passed}/{total} passed, {failed} failed")
        elif "testResults" in tr:
            # Vitest JSON format
            total = sum(len(r.get("assertionResults", [])) for r in tr["testResults"])
            passed = sum(1 for r in tr["testResults"] for a in r.get("assertionResults", []) if a["status"] == "passed")
            failed = sum(1 for r in tr["testResults"] for a in r.get("assertionResults", []) if a["status"] == "failed")
            print(f"\nFrontend tests: {passed}/{total} passed, {failed} failed")
except Exception as e:
    print(f"Frontend test error: {e}")

print("\n" + "="*50 + "\n")
print("=== Test File Inventory ===\n")

# List test files
print("Backend test files:")
for f in backend_dir.rglob("*test*.py"):
    rel = f.relative_to(backend_dir)
    print(f"  {rel}")

print("\nFrontend test files:")
for f in frontend_dir.rglob("*.test.tsx"):
    rel = f.relative_to(frontend_dir)
    print(f"  {rel}")
for f in frontend_dir.rglob("*.test.ts"):
    rel = f.relative_to(frontend_dir)
    print(f"  {rel}")
