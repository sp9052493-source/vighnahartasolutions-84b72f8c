## Goal

Reproduce the suspected authentication failure in a fresh (incognito-equivalent) browser session against the live preview, capture exactly which page loads at each step, and surface any console/network errors. Then report back — no code changes in this pass.

## Scenarios to reproduce

Run all four against `http://localhost:8080` with a brand-new Playwright context (no saved storage, no Supabase session). Screenshot every step.

1. **Cold visit to `/`** — confirm the landing page renders for an unauthenticated visitor with no auto-redirect.
2. **Direct deep-link to `/dashboard`** (protected) — confirm the `_authenticated` gate redirects to `/auth` instead of rendering the dashboard or flashing protected content.
3. **Direct deep-link to `/admin`** (admin-only) — same expectation: redirect to `/auth`.
4. **Sign-in flow** — open `/auth`, submit invalid credentials (expect toast error, stay on `/auth`), then submit valid credentials (expect redirect to `/dashboard`). Then hit `/admin` as a non-admin retailer if one is available; expect block.

Optional 5th step if the first four pass: **sign out from `PortalShell`**, then press Back — confirm we land back on `/auth`, not a cached `/dashboard`.

## What I'll capture per step

- Final URL after navigation settles
- Visible page heading / first meaningful text
- Any console errors (filtered)
- Any failing network requests (status >= 400), with request path and response body snippet
- Screenshot saved under `/tmp/browser/auth-repro/screenshots/`

## What I need from you

One of the following so I can run scenario 4 end-to-end:

- A retailer test account (email + password) I can use against the live Supabase, **or**
- Permission to create a throwaway retailer via the admin API for this repro, **or**
- Confirmation that I should run only scenarios 1–3 (no real sign-in) for now.

If you just want me to verify the gate-and-redirect behavior without touching real credentials, scenarios 1–3 are enough and I can run them immediately on approval.

## Out of scope for this pass

- No code edits.
- No DB migrations.
- No changes to RLS, sessions, or sign-out logic. If a real bug surfaces, I'll come back with a separate fix plan.

## Deliverable

A single report listing, per scenario: expected page, actual page, URL, console errors, failing network calls, screenshot path. Then a verdict: auth flow is sound, or here is the exact reproducible bug.