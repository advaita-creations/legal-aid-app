# Legal Aid App — MVP Specification

> **Version:** 1.1  
> **Status:** In Development  
> **Last Updated:** 2026-02-27  
> **Approach:** SDD (Spec Driven Development) + TDD (Test Driven Development)

### Implementation Notes (MVP)

- **Auth:** Django session-based authentication (local SQLite DB), NOT Supabase Auth
- **Database:** SQLite for local development; Supabase Postgres planned for production
- **Storage:** Local filesystem for MVP; Supabase Storage planned for production
- **Design System:** Stitch — Primary color `#1754cf`, font `Public Sans`

---

## 1. Problem Statement

Advocates and lawyers manage client agreements that arrive in a wide variety of physical conditions — handwritten, typewritten, printed, damaged, stamped with government stamps of varying sizes, colors, and quality. Tracking, digitizing, and managing the lifecycle of these documents is painful, error-prone, and time-consuming.

**Legal Aid App** provides a clean, professional digital workspace where advocates can upload, track, process, and manage client agreements through their entire lifecycle — from raw upload to fully processed output — powered by an n8n automation backend.

---

## 2. User Roles

### 2.1 Advocate (Primary User)

The lawyer or legal professional who owns and manages client files.

| Capability | Description |
|---|---|
| Login / Logout | Email + password via Django session auth |
| Dashboard | View document stats, file list, quick actions |
| Client Management | Create, view, edit client profiles |
| Case Management | Create, view, edit cases linked to clients |
| Document Upload | Upload images (JPG/PNG) and PDFs to a case |
| Document Lifecycle | Track document through status states |
| Profile | View/edit own profile |

### 2.2 Admin

Internal administrator who oversees the platform.

| Capability | Description |
|---|---|
| Login / Logout | Email + password via Django session auth |
| Admin Dashboard | System-wide stats, all advocates overview |
| User Management | List advocates, activate/deactivate accounts |
| All Advocate Capabilities | Can access any advocate's data for support |

### 2.3 Permissions Matrix

| Resource | Advocate | Admin |
|---|---|---|
| Own profile | Read, Update | Read, Update |
| Other advocate profiles | — | Read, Update |
| Own clients | CRUD | CRUD (all) |
| Other advocate's clients | — | Read |
| Own cases | CRUD | CRUD (all) |
| Own documents | CRUD + status transitions | CRUD (all) + status transitions |
| System stats | Own stats only | Global stats |
| User management | — | Full |

---

## 3. Screens & User Flows

### 3.1 Authentication

#### Screen: Login Page (`/login`)

- **Fields:** Email (text input), Password (password input)
- **Actions:** Submit (login), "Forgot Password" link (placeholder for MVP)
- **Behavior:**
  - Calls Django `/api/auth/login/` endpoint
  - On success: session cookie set, redirect to Dashboard (Advocate) or Admin Dashboard (Admin)
  - On failure: show inline error message
  - If already authenticated: redirect to appropriate dashboard
- **Design:** Split layout — branded left panel (desktop), clean form card on right, Stitch blue gradient

#### Flow: Logout

- Calls Django `/api/auth/logout/` endpoint, clears session
- Redirect to `/login`
- Available from user menu in topbar (all pages)

---

### 3.2 Advocate Dashboard (`/dashboard`)

The primary landing page after login for Advocate users.

#### Section A: Summary Stat Cards

Four cards displayed in a horizontal row:

| Card | Value | Color Intent |
|---|---|---|
| Total Files | Count of all documents | Neutral / Blue |
| Ready to Process | Count where status = `ready_to_process` | Amber / Warning |
| In Progress | Count where status = `in_progress` | Blue / Info |
| Processed | Count where status = `processed` | Green / Success |

Each card is clickable — filters the document list below to that status.

#### Section B: Document List Table

