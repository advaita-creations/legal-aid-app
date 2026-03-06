# Supabase Setup — Legal Aid App

> **Architecture note:** Django manages all table schemas via `manage.py migrate`.
> The SQL files in `supabase/migrations/` only add Supabase-specific features that
> Django cannot manage: **RLS policies**, **triggers**, **functions**, and **grants**.

## Prerequisites

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Note your project URL and keys from **Settings → API**
3. Note the Postgres connection string from **Settings → Database**

## Step 1: Django Migrations (creates tables)

Point Django at your Supabase Postgres database:

```bash
cd backend
cp .env.example .env
# Edit .env:
#   DB_BACKEND=supabase
#   DATABASE_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres
#   SUPABASE_URL=https://<ref>.supabase.co
#   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
#   SUPABASE_JWT_SECRET=<jwt-secret>

source venv/bin/activate
python manage.py migrate
```

This creates all tables (`accounts_profile`, `clients_client`, `cases_case`,
`documents_document`, `documents_documentstatushistory`, etc.).

## Step 2: Apply RLS & Triggers

Go to your Supabase project → **SQL Editor** and run each file in order:

1. `001_create_profiles_table.sql` — RLS, `updated_at` trigger, `handle_new_user()` trigger
2. `002_create_clients_table.sql` — RLS, `updated_at` trigger
3. `003_create_cases_table.sql` — RLS, `updated_at` trigger
4. `004_create_documents_table.sql` — RLS, `updated_at` trigger
5. `005_create_document_status_history_table.sql` — RLS, status audit trigger

## Step 3: Storage Setup

1. Run `storage-policies.sql` in the SQL Editor (creates bucket + policies), **OR**:
2. Go to **Storage** → create bucket `documents` (private), then run `storage-policies.sql`

## Step 4: Seed Data (optional)

Run `seed.sql` in the SQL Editor to create demo profiles, clients, cases, and documents.

> **Important:** Replace the placeholder UUIDs with real `auth.users` IDs from your project.

## Step 5: Create Auth Users

1. Go to **Authentication** → **Users** → **Add user**
2. Create a test advocate:
   - Email: `advocate@test.com`
   - Password: `password123`
   - User Metadata: `{ "full_name": "Test Advocate", "role": "advocate" }`
3. The `handle_new_user()` trigger auto-creates their `accounts_profile` row

## Environment Variables

### Frontend (`frontend/.env`)

```env
VITE_AUTH_MODE=supabase
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_API_BASE_URL=http://localhost:8000/api
```

### Backend (`backend/.env`)

```env
DB_BACKEND=supabase
DATABASE_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres
STORAGE_BACKEND=supabase
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_JWT_SECRET=<jwt-secret>
```

## Verify Setup

```sql
-- Check tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check profiles
SELECT id, email, role, is_active FROM accounts_profile;

-- Check storage bucket
SELECT id, name, public FROM storage.buckets;
```

## Django Table → SQL Migration Mapping

| Django Table | SQL Migration File |
|---|---|
| `accounts_profile` | `001_create_profiles_table.sql` |
| `clients_client` | `002_create_clients_table.sql` |
| `cases_case` | `003_create_cases_table.sql` |
| `documents_document` | `004_create_documents_table.sql` |
| `documents_documentstatushistory` | `005_create_document_status_history_table.sql` |

## Common Issues

**Issue:** "relation already exists" when running SQL migrations
- **Fix:** The SQL files don't create tables — Django does. If you see this, you may be running an old version of the migration files.

**Issue:** RLS blocks all queries
- **Fix:** Ensure the user is authenticated via Supabase Auth and their JWT is valid. Check that policies reference the correct Django table names.

**Issue:** Storage upload fails
- **Fix:** Check bucket `documents` exists and is private. Verify `storage-policies.sql` was applied. Ensure `STORAGE_BACKEND=supabase` and `SUPABASE_SERVICE_ROLE_KEY` are set.

**Issue:** `handle_new_user()` trigger fails
- **Fix:** Ensure `accounts_profile` table exists (run `manage.py migrate` first). Check required columns: `id`, `full_name`, `email`, `role`, `is_active`, `is_staff`, `password`, `last_login`.
