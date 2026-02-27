# Troubleshooting — Database Error Querying Schema

## Issue: "Database error querying schema"

This means the `profiles` table doesn't exist or the user doesn't have access to it.

## Fix: Run Migrations in Supabase SQL Editor

Go to your Supabase Dashboard → **SQL Editor** → **New query**

Run each migration **in order**:

### 1. Create Profiles Table (REQUIRED)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('advocate', 'admin');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'advocate',
    is_active BOOLEAN NOT NULL DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
    ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- RLS Policy: Users can update their own profile (except role)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
    ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    );

-- RLS Policy: Admins can read all profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles"
    ON profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policy: Admins can update all profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles"
    ON profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on profile changes
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'advocate')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON profiles TO authenticated;
```

### 2. Manually Create Profile for Existing User

Since you created the user via SQL before the trigger existed, manually create their profile:

```sql
-- Get the user ID first
SELECT id, email FROM auth.users WHERE email = 'advocate@legalaid.test';

-- Then insert profile (replace USER_ID_HERE with the actual UUID from above)
INSERT INTO profiles (id, full_name, email, role, phone, is_active)
VALUES (
    'USER_ID_HERE',
    'Adv. Rajesh Kumar',
    'advocate@legalaid.test',
    'advocate',
    '+91-9876543210',
    true
)
ON CONFLICT (id) DO NOTHING;
```

### 3. Verify It Worked

```sql
-- Check profiles table exists
SELECT * FROM profiles;

-- Check RLS policies
SELECT tablename, policyname FROM pg_policies WHERE tablename = 'profiles';

-- Check triggers
SELECT tgname FROM pg_trigger WHERE tgrelid = 'profiles'::regclass;
```

## After Running Migrations

1. Refresh the login page: http://localhost:5173
2. Try logging in again with `advocate@legalaid.test` / `Test@123456`
3. Should redirect to dashboard successfully

## Still Having Issues?

Run this diagnostic query:

```sql
-- Check if user exists
SELECT id, email, raw_user_meta_data FROM auth.users WHERE email = 'advocate@legalaid.test';

-- Check if profile exists
SELECT * FROM profiles WHERE email = 'advocate@legalaid.test';

-- Check if you can query as that user (simulate auth)
SET request.jwt.claims.sub = 'USER_ID_HERE';
SELECT * FROM profiles WHERE id = auth.uid();
```
