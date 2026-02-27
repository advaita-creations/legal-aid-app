---
trigger: always_on
---

# Code Style Guide — Legal Aid App

## General

- **SDD First:** Never write implementation code without a corresponding spec in `docs/MVP_SPEC.md` or `docs/API_CONTRACT.md`. If the spec is missing, write it first.
- **TDD Always:** Write failing tests before implementation. No exceptions.
- **Conventional Commits:** `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:` prefixes.
- **No hardcoded secrets:** All secrets and config via environment variables. Use `.env` files locally (never committed).
- **Error handling:** Always handle errors explicitly. No silent catches. User-facing errors must be human-readable.
- **Logging:** Use structured logging. Backend: Python `logging` module. Frontend: `console.error` for errors only (no `console.log` in production code).
- **No `any` type:** TypeScript `any` is forbidden. Use `unknown` + type guards if the type is truly dynamic.
- **File naming:** `kebab-case` for files and folders. Exception: React components use `PascalCase.tsx`.
- **Max file length:** 300 lines. If a file exceeds this, refactor into smaller modules.

## Frontend (React + TypeScript + TailwindCSS + shadcn/ui)

- **TypeScript strict mode** enabled (`"strict": true` in `tsconfig.json`).
- **Functional components only.** No class components.
- **Named exports only.** No default exports (except for lazy-loaded route components).
- **Barrel exports:** Each feature folder has an `index.ts` re-exporting its public API.
- **shadcn/ui for all UI primitives:** Buttons, inputs, dialogs, dropdowns, tables, badges, cards, toasts — always use shadcn/ui. Do not create custom primitives.
- **TailwindCSS utility-first:** No inline `style={}` props. No CSS modules. No styled-components. Only Tailwind classes + `cn()` utility for conditional classes.
- **Zod for validation:** All form schemas defined with Zod. Shared between frontend validation and API request typing.
- **React Hook Form** for all forms, integrated with Zod resolvers.
- **State management:** React Context + `useReducer` for auth/global state. Tanstack Query (React Query) for server state. No Redux.
- **API calls:** Centralized in `src/lib/api/` using a configured Axios instance. Never call `fetch` or Axios directly in components.
- **Folder structure per feature:**
  ```
  src/features/<feature>/
    components/     # Feature-specific components
    hooks/          # Feature-specific hooks
    api/            # Feature-specific API calls
    types.ts        # Feature-specific types
    index.ts        # Barrel export
  ```
- **Test files:** Co-located with source — `ComponentName.test.tsx` next to `ComponentName.tsx`.
- **Imports order:** (1) React/libraries, (2) components, (3) hooks, (4) utils/types, (5) assets. Separated by blank lines.
- **Lucide React** for all icons. No other icon libraries.

## Backend (Django + Django REST Framework)

- **Python 3.9+** required (3.9.6 on dev machine; Django 4.2 LTS).
- **Type hints** on all function signatures and return types.
- **Docstrings** on all views, serializers, and utility functions (Google style).
- **snake_case** for variables, functions, files. **PascalCase** for classes.
- **Django apps:** One app per domain — `accounts`, `clients`, `cases`, `documents`, `webhooks`.
- **DRF serializers** for all request/response serialization. Never return raw dicts from views.
- **DRF ViewSets + Routers** for standard CRUD. Custom `@action` for non-CRUD endpoints.
- **Permissions:** Custom permission classes (`IsAdvocate`, `IsAdmin`, `IsOwner`) — never check roles inline in views.
- **django-environ** for all configuration. Settings split: `base.py`, `development.py`, `production.py`.
- **Auth:** Django session-based auth for MVP. Supabase client reserved for production storage/DB.
- **Migrations:** Always create migrations for model changes. Never modify migration files manually after creation.
- **Tests:** Use `pytest-django` with fixtures. Test files in `tests/` directory per app.
- **API versioning:** URL prefix `/api/` (no version prefix for MVP; add `/api/v1/` post-MVP).
- **Pagination:** `PageNumberPagination` with `page_size=20`, `max_page_size=100`.
- **Filtering:** Use `django-filter` for queryset filtering in list views.
- **CORS:** Configured via `django-cors-headers`. Allowed origins set per environment.
