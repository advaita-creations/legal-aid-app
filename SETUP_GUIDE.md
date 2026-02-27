# Legal Aid App — Quick Setup Guide

## 1. Create Test Users in Supabase

Go to your Supabase Dashboard → **Authentication** → **Users** → **Add user**

### Test Advocate Account
```
Email: advocate@legalaid.test
Password: Test@123456
Auto Confirm User: ✅ YES

User Metadata (click "Show advanced settings"):
{
  "full_name": "Adv. Rajesh Kumar",
  "role": "advocate"
}
```

### Test Admin Account
```
Email: admin@legalaid.test
Password: Admin@123456
Auto Confirm User: ✅ YES

User Metadata (click "Show advanced settings"):
{
  "full_name": "Admin User",
  "role": "admin"
}
```

**Important:** The `handle_new_user()` trigger will automatically create their profiles in the `profiles` table when you create these users.

## 2. Set Up Frontend Environment

```bash
cd frontend
cp .env.example .env
```

The `.env.example` already has your Supabase credentials. Just copy it to `.env`.

## 3. Set Up Backend Environment

```bash
cd backend
cp .env.example .env
```

Then update `backend/.env` with:
```env
SUPABASE_URL=https://fogrnfnmnqdatwnzyyla.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_JWT_SECRET=<your-jwt-secret>
```

Get these from Supabase Dashboard → **Settings** → **API**

## 4. Verify Profiles Were Created

After creating the test users, run this in Supabase SQL Editor:

```sql
SELECT id, full_name, email, role, created_at 
FROM profiles 
ORDER BY created_at DESC;
```

You should see both profiles (advocate and admin).

## 5. Seed Demo Data (Optional)

Once profiles exist, you can manually insert demo clients/cases/documents.

**Get the advocate's UUID:**
```sql
SELECT id FROM profiles WHERE email = 'advocate@legalaid.test';
```

**Then update and run this:**
```sql
-- Replace 'ADVOCATE_UUID_HERE' with the actual UUID from above query

INSERT INTO clients (advocate_id, full_name, email, phone, address, notes)
VALUES 
    ('ADVOCATE_UUID_HERE', 'Mukesh Sharma', 'mukesh@example.com', '+91-9876543211', 'Mumbai, Maharashtra', 'Property dispute case'),
    ('ADVOCATE_UUID_HERE', 'Priya Verma', 'priya@example.com', '+91-9876543212', 'Delhi, NCR', 'Bail application'),
    ('ADVOCATE_UUID_HERE', 'Anil Kapoor', 'anil@example.com', '+91-9876543213', 'Bangalore, Karnataka', 'Contract review');

-- Verify
SELECT * FROM clients;
```

## 6. Test Login

1. Start frontend: `cd frontend && npm run dev`
2. Open http://localhost:5173
3. Login with:
   - **Email:** `advocate@legalaid.test`
   - **Password:** `Test@123456`

You should be redirected to the dashboard showing "Welcome, Adv. Rajesh Kumar!"

## 7. Test Admin Access

Login with:
- **Email:** `admin@legalaid.test`
- **Password:** `Admin@123456`

Admin should also see the dashboard.

## Troubleshooting

**Issue:** Login fails with "Invalid credentials"
- **Fix:** Ensure user was created with "Auto Confirm User" enabled

**Issue:** Profile not found after login
- **Fix:** Check if `handle_new_user()` trigger ran. Query `profiles` table to verify.

**Issue:** Can't see clients/cases
- **Fix:** RLS policies require data to be owned by the logged-in user. Insert demo data with correct `advocate_id`.

---

## Test Credentials Summary

| Role     | Email                    | Password      |
|----------|--------------------------|---------------|
| Advocate | advocate@legalaid.test   | Test@123456   |
| Admin    | admin@legalaid.test      | Admin@123456  |
