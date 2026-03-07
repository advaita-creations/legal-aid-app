-- Legal Aid App — Cases: RLS & Triggers
-- NOTE: The cases_case table is created by Django migrations.
--       Run this AFTER `python manage.py migrate` on Supabase Postgres.

-- ============================================================
-- RLS — cases_case
-- ============================================================
ALTER TABLE cases_case ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Advocates can read own cases"
    ON cases_case FOR SELECT
    USING (advocate_id = auth.uid());

CREATE POLICY "Advocates can insert own cases"
    ON cases_case FOR INSERT
    WITH CHECK (advocate_id = auth.uid());

CREATE POLICY "Advocates can update own cases"
    ON cases_case FOR UPDATE
    USING (advocate_id = auth.uid());

CREATE POLICY "Advocates can delete own cases"
    ON cases_case FOR DELETE
    USING (advocate_id = auth.uid());

CREATE POLICY "Admins can read all cases"
    ON cases_case FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM accounts_profile
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================
-- Triggers
-- ============================================================
CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON cases_case
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Grants
-- ============================================================
GRANT ALL ON cases_case TO authenticated;
