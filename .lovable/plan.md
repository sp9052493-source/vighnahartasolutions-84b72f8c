## Goal
Give the admin a single professional Control Center to manage everything site-wide without code changes. Public pages and portal pull live data from the database.

## New database tables

1. `site_settings` (single-row key/value JSON store)
   - `id` (singleton), `contact_email`, `support_email`, `phone`, `whatsapp`, `address_line1`, `address_line2`, `city`, `state`, `pincode`, `company_name`, `brand_tagline`, `logo_url`, `favicon_url`, `social` (jsonb: facebook, instagram, x, youtube, linkedin), `business_hours`, `gst_number`
2. `site_pages` (rich content blocks per page)
   - `slug` PK (`about`, `privacy`, `terms`, `refund`, `contact_intro`, `hero`, `footer_note`)
   - `title`, `meta_description`, `content_md` (markdown), `updated_at`, `updated_by`
3. `payment_gateways`
   - `provider` PK (`paytm` | `razorpay` | `cashfree`)
   - `mode` (`test`|`live`), `enabled`, `merchant_id`, `key_id_public`, `webhook_secret_masked`, `extra` (jsonb), `updated_at`
   - Secret keys remain in Lovable secrets — admin UI tells which secret name to fill; never stores raw secrets in DB.
4. Reuse existing `services` (already has price + api_provider + api_endpoint + api_enabled + api_notes) — extend admin UI with "Test endpoint" button.

All tables: `GRANT` block, RLS — admin write via `has_role('admin')`, anon SELECT only on `site_settings` + `site_pages` (public read for footer/about/legal).

## New admin server functions (`src/lib/admin.functions.ts`)

- `adminGetSiteSettings` / `adminUpdateSiteSettings`
- `adminGetPage(slug)` / `adminUpdatePage`
- `adminListGateways` / `adminUpdateGateway`
- `adminUploadAsset` (logo / retailer photo / KYC doc → `documents` bucket, returns signed URL)
- `adminUpdateUserExtended` — extend existing `adminUpdateUser` to also handle: email change (auth admin updateUserById), password reset, photo URL, KYC doc URLs
- `adminResetUserPassword(userId, newPassword)`

All gated by `assertAdmin` helper already in file.

## New public read functions

- `getSiteSettings()` and `getPage(slug)` — public, no auth, use publishable client → narrow `TO anon` policy.

## New admin routes (under `/_authenticated/`)

```text
/_authenticated/admin                  → Control Center landing (cards grid)
/_authenticated/admin/site             → Logo, contact, address, social, business info
/_authenticated/admin/pages            → Tabbed editor: About / Privacy / Terms / Refund / Hero
/_authenticated/admin/gateways         → Paytm / Razorpay / Cashfree config + mode toggle
/_authenticated/admin/services         → (move existing manage-services here, keep redirect)
/_authenticated/admin/users/$id        → Extended profile editor (email, password, photo, KYC docs)
```

Sidebar gets a new "Admin Control" group visible only when role = admin.

## Wire public pages to DB

- `src/routes/about.tsx`, `privacy-policy.tsx`, `terms.tsx`, `refund-policy.tsx`, `contact.tsx` → loader calls `getPage` server fn; render markdown via `react-markdown` (add dependency).
- `SiteHeader` / `SiteFooter` / `PortalShell` brand block → use `getSiteSettings` (cached via React Query) for phone, email, address, social links, logo. Hardcoded values in `src/lib/company.ts` become fallback defaults only.

## Payment gateway scaffolding

- Admin can toggle which gateway is "primary" (used for wallet top-ups).
- For each: enter merchant ID + public key in the form; secret key field shows "Stored as secret — click Set" → opens secure form via `secrets--update_secret` instructions in a help dialog (we can't call from runtime; UI explains the secret name e.g. `RAZORPAY_KEY_SECRET`).
- Razorpay & Cashfree integration code stubs left as `// TODO connect` — only enabling the admin config plumbing now. Paytm wallet top-up keeps working as today.

## Extended user management

In `members.tsx` row sheet:
- Change email (with confirmation re-auth via admin API)
- Reset password (admin sets temp password)
- Upload retailer profile photo + Aadhaar/PAN documents (stored in `documents` bucket under `kyc/{userId}/`)
- All actions audit-logged into `wallet_transactions`-style audit table? → use simple `console.log` for v1; future audit table optional.

## Migrations

One migration creates the 3 tables with GRANT + RLS + seed default rows (single site_settings row, one row per page slug, one row per gateway).

## Out of scope (will mention but skip unless asked next)
- Multi-language CMS editor
- Real Razorpay/Cashfree checkout (only admin config now; flip switch later)
- Audit log table

## Sequence
1. Migration (3 tables, seeds, RLS, grants) — ask for approval.
2. `bun add react-markdown` for legal pages.
3. Server functions + public read functions.
4. Admin routes + UI screens (Control Center landing, site, pages, gateways).
5. Wire public pages + header/footer/portal shell to live settings.
6. Extend user management sheet (email/password/photo/KYC).
7. Verify build, smoke-check admin nav.