# Legal Aid App — Quick Setup Guide

This guide covers **both development modes**: local Django auth and Supabase auth.

---

## Option A: Local Development (Django Auth)

No Supabase project required. Uses SQLite + local filesystem.

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# .env defaults are fine for local dev (DB_BACKEND=sqlite, STORAGE_BACKEND=local)
python manage.py migrate
python manage.py shell -c "
from apps.accounts.models import Profile
Profile.objects.create_user(email='advocate@legalaid.test', password='Test@123456', full_name='Adv. Rajesh Kumar', role='advocate')
Profile.objects.create_superuser(email='admin@legalaid.test', password='Admin@123456', full_name='Admin User', role='admin')
print('Users created!')
"
python manage.py runserver  # http://localhost:8000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# Ensure VITE_AUTH_MODE=django in .env
npm install
npm run dev  # http://localhost:5173
```

### 3. Test Login

- Open http://localhost:5173
- Login: `advocate@legalaid.test` / `Test@123456`
- Admin: `admin@legalaid.test` / `Admin@123456`

---

## Option B: Supabase Mode (Production-like)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com), create a project
2. Note from **Settings → API**: Project URL, Anon Key, Service Role Key, JWT Secret
3. Note from **Settings → Database**: Connection string

### 2. Backend — Migrate to Supabase Postgres

```bash
cd backend
cp .env.example .env
# Edit .env:
#   DB_BACKEND=supabase
#   DATABASE_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres
#   STORAGE_BACKEND=supabase
#   SUPABASE_URL=https://<ref>.supabase.co
#   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
#   SUPABASE_JWT_SECRET=<jwt-secret>

source venv/bin/activate
python manage.py migrate
```

### 3. Apply RLS & Storage Policies

In Supabase Dashboard → **SQL Editor**, run in order:

1. `supabase/migrations/001_create_profiles_table.sql`
2. `supabase/migrations/002_create_clients_table.sql`
3. `supabase/migrations/003_create_cases_table.sql`
4. `supabase/migrations/004_create_documents_table.sql`
5. `supabase/migrations/005_create_document_status_history_table.sql`
6. `supabase/storage-policies.sql`

See `supabase/README.md` for full details.

### 4. Create Test Users in Supabase

Go to **Authentication → Users → Add user**:

**Advocate:**
```
Email: advocate@legalaid.test
Password: Test@123456
Auto Confirm: ✅ YES
User Metadata: { "full_name": "Adv. Rajesh Kumar", "role": "advocate" }
```

**Admin:**
```
Email: admin@legalaid.test
Password: Admin@123456
Auto Confirm: ✅ YES
User Metadata: { "full_name": "Admin User", "role": "admin" }
```

The `handle_new_user()` trigger auto-creates their `accounts_profile` rows.

### 5. Verify Profiles

```sql
SELECT id, full_name, email, role FROM accounts_profile ORDER BY created_at DESC;
```

### 6. Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env:
#   VITE_AUTH_MODE=supabase
#   VITE_SUPABASE_URL=https://<ref>.supabase.co
#   VITE_SUPABASE_ANON_KEY=<anon-key>
#   VITE_API_BASE_URL=http://localhost:8000/api

npm install
npm run dev  # http://localhost:5173
```

### 7. Seed Demo Data (Optional)

Run `supabase/seed.sql` in the SQL Editor (replace placeholder UUIDs with real user IDs).

---

## Troubleshooting

**Issue:** Login fails with "Invalid credentials"
- **Fix (Django mode):** Ensure you created users with `create_user()` / `create_superuser()`.
- **Fix (Supabase mode):** Ensure "Auto Confirm User" was checked when creating users.

**Issue:** Profile not found after login
- **Fix:** Check if `handle_new_user()` trigger ran: `SELECT * FROM accounts_profile;`

**Issue:** Can't see clients/cases
- **Fix:** Data is filtered by `advocate_id`. Ensure demo data matches the logged-in user's UUID.

**Issue:** Storage upload fails
- **Fix (local):** Check `MEDIA_ROOT` directory exists and is writable.
- **Fix (supabase):** Run `storage-policies.sql` and ensure `STORAGE_BACKEND=supabase`.

---

## Test Credentials Summary

| Role     | Email                    | Password      |
|----------|--------------------------|---------------|
| Advocate | advocate@legalaid.test   | Test@123456   |
| Admin    | admin@legalaid.test      | Admin@123456  |
