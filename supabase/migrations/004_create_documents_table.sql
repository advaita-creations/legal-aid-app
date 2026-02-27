-- Legal Aid App — Documents Table Migration
-- Creates the documents table for tracking uploaded legal documents

CREATE TYPE document_status AS ENUM ('uploaded', 'ready_to_process', 'in_progress', 'processed');
CREATE TYPE document_file_type AS ENUM ('image', 'pdf');

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    advocate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_type document_file_type NOT NULL,
    mime_type TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    status document_status NOT NULL DEFAULT 'uploaded',
    notes TEXT,
    processed_output_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_file_size CHECK (file_size_bytes > 0 AND file_size_bytes <= 20971520)
);

-- Create indexes
CREATE INDEX idx_documents_case_id ON documents(case_id);
CREATE INDEX idx_documents_advocate_id ON documents(advocate_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Advocates can read their own documents
CREATE POLICY "Advocates can read own documents"
    ON documents
    FOR SELECT
    USING (advocate_id = auth.uid());

-- RLS Policy: Advocates can insert their own documents
CREATE POLICY "Advocates can insert own documents"
    ON documents
    FOR INSERT
    WITH CHECK (advocate_id = auth.uid());

-- RLS Policy: Advocates can update their own documents
CREATE POLICY "Advocates can update own documents"
    ON documents
    FOR UPDATE
    USING (advocate_id = auth.uid());

-- RLS Policy: Advocates can delete their own documents
CREATE POLICY "Advocates can delete own documents"
    ON documents
    FOR DELETE
    USING (advocate_id = auth.uid());

-- RLS Policy: Admins can read all documents
CREATE POLICY "Admins can read all documents"
    ON documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Trigger to auto-update updated_at
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON documents TO authenticated;