| Column | Type | Sortable | Filterable |
|---|---|---|---|
| Document Name | Text | Yes | Search |
| Client Name | Text (link) | Yes | — |
| Case Title | Text (link) | Yes | — |
| File Type | Badge (Image/PDF) | — | Yes |
| Status | Badge (4 states) | Yes | Yes (dropdown) |
| Uploaded At | Date | Yes | Date range |
| Actions | Icon buttons | — | — |

- **Actions per row:** View, Download, Change Status
- **Pagination:** 20 items per page, page controls at bottom
- **Empty state:** Illustration + "No documents yet. Upload your first file."
- **Loading state:** Skeleton rows

#### Section C: Quick Actions Bar

- **Upload Document** button (opens upload modal)
- **Add Client** button (navigates to client form)

---

### 3.3 Client List Page (`/clients`)

| Column | Type | Sortable |
|---|---|---|
| Client Name | Text (avatar initials + name) | Yes |
| Email | Text | Yes |
| Phone | Text | — |
| Cases Count | Number | Yes |
| Created At | Date | Yes |
| Actions | Icon buttons | — |

- **Actions:** View, Edit, Delete (soft delete with confirmation)
- **Search bar** at top (searches name, email, phone)
- **"+ Add Client"** button in header

---

### 3.4 Client Detail Page (`/clients/:id`)

#### Section A: Client Profile Card

| Field | Type |
|---|---|
| Full Name | Text |
| Email | Text |
| Phone | Text |
| Address | Textarea |
| Notes | Textarea |
| Created At | Date (read-only) |

- **Edit** button toggles inline editing
- **Delete** button with confirmation modal

#### Section B: Linked Cases (Table)

| Column | Type |
|---|---|
| Case Title | Text (link to case detail) |
| Case Number | Text |
| Status | Badge |
| Documents Count | Number |
| Created At | Date |

- **"+ Add Case"** button

#### Section C: Linked Documents (Table)

Shows all documents across all cases for this client. Same columns as dashboard document list.

---

### 3.5 Add / Edit Client Form (`/clients/new`, `/clients/:id/edit`)

| Field | Type | Validation |
|---|---|---|
| Full Name | Text input | Required, min 2 chars |
| Email | Email input | Required, valid email format |
| Phone | Text input | Optional, valid phone pattern |
| Address | Textarea | Optional, max 500 chars |
| Notes | Textarea | Optional, max 1000 chars |

- **Submit:** Creates/updates client, redirects to client detail
- **Cancel:** Returns to previous page

---

### 3.6 Case Detail Page (`/clients/:clientId/cases/:caseId`)

#### Section A: Case Metadata Card

| Field | Type |
|---|---|
| Case Title | Text |
| Case Number | Text |
| Description | Textarea |
| Status | Badge (active / closed / archived) |
| Client Name | Text (link to client) |
| Created At | Date (read-only) |

- **Edit** and **Delete** buttons

#### Section B: Associated Documents (Table)

Same document table as dashboard, filtered to this case.

- **"+ Upload Document"** button (uploads to this case)

#### Section C: Timeline (Placeholder for MVP)

Static placeholder showing "Timeline feature coming soon."

---

### 3.7 Add / Edit Case Form (`/clients/:clientId/cases/new`, `/clients/:clientId/cases/:caseId/edit`)

| Field | Type | Validation |
|---|---|---|
| Case Title | Text input | Required, min 2 chars |
| Case Number | Text input | Required, unique per advocate |
| Description | Textarea | Optional, max 2000 chars |
| Status | Select (active / closed / archived) | Required, default: active |

---

### 3.8 Document Upload Modal

Triggered from Dashboard or Case Detail page.

| Field | Type | Validation |
|---|---|---|
| File | Drag-and-drop zone + file picker | Required, JPG/PNG/PDF, max 20MB |
| Document Name | Text input (auto-filled from filename) | Required |
| Client | Select dropdown (searchable) | Required (pre-filled if from case) |
| Case | Select dropdown (filtered by client) | Required (pre-filled if from case) |
| Notes | Textarea | Optional |

