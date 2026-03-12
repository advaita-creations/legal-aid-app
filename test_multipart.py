"""Test: confirm backend logic downloads from Supabase and sends file as multipart to n8n."""
import httpx
import requests

SUPABASE_URL = "https://unzeltkntvjddrutdjcp.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuemVsdGtudHZqZGRydXRkamNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgyMjYzOCwiZXhwIjoyMDg4Mzk4NjM4fQ.24hDD1uj1SrDU1ExPB8Lar7nMLX5SMqeILSjanKA168"
N8N_URL = "https://n8n.lotlikar.net/webhook/80935175-df06-4394-a0e6-8bc25d5c9c83"

sb = {
    "apikey": SUPABASE_KEY,
    "Authorization": "Bearer " + SUPABASE_KEY,
    "Content-Type": "application/json",
}

# Step 1: Find a PDF in the bucket
print("1. Listing Supabase bucket...")
c = httpx.Client(timeout=15.0)
r = c.post(SUPABASE_URL + "/storage/v1/object/list/documents", json={"prefix": "", "limit": 5}, headers=sb)
folders = r.json()
found = None
for f in folders:
    r2 = c.post(SUPABASE_URL + "/storage/v1/object/list/documents", json={"prefix": f["name"], "limit": 10}, headers=sb)
    for f2 in r2.json():
        prefix = f["name"] + "/" + f2["name"]
        r3 = c.post(SUPABASE_URL + "/storage/v1/object/list/documents", json={"prefix": prefix, "limit": 10}, headers=sb)
        for f3 in r3.json():
            name = f3.get("name", "")
            if name.lower().endswith(".pdf"):
                found = prefix + "/" + name
                break
        if found:
            break
    if found:
        break

if not found:
    print("ERROR: No PDF found in bucket")
    exit(1)

print(f"   Found: {found}")

# Step 2: Get signed URL
print("2. Getting signed URL...")
r = c.post(
    SUPABASE_URL + "/storage/v1/object/sign/documents/" + found,
    json={"expiresIn": 3600},
    headers=sb,
)
data = r.json()
signed_url = data.get("signedURL") or data.get("signedUrl")
if signed_url and signed_url.startswith("/"):
    signed_url = SUPABASE_URL + "/storage/v1" + signed_url
print(f"   URL obtained")

# Step 3: Download file
print("3. Downloading file...")
dl = c.get(signed_url)
print(f"   Status: {dl.status_code}, Size: {len(dl.content)} bytes")
c.close()

if dl.status_code != 200 or len(dl.content) == 0:
    print("ERROR: Download failed")
    exit(1)

# Step 4: Send as multipart to n8n
filename = found.rsplit("/", 1)[-1]
print(f"4. Sending '{filename}' as multipart POST to n8n...")
resp = requests.post(
    N8N_URL,
    data={"document_id": "test-multipart", "document_name": "Test Multipart Upload"},
    files={"File": (filename, dl.content, "application/pdf")},
    timeout=30,
)
print(f"   n8n status: {resp.status_code}")
print(f"   n8n response: {resp.text[:300]}")
print()
if resp.status_code == 200:
    print("SUCCESS: File sent as multipart to n8n")
else:
    print("FAILED: n8n rejected the request")
