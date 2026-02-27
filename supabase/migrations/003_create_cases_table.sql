-- Legal Aid App — Cases Table Migration
-- Creates the cases table for storing case information

CREATE TYPE case_status AS ENUM ('active', 'closed', 'archived');

CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    advocate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    case_number TEXT NOT NULL UNIQUE,
    description TEXT,
    status case_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_cases_client_id ON cases(client_id);
CREATE INDEX idx_cases_advocate_id ON cases(advocate_id);
CREATE INDEX idx_cases_case_number ON cases(case_number);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_created_at ON cases(created_at DESC);

-- Enable Row Level Security
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Advocates can read their own cases
CREATE POLICY "Advocates can read own cases"
    ON cases
    FOR SELECT
    USING (advocate_id = auth.uid());

-- RLS Policy: Advocates can insert their own cases
CREATE POLICY "Advocates can insert own cases"
    ON cases
    FOR INSERT
    WITH CHECK (advocate_id = auth.uid());

-- RLS Policy: Advocates can update their own cases
CREATE POLICY "Advocates can update own cases"
    ON cases
    FOR UPDATE
    USING (advocate_id = auth.uid());

-- RLS Policy: Advocates can delete their own cases
CREATE POLICY "Advocates can delete own cases"
    ON cases
    FOR DELETE
    USING (advocate_id = auth.uid());

-- RLS Policy: Admins can read all cases
CREATE POLICY "Admins can read all cases"
    ON cases
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Trigger to auto-update updated_at
CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON cases TO authenticated;
