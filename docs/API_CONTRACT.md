# Legal Aid App — API Contract

> **Version:** 1.1  
> **Base URL:** `/api`  
> **Auth:** Django session-based authentication. All endpoints (except login) require an active session cookie.  
> **Content-Type:** `application/json` (unless file upload)  
> **Pagination:** `?page=1&page_size=20` (default 20, max 100)  
> **CORS:** Credentials included (`withCredentials: true`)

---

## 1. Authentication

### 1.1 Login

```
POST /api/auth/login/
```

**Request:**

```json
{
  "email": "advocate@example.com",
  "password": "password123"
}
```

**Response: 200**

```json
{
  "user": {
    "id": 1,
    "email": "advocate@example.com",
    "full_name": "Advocate Name",
    "role": "advocate"
  },
  "message": "Login successful"
}
```

**Side effect:** Sets Django session cookie.

**Errors:** `400 Bad Request` (invalid credentials)

### 1.2 Logout

```
POST /api/auth/logout/
```

**Response: 200**

```json
{
  "message": "Logout successful"
}
```

### 1.3 Get Current User

```
GET /api/auth/me/
```

**Response: 200**

```json
{
  "id": "uuid",
  "full_name": "Advocate Name",
  "email": "advocate@example.com",
  "phone": "+91XXXXXXXXXX",
  "role": "advocate",
  "is_active": true,
  "avatar_url": null,
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-01-15T10:30:00Z"
}
```

**Errors:** `401 Unauthorized`

### 1.3 Update Current User Profile

```
PATCH /api/me/
```

**Request:**

```json
{
  "full_name": "Updated Name",
  "phone": "+91XXXXXXXXXX"
}
```

**Response: 200** — Updated profile object (same shape as GET)

**Errors:** `400 Bad Request`, `401 Unauthorized`

---

## 2. Dashboard

### 2.1 Get Dashboard Stats

```
GET /api/dashboard/stats/
```

**Response: 200**

```json
{
  "total_documents": 42,
  "uploaded": 5,
  "ready_to_process": 12,
  "in_progress": 8,
  "processed": 17,
  "total_clients": 15,
  "total_cases": 23
}
```

**Scope:** Advocate sees own stats. Admin sees system-wide stats.

---

## 3. Clients

### 3.1 List Clients

```
GET /api/clients/?search=&page=1&page_size=20&ordering=-created_at
```

**Query Params:**

| Param | Type | Description |
|---|---|---|
| search | string | Searches name, email, phone |
| ordering | string | `full_name`, `-full_name`, `created_at`, `-created_at`, `cases_count`, `-cases_count` |
| page | int | Page number |
| page_size | int | Items per page |

**Response: 200**

```json
{
  "count": 15,
  "next": "/api/clients/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "full_name": "Client Name",
      "email": "client@example.com",
      "phone": "+91XXXXXXXXXX",
      "address": "123 Street, City",
      "notes": "Important client",
      "cases_count": 3,
      "created_at": "2026-01-10T08:00:00Z",
      "updated_at": "2026-01-10T08:00:00Z"
    }
  ]
}
```

### 3.2 Create Client

```
POST /api/clients/
```

**Request:**

```json
{
  "full_name": "New Client",
  "email": "newclient@example.com",
  "phone": "+91XXXXXXXXXX",
  "address": "456 Avenue, City",
  "notes": "Referred by XYZ"
}
```

**Response: 201** — Created client object

**Errors:** `400 Bad Request` (validation), `401 Unauthorized`

### 3.3 Get Client Detail

```
GET /api/clients/:id/
```

**Response: 200**

