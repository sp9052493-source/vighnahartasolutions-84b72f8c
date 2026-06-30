
## Scope (this PR only)

**GST Registration end-to-end.** No Gazette changes. No "All Services" catalog yet. No regressions to existing Aaple Sarkar / PAN / DL / RC / Ration / Recharge / Gazette flows. Phased audit (perf, payments, SEO) resumes after this ships.

## What gets built

### 1. Database — one migration

New table `public.gst_applications`:
- Identity: `id uuid pk`, `application_no text unique` (format `GST-YYYYMM-XXXXXX`), `user_id uuid → auth.users`, `status text` (`new|pending|in_progress|query_raised|approved|rejected|completed|on_hold`), `assigned_to uuid null`.
- Applicant: `applicant_name`, `mobile`, `email`, `pan`, `aadhaar_last4` (store last 4 only; full Aadhaar lives in the uploaded doc — PII minimization).
- Business: `business_name`, `trade_name`, `constitution` (proprietor/partnership/llp/pvt/public/huf/society/trust/other), `nature_of_business`, `commencement_date`.
- Address: `address_line1`, `address_line2`, `city`, `district`, `state`, `pin_code`.
- Bank: `bank_account_name`, `bank_account_no`, `bank_ifsc`, `bank_name`, `bank_branch`.
- Authorized signatory: `signatory_name`, `signatory_designation`, `signatory_pan`, `signatory_mobile`, `signatory_email`.
- Commercial: `hsn_codes jsonb` (array of `{code, description}`), `estimated_turnover numeric`, `existing_registration text null`.
- Pricing: `service_charge numeric`, `govt_fee numeric default 0`, `total_charged numeric`, `wallet_txn_id uuid null`.
- Admin output: `arn_no text null`, `gstin text null`, `certificate_path text null`, `acknowledgement_path text null`, `admin_remarks text null`, `internal_notes text null`.
- Audit: `created_at`, `updated_at`, trigger to bump `updated_at`.

New table `public.gst_application_documents`:
- `id`, `application_id → gst_applications on delete cascade`, `doc_type text` (`pan|aadhaar|photo|cancelled_cheque|bank_proof|electricity_bill|rent_agreement|noc|business_proof|signature|additional|admin_certificate|admin_arn|admin_ack|admin_other`), `storage_path text`, `file_name`, `mime_type`, `size_bytes`, `uploaded_by uuid`, `uploaded_at`.

New table `public.gst_application_events` (timeline + activity log):
- `id`, `application_id`, `event_type text` (`created|status_changed|remark_added|document_uploaded|assigned|fee_charged|notification_sent|certificate_issued`), `from_status`, `to_status`, `message text`, `actor_id uuid`, `actor_role text`, `metadata jsonb`, `created_at`.

New table `public.gst_service_config` (single row, admin-tunable):
- `id`, `service_charge numeric`, `govt_fee numeric default 0`, `active boolean`, `turnaround_text text`, `instructions_en text`, `instructions_mr text`.

**GRANTs + RLS** (in same migration):
- `authenticated`: SELECT/INSERT/UPDATE on `gst_applications` (own rows via `auth.uid()`), admins via `has_role(auth.uid(),'admin')`.
- `gst_application_documents`: retailer can read/insert own app's docs; admin all.
- `gst_application_events`: retailer read-only on own app; admin/server full.
- `gst_service_config`: anon+authenticated SELECT (public price display), admin UPDATE only.
- `service_role`: ALL on every new table.

Storage: reuse existing private `documents` bucket under `gst/<application_id>/...`.

DB function `public.charge_gst_application(p_user_id uuid, p_app_id uuid, p_amount numeric)` — atomic wallet debit + transaction row + stamps `total_charged`/`wallet_txn_id`, raises `INSUFFICIENT_BALANCE` on underflow. Mirrors `complete_document_request`.

### 2. Server functions — `src/lib/gst.functions.ts`

All guarded with `requireSupabaseAuth`; admin ones additionally call `has_role`.

Retailer:
- `getGstConfig()` — returns price + instructions (public-shaped, RLS allows authenticated).
- `createGstApplication(input)` — Zod-validated full payload, generates `application_no`, inserts row in `new` status, returns id+no.
- `uploadGstDocument({applicationId, docType, filename, contentType, base64})` — admin client; validates owner via SELECT against RLS-aware client first; PDF/JPEG/PNG ≤ 8 MB; writes to storage, inserts row, emits `document_uploaded` event.
- `submitGstApplication({applicationId})` — verifies all required doc types present, calls `charge_gst_application` RPC, flips status `new → pending`, emits `fee_charged` + `status_changed` events.
- `listMyGstApplications()` / `getMyGstApplication({id})` — retailer scoped, includes timeline + signed doc URLs.

