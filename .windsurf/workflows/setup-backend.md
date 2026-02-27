---
description: Scaffold and run the Django backend dev server
---

# Setup Backend

## Prerequisites

- Python 3.11+ installed
- `pip` and `venv` available

## Steps

1. Navigate to the backend directory: `cd backend`

2. Create and activate a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file from template:
// turbo
```bash
cp .env.example .env
```

5. Fill in the `.env` file with your Supabase credentials and a Django secret key.

6. Run migrations:
```bash
python manage.py migrate
```

7. Create a superuser (optional, for Django admin):
```bash
python manage.py createsuperuser
```

8. Start the dev server:
```bash
python manage.py runserver
```

The backend should be running at `http://localhost:8000`.

9. Verify health check:
// turbo
```bash
curl http://localhost:8000/api/health/
```

## Key Dependencies (requirements.txt)

| Package | Purpose |
|---|---|
| `django` | Web framework |
| `djangorestframework` | REST API toolkit |
| `django-cors-headers` | CORS handling |
| `django-environ` | Environment variable management |
| `django-filter` | Queryset filtering |
| `supabase` | Supabase Python client (auth, storage) |
| `gunicorn` | Production WSGI server |
| `pytest-django` | Testing framework |
| `httpx` | HTTP client for tests |

## Environment Variables

| Variable | Description |
|---|---|
| `DJANGO_SECRET_KEY` | Django secret key |
| `DJANGO_DEBUG` | `True` for development |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated allowed hosts |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (backend only) |
| `SUPABASE_JWT_SECRET` | Supabase JWT secret for token verification |
| `N8N_WEBHOOK_URL` | n8n workflow webhook URL (optional) |
| `N8N_WEBHOOK_SECRET` | Shared secret for n8n inbound webhooks |
| `DATABASE_URL` | Supabase Postgres connection string |
| `CORS_ALLOWED_ORIGINS` | Frontend URL(s) |
