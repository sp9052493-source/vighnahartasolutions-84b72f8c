## Udyam Aadhaar Registration Module

A complete CSC-style Udyam Aadhaar Registration service for retailers, plus an admin "Udyam Aadhaar Desk" — mirroring the existing GST and Aaple Sarkar modules already in the project.

### 1. Database (Supabase migration)

**New tables (in `public`):**

- `udyam_applications` — one row per application
  - identity: `id`, `user_id` (retailer), `application_no` (unique, auto `UDYAM-YYYYMM-000001`)
  - personal: `aadhaar_number`, `pan_number`, `name_as_aadhaar`, `name_as_pan`, `dob`, `mobile`, `email`, `gender`, `category`
  - business: `business_name`, `business_type`, `business_start_date`, `business_address`, `state`, `district`, `city`, `village`, `pincode`, `investment_amount`, `annual_turnover`, `gst_available` (bool), `gst_number` (nullable)
  - bank: `bank_name`, `ifsc`, `account_number`
  - employees: `employees_male`, `employees_female`, `employees_other`
  - workflow: `status` (enum), `remarks`, `certificate_url`, `acknowledgement_url`, `total_charged`, `wallet_txn_id`
  - timestamps: `created_at`, `updated_at`, `submitted_at`

- `udyam_application_documents` — uploaded files
  - `id`, `application_id`, `doc_type` (aadhaar/pan/passbook/business_proof/photo/supporting), `file_path`, `file_name`, `mime_type`, `size_bytes`, `uploaded_at`

- `udyam_application_events` — activity log for status changes & remarks
  - `id`, `application_id`, `actor_id`, `actor_role`, `event_type`, `from_status`, `to_status`, `note`, `created_at`

**Enum:** `udyam_status` = `draft | submitted | payment_received | documents_verified | processing | approved | rejected | completed`

**Sequence:** `udyam_application_seq` for the readable `UDYAM-YYYYMM-XXXXXX` number (function `generate_udyam_application_no`).

**RPC `charge_udyam_application(p_user_id, p_app_id, p_amount)`** — atomic wallet debit identical in shape to `charge_gst_application`. Throws `INSUFFICIENT_BALANCE`.

**Storage:** reuse existing private `documents` bucket; files at `udyam/<userId>/<applicationId>/<docType>_<stamp>.<ext>`.

**RLS + GRANTs (`authenticated` + `service_role`):**
- Retailers: full access to their own application rows, docs, events.
- Admins (`has_role(auth.uid(),'admin')`): full access to all.
- Service config row inserted into existing `services` table so it shows up in the retailer service grid and uses the standard pricing/wallet flow.

### 2. Server functions (`src/lib/udyam.functions.ts`)

All gated by `requireSupabaseAuth`:
- `saveUdyamDraft({...})` — upsert draft (status stays `draft`, no wallet charge).
- `submitUdyamApplication({ applicationId })` — validate required fields, run `charge_udyam_application`, set status `submitted`, log event, return app row.
- `uploadUdyamDocument({ applicationId, docType, fileName, mimeType, base64 })` — server stores file via `supabaseAdmin` storage to private bucket, inserts `udyam_application_documents` row.
- `listMyUdyamApplications()` / `getMyUdyamApplication(id)` — retailer-scoped reads.
- `getUdyamDocumentUrl({ documentId })` — signed URL, ownership-checked (retailer owns OR admin).

Admin-only (extra `has_role` check):
- `adminListUdyamApplications({ status?, search? })`
- `adminGetUdyamApplication(id)` (with docs + events)
- `adminUpdateUdyamStatus({ applicationId, status, remarks })` — logs event, optionally notifies.
- `adminUploadUdyamCertificate({ applicationId, base64, fileName, kind: 'certificate' | 'acknowledgement' })`

### 3. Retailer UI

- **`src/routes/_authenticated/udyam.tsx`** — multi-section form (Instructions → Personal → Business → Bank → Employees → Documents → Review/Submit) using existing shadcn `Form`, `Tabs`/stepper, zod validation. Save as Draft + Final Submit. Upload progress per file. Loads an existing draft if present.
- **`src/routes/_authenticated/udyam-applications.tsx`** — "My Udyam Applications" list with status badges, search, real-time updates via `supabase.channel('udyam_applications').on('postgres_changes', { filter: 'user_id=eq.<uid>' })`. View / download certificate + acknowledgement when issued.
- Add Udyam tile to the existing services dashboard.

### 4. Admin UI

- **`src/routes/_authenticated/admin.udyam.tsx`** — Udyam Aadhaar Desk
  - 5 dashboard count cards (Pending / Under Review / Approved / Rejected / Completed)
  - Searchable + status-filtered table (Name, Mobile, Aadhaar, PAN, Application ID)
  - Row → detail sheet (`UdyamDesk.tsx` component): full application, all uploaded docs with preview/download, remarks textarea, status dropdown, certificate + acknowledgement upload, activity log timeline
  - Export buttons: Excel (`xlsx`) and PDF (`jspdf` — already in deps)
- Add menu item in admin nav.

### 5. Status flow, notifications, security

- Allowed transitions enforced server-side in `adminUpdateUdyamStatus`.
- Each transition writes a `udyam_application_events` row → retailer sees live timeline via realtime subscription.
- All file access through signed URLs only (private bucket).
- Wallet only debited on Final Submit; refund-on-reject is **out of scope** unless asked (admin can adjust wallet manually via existing tool).

### 6. Out of scope

- SMS/email push notifications (in-app realtime + toast only — matches existing modules).
- Government API integration (form data captured; submission to real Udyam portal is manual by admin, same pattern as GST).

### Files to create/edit

```text
supabase migration                              (new)
src/lib/udyam.functions.ts                       (new)
src/lib/udyam.shared.ts                          (zod schemas, enums)
src/routes/_authenticated/udyam.tsx              (new — retailer form)
src/routes/_authenticated/udyam-applications.tsx (new — retailer list)
src/routes/_authenticated/admin.udyam.tsx        (new — admin desk route)
src/components/admin/UdyamDesk.tsx               (new — admin desk UI)
src/components/portal/PortalShell.tsx            (edit — add nav links)
src/routes/_authenticated/services.tsx           (edit — Udyam tile)
```

Approve to proceed and I'll ship it in one pass (migration first for your approval, then code).
