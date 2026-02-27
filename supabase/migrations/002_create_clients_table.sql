-- Legal Aid App — Clients Table Migration
-- Creates the clients table for storing client information

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advocate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_clients_advocate_id ON clients(advocate_id);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_created_at ON clients(created_at DESC);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Advocates can read their own clients
CREATE POLICY "Advocates can read own clients"
    ON clients
    FOR SELECT
    USING (advocate_id = auth.uid());

-- RLS Policy: Advocates can insert their own clients
CREATE POLICY "Advocates can insert own clients"
    ON clients
    FOR INSERT
    WITH CHECK (advocate_id = auth.uid());

-- RLS Policy: Advocates can update their own clients
CREATE POLICY "Advocates can update own clients"
    ON clients
    FOR UPDATE
    USING (advocate_id = auth.uid());

-- RLS Policy: Advocates can delete their own clients
CREATE POLICY "Advocates can delete own clients"
    ON clients
    FOR DELETE
    USING (advocate_id = auth.uid());

-- RLS Policy: Admins can read all clients
CREATE POLICY "Admins can read all clients"
    ON clients
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Trigger to auto-update updated_at
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON clients TO authenticated;
