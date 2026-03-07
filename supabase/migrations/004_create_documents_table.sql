-- Legal Aid App — Documents: RLS & Triggers
-- NOTE: The documents_document table is created by Django migrations.
--       Run this AFTER `python manage.py migrate` on Supabase Postgres.

-- ============================================================
-- RLS — documents_document
-- ============================================================
ALTER TABLE documents_document ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Advocates can read own documents"
    ON documents_document FOR SELECT
    USING (advocate_id = auth.uid());

CREATE POLICY "Advocates can insert own documents"
    ON documents_document FOR INSERT
    WITH CHECK (advocate_id = auth.uid());

CREATE POLICY "Advocates can update own documents"
    ON documents_document FOR UPDATE
    USING (advocate_id = auth.uid());

CREATE POLICY "Advocates can delete own documents"
    ON documents_document FOR DELETE
    USING (advocate_id = auth.uid());

CREATE POLICY "Admins can read all documents"
    ON documents_document FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM accounts_profile
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================
-- Triggers
-- ============================================================
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents_document
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Grants
-- ============================================================
GRANT ALL ON documents_document TO authenticated;
