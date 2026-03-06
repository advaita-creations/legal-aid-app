-- Legal Aid App — Demo Seed Data
-- Run this after `python manage.py migrate` and the RLS migrations.
-- NOTE: This assumes you've created test users via Supabase Auth UI first,
--       OR the handle_new_user() trigger has created profiles automatically.
--       Replace UUIDs below with real auth.users IDs from your Supabase project.

-- Insert demo advocate profile
INSERT INTO accounts_profile (id, full_name, email, role, phone, is_active, is_staff, password, last_login)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'Adv. Rajesh Kumar', 'advocate@test.com', 'advocate', '+91-9876543210', true, false, '', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert demo admin profile
INSERT INTO accounts_profile (id, full_name, email, role, phone, is_active, is_staff, password, last_login)
VALUES
    ('00000000-0000-0000-0000-000000000002', 'Admin User', 'admin@test.com', 'admin', '', true, true, '', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert demo clients
INSERT INTO clients_client (id, advocate_id, full_name, email, phone, address, notes, is_deleted, created_at, updated_at)
VALUES
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Mukesh Sharma', 'mukesh@example.com', '+91-9876543211', 'Mumbai, Maharashtra', 'Property dispute case', false, NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Priya Verma', 'priya@example.com', '+91-9876543212', 'Delhi, NCR', 'Bail application', false, NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Anil Kapoor', 'anil@example.com', '+91-9876543213', 'Bangalore, Karnataka', 'Contract review', false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert demo cases
INSERT INTO cases_case (id, client_id, advocate_id, title, case_number, description, status, created_at, updated_at)
VALUES
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Property Deed Verification', 'LA-2023-089', 'Verification of property ownership documents', 'active', NOW(), NOW()),
    ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Bail Application Draft', 'LA-2023-112', 'Preparing bail application for client', 'active', NOW(), NOW()),
    ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Contract Review', 'LA-2023-145', 'Review and digitize handwritten contract', 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert demo documents
INSERT INTO documents_document (id, case_id, advocate_id, name, file_type, mime_type, file_size_bytes, file_path, status, notes, created_at, updated_at)
VALUES
    ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Property_Deed_v2.pdf', 'pdf', 'application/pdf', 1048576, '00000000-0000-0000-0000-000000000001/20000000-0000-0000-0000-000000000001/property_deed.pdf', 'processed', 'Processed successfully', NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Bail_Application_Draft.pdf', 'pdf', 'application/pdf', 524288, '00000000-0000-0000-0000-000000000001/20000000-0000-0000-0000-000000000002/bail_app.pdf', 'in_progress', 'OCR in progress', NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Contract_Scan_098.jpg', 'image', 'image/jpeg', 2097152, '00000000-0000-0000-0000-000000000001/20000000-0000-0000-0000-000000000003/contract.jpg', 'ready_to_process', 'Awaiting processing', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Verify seed data
SELECT 'Profiles:', COUNT(*) FROM accounts_profile;
SELECT 'Clients:', COUNT(*) FROM clients_client;
SELECT 'Cases:', COUNT(*) FROM cases_case;
SELECT 'Documents:', COUNT(*) FROM documents_document;
