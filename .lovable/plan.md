## Shop Act + Food License (FSSAI) Modules

Build two new service modules end-to-end, mirroring the existing Udyam/GST pattern already in the codebase. Both follow the same proven architecture so they slot into the portal without breaking auth, wallet, dashboard, or other services.

### Architecture (mirrors Udyam)

For each module (`shopact`, `fssai`):

```
supabase/
  migrations/<ts>_<module>.sql          -- tables, sequences, RPCs, RLS, GRANTs
src/lib/
  <module>.shared.ts                    -- statuses, doc types, enums
  <module>.functions.ts                 -- createServerFn: save draft, submit, list, admin update, upload doc
src/components/admin/
  <Module>Desk.tsx                      -- admin desk (search, filters, cards, status update, export)
src/routes/_authenticated/
  <module>.tsx                          -- retailer multi-step form
  <module>-applications.tsx             -- retailer "My Applications" list
  admin.<module>.tsx                    -- admin desk route
  admin.<module>-settings.tsx           -- admin pricing/config
```

### Database (per module)

Tables (parallel to `udyam_*`):
- `shopact_applications` / `fssai_applications` — all form fields, status, application_no, total_charged, wallet_txn_id, timestamps, user_id
- `shopact_application_documents` / `fssai_application_documents` — doc_type, storage path, mime, size
- `shopact_application_events` / `fssai_application_events` — activity/audit log (actor, from_status, to_status, note)
- `shopact_service_config` / `fssai_service_config` — singleton settings: price, instructions, doc list overrides
- Sequences `shopact_application_seq`, `fssai_application_seq`
- RPCs `generate_shopact_application_no()` → `SHOPACT-YYYY-000001`, `generate_fssai_application_no()` → `FSSAI-YYYY-000001`
- RPCs `charge_shopact_application(...)`, `charge_fssai_application(...)` — wallet debit + txn link, copying the proven `charge_udyam_application` shape
- Indexes on `(user_id, created_at)`, `(status)`, `application_no`
- RLS: retailer own rows only; admins via `has_role(auth.uid(),'admin')`; full GRANTs to `authenticated` + `service_role`
- Storage: reuse existing private `documents` bucket (already RLS-gated, signed URL flow via `documents.server.ts`)

### Server functions (per module)

- `save<Module>Draft` — partial schema with `.optional()` on regex fields + `s()` null coalesce (same pattern as the recent Udyam fixes)
- `submit<Module>Application` — strict schema, generates application_no, charges wallet via RPC, inserts event row
- `listMy<Module>Applications`, `get<Module>Application`
- `adminList<Module>Applications` (search/filter/paginate), `adminUpdate<Module>Status` (writes event row), `adminUploadFinalCertificate`
- `upload<Module>Document` — base64 → `uploadDocumentPdf`-style helper, inserts doc row
- All use `requireSupabaseAuth`; admin endpoints check `has_role`

### Retailer UI

- Multi-step form with progress bar (Stepper component reused from Udyam)
- Auto-save draft on step change + debounce
- Document upload tiles with preview, replace, mime/size validation
- Submit screen shows wallet price, confirms balance
- `My Applications` list: search, status filter, pagination, realtime via `supabase.channel` (same hook pattern as `udyam-applications.tsx`)
- Timeline view from events table; download certificate when admin uploads
- Toast + dashboard notification on status change

### Admin UI

- Desk page: dashboard cards (today / pending / approved / rejected / need-docs / revenue), advanced search, filters, table with pagination
- Detail drawer: full form preview, document previews via signed URLs, status update, remarks, certificate upload, receipt
- Export Excel (xlsx) + PDF + Print actions on the table
- Settings page: price, instructions, required document list

### Integration points

- `services.tsx` — add two service tiles ("Shop Act Registration", "Food License (FSSAI)")
- `PortalShell.tsx` — add retailer nav entries + admin nav entries (alongside existing Udyam/GST entries)
- `admin.tsx` SECTIONS — add Shop Act Desk + Food License Desk
- Dashboard counts — extend existing dashboard query to include new tables

### Status flow (both modules)

`draft → submitted → payment_received → documents_verified → processing → need_more_documents ⇄ processing → approved → completed` (or `rejected`). Stored in shared `*_STATUS` constants with label + tone color tokens (matches `udyam.shared.ts`).

### Non-breaking guarantees

- No edits to auto-generated files (`client.ts`, `client.server.ts`, `types.ts`, `auth-middleware.ts`)
- No schema changes to existing tables; only additive migrations
- Existing routes (GST, Udyam, PAN, RC, DL, Ration, Gazette, wallet, dashboard, auth) untouched except small additive nav/service-tile edits
- Reuses existing `documents` storage bucket and signed-URL helpers

### Delivery order

1. Two migrations (Shop Act + FSSAI tables, RPCs, RLS, GRANTs) — submitted via migration tool for approval
2. After approval & types regen: shared constants, server functions, retailer form, retailer list, admin desk, admin settings — for each module in parallel
3. Wire nav + service tiles + admin sections
4. Smoke check build

Heads-up: this is a large build (~20 new files, two migrations). I'll proceed straight through once you approve.
