---
name: run-tests
description: Runs the frontend and/or backend test suites for the Legal Aid App, following TDD practices with Vitest (frontend) and pytest-django (backend).
---

## What This Skill Does

Executes tests and reports results. Supports running all tests, specific app tests, or single test files.

## Frontend Tests (Vitest + React Testing Library)

```bash
cd frontend

# Run all tests
npm run test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific file
npx vitest run src/features/auth/components/LoginForm.test.tsx
```

## Backend Tests (pytest-django)

```bash
cd backend
source venv/bin/activate

# Run all tests
pytest

# Verbose output
pytest -v

# Specific app
pytest apps/accounts/tests/

# With coverage
pytest --cov=apps --cov-report=term-missing

# Specific test file
pytest apps/clients/tests/test_views.py
```

## TDD Workflow

Always follow this cycle:

1. **Red** — Write a failing test for the feature or fix
2. **Green** — Write the minimum code to make the test pass
3. **Refactor** — Clean up while keeping tests green

**Never skip step 1.** Tests are written BEFORE implementation code.

## Test Patterns

### Frontend Component Test

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Backend API Test

```python
import pytest
from rest_framework import status

@pytest.mark.django_db
class TestClientViewSet:
    def test_list_clients_returns_200(self, authenticated_client):
        response = authenticated_client.get("/api/clients/")
        assert response.status_code == status.HTTP_200_OK

    def test_create_client_requires_auth(self, api_client):
        response = api_client.post("/api/clients/", {})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
```

## Rules

- No skipping tests. No `@pytest.mark.skip` without a linked issue.
- No `console.log` in test files — use assertions.
- Test edge cases: empty states, validation errors, permission denials.
- Mock external services (Supabase) — never hit real APIs in tests.
