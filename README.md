# Legal Aid App

> A digital workspace for advocates to upload, track, and manage client agreements through their entire lifecycle — from raw scans of handwritten, stamped, and damaged documents to fully processed digital outputs.

---

## The Problem

Advocates and lawyers manage client agreements that arrive in every imaginable physical condition — handwritten on old paper, typewritten, printed and then damaged, covered with government stamps of varying sizes, colors, and quality. Tracking these documents, digitizing them, and managing their lifecycle is painful, error-prone, and wastes billable hours.

## The Solution

**Legal Aid App** provides a clean, professional digital workspace where advocates can:

- **Upload** document scans (images & PDFs) to secure storage
- **Track** each document through a clear status pipeline: `Uploaded → Ready to Process → In Progress → Processed`
- **Manage** clients, cases, and all associated documents in one place
- **Automate** document processing via an n8n workflow backend (OCR, cleanup, classification)

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend      │────>│    Backend       │────>│   Supabase      │
│  React + Vite    │     │  Django + DRF    │     │  Auth + DB +    │
│  TailwindCSS     │     │                  │     │  Storage        │
│  shadcn/ui       │     │                  │     │                 │
└─────────────────┘     └────────┬─────────┘     └─────────────────┘
                                 │
                                 v
                        ┌─────────────────┐
                        │   n8n Workflow   │
                        │  (Document      │
                        │   Processing)   │
                        └─────────────────┘
```

### Dual-Mode Architecture

The app runs in two modes, toggled by environment variables:

| Concern | Development | Production |
|---|---|---|
| **Auth** | Django sessions (`VITE_AUTH_MODE=django`) | Supabase JWT (`VITE_AUTH_MODE=supabase`) |
| **Database** | SQLite (`DB_BACKEND=sqlite`) | Supabase Postgres (`DB_BACKEND=supabase`) |
| **Storage** | Local filesystem (`STORAGE_BACKEND=local`) | Supabase Storage (`STORAGE_BACKEND=supabase`) |

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, TypeScript (strict), TailwindCSS v4, shadcn/ui |
| **Backend** | Python 3.9+, Django 4.2 LTS, Django REST Framework |
| **Database** | SQLite (dev) / Supabase PostgreSQL (prod) |
| **Auth** | Django sessions (dev) / Supabase Auth + JWT (prod) |
| **File Storage** | Local filesystem (dev) / Supabase Storage (prod) |
| **Workflow Engine** | n8n (external, webhook integration) |
| **Frontend Deploy** | Netlify |
| **Backend Deploy** | Railway / Render |
| **Testing** | Vitest + React Testing Library (FE), pytest-django (BE) |

## Project Structure

```
legal-aid-app/
├── frontend/          # React + Vite + TypeScript app
├── backend/           # Django + DRF API server
├── supabase/          # RLS policies, triggers, seed data
├── docs/              # MVP spec, API contract
│   ├── MVP_SPEC.md    # Complete feature specification (v2.0)
│   └── API_CONTRACT.md # API endpoint reference (v2.0)
├── .windsurf/         # IDE rules, skills, and workflows
├── Makefile           # Common dev commands
└── dev.sh             # Service manager (start/stop/status)
```

See [`docs/MVP_SPEC.md`](docs/MVP_SPEC.md) for the full feature specification and [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) for the API reference.

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+

> **No Supabase project required for local development.** The app runs fully locally with Django auth + SQLite + local filesystem storage.

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver  # http://localhost:8000
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev  # http://localhost:5173
```

### Run Tests

```bash
# Frontend (24 tests)
cd frontend && npm run test

# Backend (80 tests)
cd backend && source venv/bin/activate && python -m pytest

# Both (from root)
make test
```

See [`SETUP_GUIDE.md`](SETUP_GUIDE.md) for detailed setup instructions including Supabase mode.

## Environment Variables

Create `.env` files from the provided `.env.example` templates in both `frontend/` and `backend/` directories.

| Variable | Where | Description |
|---|---|---|
| `VITE_AUTH_MODE` | Frontend | `django` (dev) or `supabase` (prod) |
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Supabase public anon key |
| `VITE_API_BASE_URL` | Frontend | Backend API URL |
| `DB_BACKEND` | Backend | `sqlite` (dev) or `supabase` (prod) |
| `STORAGE_BACKEND` | Backend | `local` (dev) or `supabase` (prod) |
| `DJANGO_SECRET_KEY` | Backend | Django secret key |
| `SUPABASE_URL` | Backend | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Supabase service role key |
| `SUPABASE_JWT_SECRET` | Backend | Supabase JWT secret |
| `DATABASE_URL` | Backend | Postgres connection string (when `DB_BACKEND=supabase`) |
| `N8N_WEBHOOK_URL` | Backend | n8n workflow URL (optional) |

## Development Approach

- **SDD (Spec Driven Development):** Every feature starts with a spec in `docs/`. No code without a spec.
- **TDD (Test Driven Development):** Every implementation starts with a failing test. Red → Green → Refactor.
- **Conventional Commits:** `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:` prefixes.

## MVP Features

1. **Auth:** Dual-mode — Django sessions (dev) or Supabase JWT (prod)
2. **Dashboard:** Document stats, file list with status filters, quick actions
3. **Clients:** CRUD with search, linked cases and documents
4. **Cases:** CRUD linked to clients, associated documents
5. **Documents:** Multipart upload (image/PDF), download URL, status lifecycle management
6. **Storage:** Abstracted backend — local filesystem or Supabase Storage
7. **Admin Panel:** System stats, advocate management
8. **Supabase RLS:** Row-level security policies for all tables + storage bucket

## License

Private — All rights reserved.
