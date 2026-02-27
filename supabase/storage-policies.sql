-- Legal Aid App — Supabase Storage Bucket Policies
-- Apply these via Supabase SQL Editor after creating the 'documents' bucket.

-- Create the documents bucket (private)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Policy: Advocates can upload to their own folder
-- CREATE POLICY "Advocates can upload own documents"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'documents'
--   AND auth.uid()::text = (storage.foldername(name))[1]
-- );

-- Policy: Advocates can read their own documents
-- CREATE POLICY "Advocates can read own documents"
-- ON storage.objects FOR SELECT
-- USING (
--   bucket_id = 'documents'
--   AND auth.uid()::text = (storage.foldername(name))[1]
-- );

-- Policy: Advocates can delete their own documents
-- CREATE POLICY "Advocates can delete own documents"
-- ON storage.objects FOR DELETE
-- USING (
--   bucket_id = 'documents'
--   AND auth.uid()::text = (storage.foldername(name))[1]
-- );

-- NOTE: These policies will be uncommented and refined during Phase 4 (Document Upload).
-- Admin access policies will be added separately.