Admin:
- `adminListGstApplications({status?, q?, district?, retailerId?, dateFrom?, dateTo?})`.
- `adminGetGstApplication({id})` — full row + docs (signed URLs 1 h) + events + wallet snapshot + profile.
- `adminUpdateGstStatus({id, status, remarks?, internalNote?})` — appends event.
- `adminAddGstRemark({id, message, internal:boolean})`.
- `adminAssignGstApplication({id, staffId|null})`.
- `adminUploadGstResult({id, kind:'certificate'|'arn'|'ack'|'other', filename, contentType, base64, arnNo?, gstin?})` — stores doc, updates row fields, emits event.
- `adminGetGstConfig` / `adminSaveGstConfig({serviceCharge, govtFee, active, turnaroundText, instructionsEn, instructionsMr})`.

### 3. Retailer UI

- `src/routes/_authenticated/gst.tsx` — landing/application page:
  - Instructions card at top (Eligibility / Required Docs / Processing Time / Govt Fees / Service Charges / Notes / Guidelines / T&C) sourced from `gst_service_config`.
  - Multi-step form (5 steps via Tabs): **Applicant → Business → Address & Commercial → Bank & Signatory → Documents**. Per-step Zod validation gates next-step.
  - Fee summary card sticky on right (desktop) / above submit (mobile): service charge, govt fee, total, wallet balance, "Insufficient balance" CTA → `/wallet`.
  - Confirm dialog → calls `submitGstApplication` → toast with application no → redirect to tracking.
  - Visual style copies existing Gazette / Aaple Sarkar pages (Card + tabs + shadcn inputs). No new design system.

- `src/routes/_authenticated/gst-requests.tsx` — retailer list of own GST applications: status chip, application no, date, "View".

- `src/routes/_authenticated/gst.$id.tsx` — tracking page:
  - Status header, timeline (events), admin remarks, downloadable retailer docs, downloadable admin outputs (certificate / ARN / ack), "Upload missing documents" panel when status = `query_raised`.

- Add GST entry to PortalShell sidebar (under Services group) — icon `FileCheck2`. Don't reshuffle existing items.

### 4. Admin UI

- `src/routes/_authenticated/admin.gst-desk.tsx` + `src/components/admin/GstDesk.tsx`:
  - Tabs: New / Pending / In Progress / Query / Approved / Rejected / Completed / Hold (counts in badges).
  - Filters: search (name/mobile/app no), date range, district, retailer.
  - Table: app no, applicant, business, status, retailer, charged, created.
  - Row click → side sheet: Details / Documents (preview + download signed URLs) / Timeline / Wallet+Payment / Notes (admin remarks vs internal).
  - Actions: Approve, Reject, Raise Query, Hold, Update Status, Add Remark, Assign Staff, Upload Certificate, Upload ARN, Upload Acknowledgement, Upload Other.

- `src/routes/_authenticated/admin.gst.tsx` — config editor (price / govt fee / instructions EN+MR / active toggle / turnaround text). Mirrors `admin.gazette.tsx`.

Admin sidebar gets two new entries under the existing admin block: **GST Desk**, **GST Settings**. Gated by `has_role(admin)` exactly like the existing admin links.

### 5. Notifications

Lightweight: write to existing toast on client + an `event_type='notification_sent'` row. No email/SMS provider wiring in this PR (out of scope — would need provider keys and is its own phase). The tracking page polls every 30 s when status ∈ pending/in_progress/query_raised to reflect admin updates.

### 6. Out of scope for this PR (explicit)

- Gazette refactor.
- All Services catalog page.
- Real SMS/email notifications.
- Staff role beyond admin (assign UI lists admins only).
- Multi-language UI strings beyond what `gst_service_config` already stores.

## Technical details

- All file uploads go through `createServerFn` (base64), not direct browser → storage, so admin can sign URLs + enforce per-application ownership via RLS check before upload.
- Atomic wallet debit via SQL function (matches existing `complete_document_request` pattern) — no client-side balance math.
- `application_no` generated server-side using `to_char(now(),'YYYYMM') || lpad(nextval, 6, '0')` via a sequence to guarantee uniqueness.
- Admin client (`supabaseAdmin`) only imported *inside* handler bodies (per `tanstack-supabase-import-graph`).
- New routes that are admin-only live under `_authenticated/` and check `has_role` server-side on every fn — no client-only gate.
- Cloudflare Worker safe: no `sharp`, no `child_process`, base64 → `Buffer.from` → Supabase storage `upload`.
- All new code uses existing Tailwind tokens + shadcn components; no new fonts/colors.

## Execution order

1. Run DB migration (tables + grants + RLS + function + sequence + seed config row).
2. Add `src/lib/gst.functions.ts`.
3. Add retailer routes (`gst.tsx`, `gst-requests.tsx`, `gst.$id.tsx`).
4. Add admin routes + `GstDesk` component + `admin.gst.tsx` config editor.
5. Wire sidebar entries in `PortalShell`.
6. Smoke-test with Playwright as admin + retailer (cold session, restored Supabase localStorage as documented). Verify: create → upload all docs → submit → wallet debited → admin sees New tab → admin uploads certificate → retailer sees it on tracking page.
7. Production build check.

Estimated ~15–20 files added, 2 files modified (`PortalShell.tsx`, `routeTree.gen.ts` regenerates).
