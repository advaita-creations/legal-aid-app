-- Legal Aid App — Document Status History Table Migration
-- Tracks all status changes for documents (audit trail)

CREATE TABLE document_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    from_status document_status,
    to_status document_status NOT NULL,
    changed_by UUID NOT NULL REFERENCES profiles(id),
    notes TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_document_status_history_document_id ON document_status_history(document_id);
CREATE INDEX idx_document_status_history_changed_at ON document_status_history(changed_at DESC);

-- Enable Row Level Security
ALTER TABLE document_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Advocates can read status history for their own documents
CREATE POLICY "Advocates can read own document status history"
    ON document_status_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM documents
            WHERE documents.id = document_status_history.document_id
            AND documents.advocate_id = auth.uid()
        )
    );

-- RLS Policy: System can insert status history (via trigger)
CREATE POLICY "System can insert status history"
    ON document_status_history
    FOR INSERT
    WITH CHECK (true);

-- RLS Policy: Admins can read all status history
CREATE POLICY "Admins can read all status history"
    ON document_status_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to log document status changes
CREATE OR REPLACE FUNCTION log_document_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO document_status_history (document_id, from_status, to_status, changed_by, notes)
        VALUES (NEW.id, OLD.status, NEW.status, auth.uid(), NEW.notes);
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO document_status_history (document_id, from_status, to_status, changed_by, notes)
        VALUES (NEW.id, NULL, NEW.status, auth.uid(), NEW.notes);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-log status changes
CREATE TRIGGER log_document_status_changes
    AFTER INSERT OR UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION log_document_status_change();

-- Grant permissions
GRANT SELECT ON document_status_history TO authenticated;
GRANT INSERT ON document_status_history TO authenticated;
