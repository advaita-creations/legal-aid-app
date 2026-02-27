# Legal Aid App

> A digital workspace for advocates to upload, track, and manage client agreements through their entire lifecycle — from raw scans of handwritten, stamped, and damaged documents to fully processed digital outputs.

---

## The Problem

Advocates and lawyers manage client agreements that arrive in every imaginable physical condition — handwritten on old paper, typewritten, printed and then damaged, covered with government stamps of varying sizes, colors, and quality. Tracking these documents, digitizing them, and managing their lifecycle is painful, error-prone, and wastes billable hours.

## The Solution

**Legal Aid App** provides a clean, professional digital workspace where advocates can:

- **Upload** document scans (images & PDFs) to a secure cloud
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

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, TailwindCSS, shadcn/ui |
| **Backend** | Python 3.11+, Django 5, Django REST Framework |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (email/password) |
| **File Storage** | Supabase Storage |
| **Workflow Engine** | n8n (external, webhook integration) |
| **Frontend Deploy** | Netlify |
| **Backend Deploy** | Railway / Render |
| **Testing** | Vitest + React Testing Library (FE), pytest-django (BE) |

## Project Structure

```
legal-aid-app/
├── frontend/          # React + Vite + TypeScript app
├── backend/           # Django + DRF API server
├── supabase/          # DB migrations, seed data, RLS policies
├── docs/              # MVP spec, API contract
│   ├── MVP_SPEC.md    # Complete feature specification
│   └── API_CONTRACT.md # API endpoint reference
├── .windsurf/         # IDE rules and workflows
└── Makefile           # Common dev commands
```

See [`docs/MVP_SPEC.md`](docs/MVP_SPEC.md) for the full feature specification and [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) for the API reference.

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- A Supabase project ([supabase.com](https://supabase.com))

### Frontend

```bash
cd frontend
cp .env.example .env   # Fill in Supabase credentials
npm install
npm run dev            # http://localhost:5173
```

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # Fill in Supabase + Django credentials
python manage.py migrate
python manage.py runserver  # http://localhost:8000
```

### Run Tests

```bash
# Frontend
cd frontend && npm run test

# Backend
cd backend && source venv/bin/activate && pytest

# Both (from root)
make test
```

## Environment Variables

Create `.env` files from the provided `.env.example` templates in both `frontend/` and `backend/` directories. Key variables:

| Variable | Where | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Supabase public anon key |
| `VITE_API_BASE_URL` | Frontend | Backend API URL |
| `DJANGO_SECRET_KEY` | Backend | Django secret key |
| `SUPABASE_URL` | Backend | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Supabase service role key |
| `DATABASE_URL` | Backend | Supabase Postgres connection string |
| `N8N_WEBHOOK_URL` | Backend | n8n workflow URL (optional) |

## Development Approach

- **SDD (Spec Driven Development):** Every feature starts with a spec in `docs/`. No code without a spec.
- **TDD (Test Driven Development):** Every implementation starts with a failing test. Red → Green → Refactor.
- **Conventional Commits:** `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:` prefixes.

## MVP Features

1. **Auth:** Advocate & Admin login/logout (Supabase email/password)
2. **Dashboard:** Document stats, file list with status filters, quick actions
3. **Clients:** CRUD with search, linked cases and documents
4. **Cases:** CRUD linked to clients, associated documents
5. **Documents:** Upload (image/PDF), preview, status lifecycle management
6. **Admin Panel:** System stats, advocate management

## License

Private — All rights reserved.
