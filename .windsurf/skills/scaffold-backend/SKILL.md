---
name: scaffold-backend
description: Scaffolds the complete Django backend project with DRF, Supabase integration, and all required apps following the Legal Aid App project structure.
---

## What This Skill Does

Sets up the entire `backend/` directory from scratch with Django + DRF, ready for API development.

## Steps

1. **Create Django project** using `django-admin startproject config backend/`

2. **Create Django apps** inside `backend/apps/`:
   - `accounts` — User profiles, auth middleware
   - `clients` — Client CRUD
   - `cases` — Case CRUD
   - `documents` — Document CRUD, upload, status management
   - `webhooks` — n8n webhook endpoint

3. **Install dependencies** (pinned in `requirements.txt`):
   - `django>=5.0` — Web framework
   - `djangorestframework` — REST API
   - `django-cors-headers` — CORS
   - `django-environ` — Environment variables
   - `django-filter` — Queryset filtering
   - `supabase` — Supabase Python client
   - `PyJWT` — JWT verification
   - `gunicorn` — Production server
   - `pytest-django` — Testing
   - `pytest-cov` — Coverage
   - `httpx` — HTTP test client
   - `flake8` — Linting

4. **Configure settings** split into `config/settings/`:
   - `base.py` — Common settings, installed apps, middleware, DRF config
   - `development.py` — DEBUG=True, permissive CORS
   - `production.py` — DEBUG=False, strict CORS, security headers

5. **Create utility modules** in `backend/utils/`:
   - `supabase_client.py` — Single Supabase client instance
   - `permissions.py` — `IsAdvocate`, `IsAdmin`, `IsOwner` permission classes
   - `pagination.py` — `StandardPagination` (page_size=20, max=100)

6. **Create config files:**
   - `requirements.txt` with pinned versions
   - `.env.example` with all env vars documented
   - `Dockerfile` for production deployment
   - `pytest.ini` or `pyproject.toml` test config

7. **Setup URL routing:**
   - `config/urls.py` with DRF router, health-check endpoint
   - Each app gets its own `urls.py`

## Rules to Follow

- Python 3.11+ required
- Type hints on all function signatures
- Google-style docstrings on all views, serializers, utilities
- snake_case for files/variables, PascalCase for classes
- DRF serializers for all request/response — never return raw dicts
- django-environ for all config — no hardcoded secrets
- One Django app per domain entity