```json
{
  "id": "uuid",
  "full_name": "Client Name",
  "email": "client@example.com",
  "phone": "+91XXXXXXXXXX",
  "address": "123 Street, City",
  "notes": "Important client",
  "cases_count": 3,
  "documents_count": 7,
  "cases": [
    {
      "id": "uuid",
      "title": "Property Dispute",
      "case_number": "PD-2026-001",
      "status": "active",
      "documents_count": 4,
      "created_at": "2026-01-12T09:00:00Z"
    }
  ],
  "created_at": "2026-01-10T08:00:00Z",
  "updated_at": "2026-01-10T08:00:00Z"
}
```

**Errors:** `404 Not Found`, `401 Unauthorized`

### 3.4 Update Client

```
PATCH /api/clients/:id/
```

**Request:** Partial update — any subset of fields from create.

**Response: 200** — Updated client object

### 3.5 Delete Client (Soft Delete)

```
DELETE /api/clients/:id/
```

**Response: 204 No Content**

Sets `is_deleted = true`. Does NOT physically remove the record.

---

## 4. Cases

> **Implementation status:** ✅ Implemented — flat endpoints at `/api/cases/`

### 4.1 List Cases

```
GET /api/cases/?page=1&page_size=20
```

**Response: 200**

```json
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "client": 1,
      "client_name": "Client Name",
      "advocate": 1,
      "title": "Property Dispute",
      "case_number": "PD-2026-001",
      "description": "Dispute over 5 acres in Pune",
      "status": "active",
      "created_at": "2026-01-12T09:00:00Z",
      "updated_at": "2026-01-12T09:00:00Z"
    }
  ]
}
```

**Scope:** Filtered by `advocate = request.user`.

### 4.2 Create Case

```
POST /api/cases/
```

**Request:**

```json
{
  "client": 1,
  "title": "Property Dispute",
  "case_number": "PD-2026-001",
  "description": "Dispute over 5 acres in Pune",
  "status": "active"
}
```

**Response: 201** — Created case object (same shape as list item, with `client_name`)

**Side effect:** `advocate` auto-assigned to `request.user`. `case_number` must be unique per advocate.

**Errors:** `400 Bad Request` (validation, duplicate case_number), `403 Forbidden` (not authenticated)

### 4.3 Get Case Detail

```
GET /api/cases/:id/
```

**Response: 200** — Case object (same shape as list item)

**Errors:** `404 Not Found` (not found or belongs to another advocate)

### 4.4 Update Case

```
PATCH /api/cases/:id/
```

**Request:** Partial update of `title`, `description`, `status`, `case_number`.

**Response: 200** — Updated case object

### 4.5 Delete Case

```
DELETE /api/cases/:id/
```

**Response: 204 No Content**

---

## 5. Documents

### 5.1 List Documents

```
GET /api/documents/?status=&file_type=&search=&case_id=&client_id=&ordering=-created_at&page=1
```

**Query Params:**

| Param | Type | Description |
|---|---|---|
| status | string | `uploaded`, `ready_to_process`, `in_progress`, `processed` |
| file_type | string | `image`, `pdf` |
| search | string | Searches document name |
| case_id | UUID | Filter by case |
| client_id | UUID | Filter by client (across all cases) |
| ordering | string | `name`, `-name`, `created_at`, `-created_at`, `status` |
| page | int | Page number |

**Response: 200**

```json
{
  "count": 42,
  "next": "/api/documents/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "name": "agreement_scan.jpg",
      "file_type": "image",
      "mime_type": "image/jpeg",
      "file_size_bytes": 2048576,
      "status": "uploaded",
      "case_id": "uuid",
      "case_title": "Property Dispute",
      "client_id": "uuid",
      "client_name": "Client Name",
      "notes": null,
      "created_at": "2026-01-13T11:00:00Z",
      "updated_at": "2026-01-13T11:00:00Z"
    }
  ]
}
```

### 5.2 Create Document

```
POST /api/documents/
```

**Request:**

```json
{
  "case": 1,
  "name": "agreement_scan.jpg",
  "file_path": "advocate-1/case-1/doc-1.jpg",
  "file_type": "image",
  "file_size_bytes": 2048576,
  "mime_type": "image/jpeg",
  "notes": "Scanned agreement"
}
```

