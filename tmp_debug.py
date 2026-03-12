"""Debug: Check document 10 status and manually trigger n8n if needed."""
import httpx
import requests
import json

BASE = "https://legal-aid-app-production.up.railway.app"
SUPABASE_URL = "https://unzeltkntvjddrutdjcp.supabase.co"
SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuemVsdGtudHZqZGRydXRkamNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MjI2MzgsImV4cCI6MjA4ODM5ODYzOH0.x8Hrb4uGWtqJqhOPb_jBDOe2JQGiewupH5QyvzAA2Po"
SUPABASE_SERVICE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuemVsdGtudHZqZGRydXRkamNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgyMjYzOCwiZXhwIjoyMDg4Mzk4NjM4fQ.24hDD1uj1SrDU1ExPB8Lar7nMLX5SMqeILSjanKA168"
N8N_URL = "https://n8n.lotlikar.net/webhook/80935175-df06-4394-a0e6-8bc25d5c9c83"

# 1. Login
from supabase import create_client
sb = create_client(SUPABASE_URL, SUPABASE_ANON)
auth = sb.auth.sign_in_with_password({"email": "advocate@legalaid.test", "password": "Test@123456"})
token = auth.session.access_token
print("1. Logged in")

headers = {"Authorization": f"Bearer {token}"}
c = httpx.Client(timeout=15.0)

# 2. Get document status
r = c.get(f"{BASE}/api/documents/10/", headers=headers)
doc = r.json()
print(f"2. Doc ID=10 status={doc.get('status')} name={doc.get('name')}")
file_path = doc.get("file_url", "")
print(f"   file_url present: {bool(file_path)}")

# 3. Check what status transition is available
status = doc.get("status")
print(f"3. Current status: {status}")

if status == "ready_to_process":
    print("   Document is in ready_to_process — n8n should have been triggered.")
    print("   The outbound webhook may have failed on Railway. Let me manually send the file to n8n.")
    
    # Get the file_path from the doc (internal storage path)
    # We need to download from Supabase and send to n8n
    # First, list files to find the actual path
    sb_headers = {
        "apikey": SUPABASE_SERVICE,
        "Authorization": f"Bearer {SUPABASE_SERVICE}",
        "Content-Type": "application/json",
    }
    
    # Find the file
    r2 = c.post(f"{SUPABASE_URL}/storage/v1/object/list/documents", json={"prefix": "", "limit": 20}, headers=sb_headers)
    folders = r2.json()
    found = None
    for f in folders:
        r3 = c.post(f"{SUPABASE_URL}/storage/v1/object/list/documents", json={"prefix": f["name"], "limit": 20}, headers=sb_headers)
        for f2 in r3.json():
            r4 = c.post(f"{SUPABASE_URL}/storage/v1/object/list/documents", json={"prefix": f"{f['name']}/{f2['name']}", "limit": 20}, headers=sb_headers)
            for f3 in r4.json():
                if f3.get("name", "").lower().endswith(".pdf"):
                    found = f"{f['name']}/{f2['name']}/{f3['name']}"
                    break
            if found: break
        if found: break
    
    if found:
        print(f"   Found file: {found}")
        # Get signed URL and download
        r5 = c.post(f"{SUPABASE_URL}/storage/v1/object/sign/documents/{found}", json={"expiresIn": 3600}, headers=sb_headers)
        su = r5.json().get("signedURL") or r5.json().get("signedUrl")
        if su and su.startswith("/"): su = f"{SUPABASE_URL}/storage/v1{su}"
        dl = c.get(su)
        print(f"   Downloaded: {dl.status_code}, {len(dl.content)} bytes")
        
        # Send to n8n as multipart
        fn = found.rsplit("/", 1)[-1]
        resp = requests.post(
            N8N_URL,
            data={"document_id": "10", "document_name": doc.get("name", "")},
            files={"File": (fn, dl.content, "application/pdf")},
            timeout=30,
        )
        print(f"   n8n response: {resp.status_code} {resp.text[:200]}")
    else:
        print("   ERROR: No PDF found in bucket")

elif status == "in_progress":
    print("   Already in_progress — drive poller should be running.")

elif status == "processed":
    print("   Already processed!")

c.close()
print("\nDone.")
