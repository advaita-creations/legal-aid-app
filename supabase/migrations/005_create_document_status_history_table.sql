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

-- Optional: auto-log status changes at the DB level.
-- NOTE: Django already logs status changes via the API layer.
--       This trigger is a safety net for direct DB updates.
CREATE OR REPLACE FUNCTION log_document_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO documents_documentstatushistory
            (id, document_id, from_status, to_status, changed_by_id, notes, changed_at)
        VALUES (
            gen_random_uuid(), NEW.id, OLD.status, NEW.status,
            auth.uid(), COALESCE(NEW.notes, ''), NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_document_status_changes
    AFTER UPDATE ON documents_document
    FOR EACH ROW
    EXECUTE FUNCTION log_document_status_change();

-- ============================================================
-- Grants
-- ============================================================
GRANT SELECT ON documents_documentstatushistory TO authenticated;
GRANT INSERT ON documents_documentstatushistory TO authenticated;