**Response: 201** — Full document object (same shape as list item, with `case_title`, `client_name`, `client_id`)

**Side effect:** `advocate` auto-assigned. Default status is `uploaded`.

**Errors:** `400 Bad Request` (validation), `403 Forbidden` (not authenticated)

> **Note:** File upload via `multipart/form-data` is planned for production. MVP creates document records with a `file_path` string.

### 5.3 Get Document Detail

```
GET /api/documents/:id/
```

**Response: 200** — Document object (same shape as list item, includes `case_title`, `client_name`, `client_id`, `file_path`, `processed_output_path`)

**Errors:** `404 Not Found`

### 5.4 Update Document Status

```
PATCH /api/documents/:id/status/
```

**Request:**

```json
{
  "status": "ready_to_process",
  "notes": "Reviewed and ready for OCR"
}
```

**Valid transitions:** `uploaded → ready_to_process → in_progress → processed`

**Response: 200** — Updated document object (same as GET detail)

**Side effect:** When status changes to `ready_to_process` and `N8N_WEBHOOK_URL` is configured, sends outbound webhook to n8n.

**Errors:** `400 Bad Request` (invalid transition), `404 Not Found`

### 5.5 Delete Document

```
DELETE /api/documents/:id/
```

**Response: 204 No Content**

---

## 6. Admin Endpoints

All admin endpoints require `role = 'admin'`.

### 6.1 List Advocates

```
GET /api/admin/advocates/?search=&is_active=&ordering=-created_at&page=1
```

**Response: 200**

```json
{
  "count": 10,
  "results": [
    {
      "id": "uuid",
      "full_name": "Advocate Name",
      "email": "advocate@example.com",
      "is_active": true,
      "documents_count": 42,
      "clients_count": 15,
      "last_login": "2026-02-26T14:00:00Z",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

### 6.2 Toggle Advocate Status

```
PATCH /api/admin/advocates/:id/
```

**Request:**

```json
{
  "is_active": false
}
```

**Response: 200** — Updated advocate profile

### 6.3 Admin Dashboard Stats

```
GET /api/admin/stats/
```

**Response: 200**

```json
{
  "total_advocates": 10,
  "active_advocates": 8,
  "total_clients": 150,
  "total_cases": 230,
  "total_documents": 420,
  "documents_by_status": {
    "uploaded": 50,
    "ready_to_process": 120,
    "in_progress": 80,
    "processed": 170
  }
}
```

---

## 7. Webhooks (n8n)

### 7.1 Inbound — n8n → Django

```
POST /api/webhooks/n8n/
X-Webhook-Secret: <N8N_WEBHOOK_SECRET>
```

**Request (TBD — stub):**

```json
{
  "document_id": "uuid",
  "status": "processed",
  "output_file_path": "path/to/processed/output.pdf",
  "metadata": {}
}
```

**Response: 200**

```json
{
  "ok": true,
  "document_id": "uuid",
  "updated_status": "processed"
}
```

**Errors:** `401 Unauthorized` (bad secret), `404 Not Found` (document), `400 Bad Request` (invalid payload)

---

## 8. Common Error Response Format

All errors follow this shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": {
      "field_name": ["Error message for this field"]
    }
  }
}
```

### Error Codes

| HTTP Status | Code | Description |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Request body validation failed |
| 400 | `INVALID_TRANSITION` | Document status transition not allowed |
| 401 | `UNAUTHORIZED` | Missing or invalid session |
| 403 | `FORBIDDEN` | User lacks permission for this resource |
| 404 | `NOT_FOUND` | Resource does not exist or not accessible |
| 413 | `FILE_TOO_LARGE` | Uploaded file exceeds 20MB limit |
| 415 | `UNSUPPORTED_FILE_TYPE` | File type not in allowed list |
| 500 | `INTERNAL_ERROR` | Unexpected server error |
