-- Legal Aid App — Clients: RLS & Triggers
-- NOTE: The clients_client table is created by Django migrations.
--       Run this AFTER `python manage.py migrate` on Supabase Postgres.

-- ============================================================
-- RLS — clients_client
-- ============================================================
ALTER TABLE clients_client ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Advocates can read own clients"
    ON clients_client FOR SELECT
    USING (advocate_id = auth.uid());

CREATE POLICY "Advocates can insert own clients"
    ON clients_client FOR INSERT
    WITH CHECK (advocate_id = auth.uid());

CREATE POLICY "Advocates can update own clients"
    ON clients_client FOR UPDATE
    USING (advocate_id = auth.uid());

CREATE POLICY "Advocates can delete own clients"
    ON clients_client FOR DELETE
    USING (advocate_id = auth.uid());

CREATE POLICY "Admins can read all clients"
    ON clients_client FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM accounts_profile
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================
-- Triggers
-- ============================================================
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients_client
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Grants
-- ============================================================
GRANT ALL ON clients_client TO authenticated;