- **Upload behavior:**
  1. File uploaded to Supabase Storage bucket
  2. Document record created in DB with status `uploaded`
  3. Success toast, modal closes, list refreshes

---

### 3.9 Document Detail Page (`/documents/:id`)

#### Section A: File Preview

- **Images (JPG/PNG):** Rendered inline with zoom controls
- **PDF:** Embedded PDF viewer (browser native or react-pdf)

#### Section B: Metadata Card

| Field | Type |
|---|---|
| Document Name | Text |
| File Type | Badge |
| File Size | Text |
| Status | Badge with history |
| Client | Link |
| Case | Link |
| Uploaded At | Date |
| Notes | Text |

#### Section C: Status Actions

Buttons to transition status (only valid next states shown):

```
uploaded → ready_to_process → in_progress → processed
```

Each transition requires confirmation dialog.

---

### 3.10 Admin Dashboard (`/admin`)

- **System stats:** Total advocates, total documents (by status), total clients
- **Advocates table:** Name, email, documents count, last active, status (active/inactive)
- **Quick action:** Deactivate/Activate advocate

### 3.11 Admin User Management (`/admin/users`)

- Full advocate list with search/filter
- View advocate's profile, clients, and documents (read-only)
- Activate / Deactivate toggle

---

### 3.12 Global Layout

All authenticated pages share:

- **Sidebar Navigation:**
  - Dashboard (Advocate) / Admin Dashboard (Admin)
  - Clients
  - Documents (flat list, all)
  - Admin > Users (Admin only)
- **Topbar:**
  - App logo + name
  - Search bar (global search — placeholder for MVP)
  - User avatar + dropdown (Profile, Logout)
- **Content area:** Main page content with breadcrumbs

---

## 4. Data Model

### 4.1 Entity Relationship

```
profiles (1) ──< clients (1) ──< cases (1) ──< documents
   │                                              │
   └──────────────────────────────────────────────┘
                    (advocate_id FK)
```

### 4.2 Table: `profiles`

Extends Supabase Auth `auth.users`.

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK, references `auth.users.id` |
| full_name | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| phone | VARCHAR(20) | NULLABLE |
| role | ENUM('advocate', 'admin') | NOT NULL, DEFAULT 'advocate' |
| is_active | BOOLEAN | NOT NULL, DEFAULT true |
| avatar_url | TEXT | NULLABLE |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

### 4.3 Table: `clients`

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() |
| advocate_id | UUID | FK → profiles.id, NOT NULL |
| full_name | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | NOT NULL |
| phone | VARCHAR(20) | NULLABLE |
| address | TEXT | NULLABLE |
| notes | TEXT | NULLABLE |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

### 4.4 Table: `cases`

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() |
| client_id | UUID | FK → clients.id, NOT NULL |
| advocate_id | UUID | FK → profiles.id, NOT NULL |
| title | VARCHAR(255) | NOT NULL |
| case_number | VARCHAR(100) | NOT NULL, UNIQUE per advocate |
| description | TEXT | NULLABLE |
| status | ENUM('active', 'closed', 'archived') | NOT NULL, DEFAULT 'active' |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

### 4.5 Table: `documents`

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() |
| case_id | UUID | FK → cases.id, NOT NULL |
| advocate_id | UUID | FK → profiles.id, NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| file_path | TEXT | NOT NULL (Supabase Storage path) |
| file_type | ENUM('image', 'pdf') | NOT NULL |
| file_size_bytes | BIGINT | NOT NULL |
| mime_type | VARCHAR(100) | NOT NULL |
| status | ENUM('uploaded', 'ready_to_process', 'in_progress', 'processed') | NOT NULL, DEFAULT 'uploaded' |
| notes | TEXT | NULLABLE |
| processed_output_path | TEXT | NULLABLE (path to n8n output) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

### 4.6 Table: `document_status_history`

