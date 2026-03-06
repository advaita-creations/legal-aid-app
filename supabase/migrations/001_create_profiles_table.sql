-- Legal Aid App — Profiles: RLS, Triggers & Functions
-- NOTE: The accounts_profile table is created by Django migrations.
--       Django uses the table name "accounts_profile" (app_model convention).
--       Run this AFTER `python manage.py migrate` on Supabase Postgres.

-- Enable UUID extension (idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- RLS — accounts_profile
-- ============================================================
ALTER TABLE accounts_profile ENABLE ROW LEVEL SECURITY;

-- Advocate can read own profile
CREATE POLICY "Users can read own profile"
    ON accounts_profile FOR SELECT
    USING (auth.uid() = id);

-- Advocate can update own profile (cannot change role)
CREATE POLICY "Users can update own profile"
    ON accounts_profile FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND role = (SELECT role FROM accounts_profile WHERE id = auth.uid())
    );

-- Admin can read all profiles
CREATE POLICY "Admins can read all profiles"
    ON accounts_profile FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM accounts_profile
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admin can update all profiles
CREATE POLICY "Admins can update all profiles"
    ON accounts_profile FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM accounts_profile
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================
-- Functions & Triggers
-- ============================================================

-- Reusable updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at on profile changes
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON accounts_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile when a Supabase Auth user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO accounts_profile (id, full_name, email, role, is_active, is_staff, password, last_login)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'advocate'),
        true,
        false,
        '',
        NULL
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Grants
-- ============================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON accounts_profile TO authenticated;
