---
description: Run frontend and backend test suites
---

# Run Tests

## Frontend Tests (Vitest + React Testing Library)

1. Navigate to `frontend/`

2. Run all tests:
// turbo
```bash
npm run test
```

3. Run tests in watch mode (during development):
```bash
npm run test:watch
```

4. Run tests with coverage:
```bash
npm run test:coverage
```

5. Run a specific test file:
```bash
npx vitest run src/features/auth/components/LoginForm.test.tsx
```

## Backend Tests (pytest-django)

1. Navigate to `backend/`

2. Activate the virtual environment:
```bash
source venv/bin/activate
```

3. Run all tests:
// turbo
```bash
pytest
```

4. Run tests with verbose output:
```bash
pytest -v
```

5. Run tests for a specific app:
```bash
pytest apps/accounts/tests/
```

6. Run tests with coverage:
```bash
pytest --cov=apps --cov-report=term-missing
```

## Full Suite (via Makefile)

From the project root:

// turbo
```bash
make test
```

This runs both frontend and backend tests sequentially.

## TDD Workflow Reminder

1. **Red:** Write a failing test for the feature/fix
2. **Green:** Write the minimum code to make the test pass
3. **Refactor:** Clean up the code while keeping tests green

Never skip step 1. Tests are written BEFORE implementation code.
