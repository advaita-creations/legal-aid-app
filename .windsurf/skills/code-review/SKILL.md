---
name: code-review
description: Reviews code changes for the Legal Aid App against the project's coding standards, spec compliance, test coverage, and security practices.
---

## What This Skill Does

Performs a thorough code review checking for spec compliance, code quality, test coverage, and security.

## Review Checklist

### 1. Spec Compliance

- [ ] Feature/endpoint exists in `docs/MVP_SPEC.md`
- [ ] API shape matches `docs/API_CONTRACT.md`
- [ ] Data model matches the spec (field names, types, constraints)
- [ ] Error codes and messages follow the standard error format

### 2. Frontend Code Quality

- [ ] TypeScript strict — no `any` types
- [ ] Named exports only (no default exports except lazy routes)
- [ ] shadcn/ui used for all UI primitives
- [ ] TailwindCSS utility-first — no inline styles, no CSS modules
- [ ] Forms use React Hook Form + Zod
- [ ] Server state managed with Tanstack Query
- [ ] API calls go through `src/lib/api/` — not called directly
- [ ] Icons from Lucide React only
- [ ] File under 300 lines
- [ ] Proper imports order: React/libs → components → hooks → utils/types → assets

### 3. Backend Code Quality

- [ ] Type hints on all function signatures and return types
- [ ] Google-style docstrings on views, serializers, utilities
- [ ] DRF serializers for all request/response — no raw dicts
- [ ] Permission classes used — no inline role checks
- [ ] django-environ for config — no hardcoded secrets
- [ ] django-filter for list endpoint filtering
- [ ] Pagination applied (page_size=20, max=100)
- [ ] File under 300 lines

### 4. Testing

- [ ] Tests written BEFORE implementation (TDD)
- [ ] Frontend: component renders, user interactions, error states
- [ ] Backend: happy path, validation errors, permission denials, 404s
- [ ] No skipped tests without linked issue
- [ ] External services mocked (Supabase)

### 5. Security

- [ ] No hardcoded secrets or API keys
- [ ] JWT validation on all protected endpoints
- [ ] RLS policies match permission model
- [ ] File upload validates type and size
- [ ] User input sanitized (no XSS, no SQL injection via raw queries)

### 6. Git Hygiene

- [ ] Conventional commit message (`feat:`, `fix:`, `test:`, etc.)
- [ ] No unrelated changes mixed in
- [ ] No commented-out code
- [ ] No `console.log` in production code (only `console.error` for errors)
