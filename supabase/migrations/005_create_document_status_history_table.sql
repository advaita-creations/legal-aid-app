-- Legal Aid App — Document Status History: RLS & Triggers
-- NOTE: The documents_documentstatushistory table is created by Django migrations.
--       Run this AFTER `python manage.py migrate` on Supabase Postgres.

-- ============================================================
-- RLS — documents_documentstatushistory
-- ============================================================
ALTER TABLE documents_documentstatushistory ENABLE ROW LEVEL SECURITY;

-- Advocates can read status history for their own documents
CREATE POLICY "Advocates can read own document status history"
    ON documents_documentstatushistory FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM documents_document
            WHERE documents_document.id = documents_documentstatushistory.document_id
            AND documents_document.advocate_id = auth.uid()
        )
    );

-- Authenticated users can insert status history (Django handles this via API)
CREATE POLICY "Authenticated can insert status history"
    ON documents_documentstatushistory FOR INSERT
    WITH CHECK (true);

-- Admins can read all status history
CREATE POLICY "Admins can read all status history"
    ON documents_documentstatushistory FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM accounts_profile
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================
-- Functions & Triggers
-- ============================================================

-- DISABLED: Django handles status history logging via the API layer.
-- The trigger below conflicts with Django's bigint auto-increment PK
-- (it tries to insert gen_random_uuid() into a bigint column).
-- If you need DB-level logging, alter the id column to UUID first.
--
-- CREATE OR REPLACE FUNCTION log_document_status_change() ...
-- CREATE TRIGGER log_document_status_changes ...

-- ============================================================
-- Grants
-- ============================================================
GRANT SELECT ON documents_documentstatushistory TO authenticated;
GRANT INSERT ON documents_documentstatushistory TO authenticated;
