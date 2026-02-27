-- Legal Aid App — Demo Seed Data
-- Run this after applying migrations to populate demo data.
-- NOTE: This assumes you've created test users via Supabase Auth UI first.

-- Insert demo advocate profile (replace UUID with your test user's ID)
-- You can get the UUID from Supabase Dashboard → Authentication → Users
INSERT INTO profiles (id, full_name, email, role, phone, is_active)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Adv. Rajesh Kumar', 'advocate@test.com', 'advocate', '+91-9876543210', true)
ON CONFLICT (id) DO NOTHING;

-- Insert demo admin profile
INSERT INTO profiles (id, full_name, email, role, is_active)
VALUES 
    ('00000000-0000-0000-0000-000000000002', 'Admin User', 'admin@test.com', 'admin', true)
ON CONFLICT (id) DO NOTHING;

-- Insert demo clients (for the advocate)
INSERT INTO clients (id, advocate_id, full_name, email, phone, address, notes)
VALUES 
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Mukesh Sharma', 'mukesh@example.com', '+91-9876543211', 'Mumbai, Maharashtra', 'Property dispute case'),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Priya Verma', 'priya@example.com', '+91-9876543212', 'Delhi, NCR', 'Bail application'),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Anil Kapoor', 'anil@example.com', '+91-9876543213', 'Bangalore, Karnataka', 'Contract review')
ON CONFLICT (id) DO NOTHING;

-- Insert demo cases
INSERT INTO cases (id, client_id, advocate_id, title, case_number, description, status)
VALUES 
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Property Deed Verification', 'LA-2023-089', 'Verification of property ownership documents', 'active'),
    ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Bail Application Draft', 'LA-2023-112', 'Preparing bail application for client', 'active'),
    ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Contract Review', 'LA-2023-145', 'Review and digitize handwritten contract', 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert demo documents
INSERT INTO documents (id, case_id, advocate_id, name, file_type, mime_type, file_size_bytes, file_path, status, notes)
VALUES 
    ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Property_Deed_v2.pdf', 'pdf', 'application/pdf', 1048576, 'documents/advocate1/property_deed.pdf', 'processed', 'Processed successfully'),
    ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Bail_Application_Draft.pdf', 'pdf', 'application/pdf', 524288, 'documents/advocate1/bail_app.pdf', 'in_progress', 'OCR in progress'),
    ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Contract_Scan_098.jpg', 'image', 'image/jpeg', 2097152, 'documents/advocate1/contract.jpg', 'ready_to_process', 'Awaiting processing')
ON CONFLICT (id) DO NOTHING;

-- Verify seed data
SELECT 'Profiles:', COUNT(*) FROM profiles;
SELECT 'Clients:', COUNT(*) FROM clients;
SELECT 'Cases:', COUNT(*) FROM cases;
SELECT 'Documents:', COUNT(*) FROM documents;
