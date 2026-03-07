-- Legal Aid App — Supabase Storage Bucket Policies
-- Apply these via Supabase SQL Editor after creating the 'documents' bucket.
--
-- Prerequisites:
--   1. Go to Storage → New Bucket → Name: "documents", Private: ON
--   2. Then run this SQL in the SQL Editor.

-- ============================================================
-- Create bucket (idempotent)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Policies
-- ============================================================

-- Service role (backend) can upload any documents
CREATE POLICY "Service role can upload documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'documents'
        AND auth.role() = 'service_role'
    );

-- Advocates can upload to their own folder (<advocate_uuid>/...)
CREATE POLICY "Advocates can upload own documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Advocates can read/download their own documents
CREATE POLICY "Advocates can read own documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Advocates can update (overwrite) their own documents
CREATE POLICY "Advocates can update own documents"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Advocates can delete their own documents
CREATE POLICY "Advocates can delete own documents"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Admins can read all documents in the bucket
CREATE POLICY "Admins can read all documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'documents'
        AND EXISTS (
            SELECT 1 FROM accounts_profile
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can delete any document in the bucket
CREATE POLICY "Admins can delete all documents"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'documents'
        AND EXISTS (
            SELECT 1 FROM accounts_profile
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
