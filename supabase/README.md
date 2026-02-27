# Supabase Setup — Legal Aid App

## Prerequisites

1. Create a Supabase project at https://supabase.com
2. Note your project URL and keys from Settings → API

## Database Setup

### Option 1: Using Supabase Dashboard (Recommended for MVP)

1. Go to your Supabase project → **SQL Editor**
2. Run each migration file in order:
   - `001_create_profiles_table.sql`
   - `002_create_clients_table.sql`
   - `003_create_cases_table.sql`
   - `004_create_documents_table.sql`
   - `005_create_document_status_history_table.sql`

3. After migrations, run `seed.sql` to create demo data

### Option 2: Using Supabase CLI (For Production)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push

# Run seed data
supabase db seed
```

## Storage Setup

1. Go to **Storage** in Supabase dashboard
2. Create a new bucket named `documents`
3. Set it to **Private** (not public)
4. Run the policies from `storage-policies.sql` in SQL Editor

## Environment Variables

After setup, update your `.env` files:

### Frontend (`frontend/.env`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=http://localhost:8000/api
```

### Backend (`backend/.env`)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

## Testing Auth

1. Go to **Authentication** → **Users** in Supabase dashboard
2. Click **Add user** → **Create new user**
3. Create a test advocate:
   - Email: `advocate@test.com`
   - Password: `password123`
   - User Metadata (JSON):
     ```json
     {
       "full_name": "Test Advocate",
       "role": "advocate"
     }
     ```

4. The `handle_new_user()` trigger will auto-create their profile

## Verify Setup

Run these queries in SQL Editor to verify:

```sql
-- Check profiles table
SELECT * FROM profiles;

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public';

-- Test advocate can see own profile
SET request.jwt.claims.sub = 'user-uuid-here';
SELECT * FROM profiles WHERE id = auth.uid();
```

## Common Issues

**Issue:** Migrations fail with "relation already exists"
- **Fix:** Drop tables and re-run, or use `CREATE TABLE IF NOT EXISTS`

**Issue:** RLS blocks all queries
- **Fix:** Ensure you're authenticated and policies match your user's role

**Issue:** Storage upload fails
- **Fix:** Check bucket exists, is private, and RLS policies are applied