Audit trail for document state transitions.

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() |
| document_id | UUID | FK → documents.id, NOT NULL |
| from_status | ENUM (same as documents.status) | NULLABLE (null for initial) |
| to_status | ENUM (same as documents.status) | NOT NULL |
| changed_by | UUID | FK → profiles.id, NOT NULL |
| changed_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| notes | TEXT | NULLABLE |

---

## 5. Document State Machine

```
┌──────────┐     ┌───────────────────┐     ┌─────────────┐     ┌───────────┐
│ uploaded  │ ──> │ ready_to_process  │ ──> │ in_progress │ ──> │ processed │
└──────────┘     └───────────────────┘     └─────────────┘     └───────────┘
```

### Valid Transitions

| From | To | Triggered By |
|---|---|---|
| `uploaded` | `ready_to_process` | Advocate marks file ready |
| `ready_to_process` | `in_progress` | n8n webhook picks up OR advocate manual |
| `in_progress` | `processed` | n8n webhook completes OR advocate manual |

**No backward transitions in MVP.** A document moves forward only.

---

## 6. Authentication & Data Access

### 6.1 Auth (MVP — Local Django)

- **Provider:** Django built-in auth (email + password)
- **Session:** Django session cookies (`SESSION_COOKIE_SAMESITE = 'Lax'`)
- **CSRF:** Exempted for API login endpoint; enforced elsewhere via session middleware
- **CORS:** Configured for `localhost:5173` (frontend dev server)

### 6.2 Storage (MVP — Local)

- **Location:** Local filesystem via Django media files
- **Max file size:** 20MB
- **Allowed MIME types:** `image/jpeg`, `image/png`, `application/pdf`
- **Path convention:** `media/{advocate_id}/{case_id}/{document_id}.{ext}`

### 6.3 Data Access Control

| Resource | Rule |
|---|---|
| Clients | Filtered by `advocate = request.user` in ViewSet queryset |
| Cases | Filtered by `advocate = request.user` in ViewSet queryset |
| Documents | Filtered by `advocate = request.user` in ViewSet queryset |

### 6.4 Supabase (Production — Planned)

- Supabase Postgres via `DATABASE_URL` in production settings
- Supabase Storage for file uploads
- RLS policies to be configured when migrating to production

---

## 7. n8n Integration Point

### 7.1 Webhook Endpoint (Django)

```
POST /api/webhooks/n8n/
```

**Purpose:** Receives callbacks from n8n when document processing completes.

**Stub payload (TBD — awaiting teammate's contract):**

```json
{
  "document_id": "uuid",
  "status": "processed",
  "output_file_path": "path/to/processed/file",
  "metadata": {}
}
```

**Auth:** Shared secret via `X-Webhook-Secret` header (configured via `N8N_WEBHOOK_SECRET` env var).

### 7.2 Outbound Trigger

When a document transitions to `ready_to_process`, the backend can optionally POST to the n8n workflow URL:

```
POST {N8N_WEBHOOK_URL}
```

```json
{
  "document_id": "uuid",
  "file_url": "supabase-storage-signed-url",
  "file_type": "image|pdf",
  "advocate_id": "uuid",
  "case_id": "uuid"
}
```

*This is a stub — the exact contract will be finalized with the n8n team.*

---

## 8. Non-Functional Requirements (MVP)

| Requirement | Target |
|---|---|
| Page load time | < 2 seconds |
| File upload limit | 20MB per file |
| Browser support | Chrome, Firefox, Safari (latest) |
| Responsive | Desktop-first, tablet-friendly |
| Accessibility | Semantic HTML, ARIA labels on interactive elements |
| Error handling | User-friendly error messages, no raw stack traces |
| Logging | Structured logging on backend (Django logging) |

---

## 9. Out of Scope (MVP)

- Mobile native app
- Multi-language / i18n
- Advanced search (full-text, OCR-based)
- Document collaboration / commenting
- Notifications (email, push)
- Billing / subscription
- Batch upload
- Document versioning
- Two-factor authentication
- Forgot password flow (placeholder link only)
- Timeline feature (placeholder UI only)
