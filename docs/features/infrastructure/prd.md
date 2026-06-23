# Infrastructure — Firebase Backend, Storage, GitHub Pages Hosting & CI/CD

## Problem and Goal

«Raiymbek Park» must be reachable at a stable public URL, with each resident's profile,
session, and verification state durable across server restarts and function cold starts.
Every merge to `main` must reach production without manual deploy steps, and the backend
must cost near-zero while idle.

The system meets this with a persistent, cost-efficient Firebase footprint: the tRPC API
runs on a scale-to-zero Cloud Function backed by Firestore, durable Storage holds app assets
and resident files, the web app is published at a stable public URL, and a CI/CD pipeline
ships every merge automatically.

## Users

- **Residents** — reach the app at a stable public URL; their profile, session, and
  verification state survive server restarts and cold starts.
- **The development team** — merge to `main` and the change reaches production without
  manual deploy steps; backend state is inspectable in the Firebase console.

## Scope

### What's included

- **Firebase project** on the Blaze (pay-as-you-go) plan — the prerequisite for Cloud
  Functions gen2 and scale-to-zero. Project resources live in region `europe-west1`
  (configurable).
- **Firestore (native mode)** is the persistent datastore for all resident, OTP, and
  content data:
  - `residents/{uid}` — registered resident profile (name, block, apartment, role, phone).
  - `otpSessions/{phone}` — OTP state per number (send count, resend/lockout timestamps,
    attempt-used flag, verified flag) — the durable home for the onboarding rules.
  - `sessions/{id}` — refresh-token records (hashed token, expiry, single-use flag).
  - `content/{changes|services|contacts}` — home screen content, editable without a
    redeploy.
- **API on Cloud Functions gen2** — the existing tRPC router served from one HTTPS function
  (`api`), `minInstances: 0` (sleeps when idle), CORS restricted to the GitHub Pages
  origin. The web app reaches it via `VITE_API_URL`, with end-to-end tRPC types flowing to
  the web client (no codegen).
- **Persistent OTP, session, and registration** — the onboarding rules (resend ladder
  60→120→300→600 s, 24-hour lockout, one-attempt-per-code, 30-day session with single-use
  renewal) operate against Firestore, surviving cold starts and redeploys, exactly as
  specified in `docs/features/onboarding/prd.md`.
- **Real verification-code delivery** — the 4-digit code is sent over WhatsApp via a
  provider (default: Twilio WhatsApp API) from the Cloud Function. Provider credentials are
  server-side secrets.
- **Firebase Storage** — one bucket with security rules and a path convention: `assets/**`
  (public read, deploy-write) for app assets and `users/{uid}/**` (owner-only read/write)
  for resident files.
- **GitHub Pages hosting** — `apps/web` published at
  `https://raiymbek-park.github.io/platform/` (`VITE_BASE=/platform/`, router basename
  matched, SPA deep-link fallback via `404.html`).
- **CI/CD deployment** — on push to `main`, after the existing checks (lint, typecheck,
  tests) pass: build and publish the web app to GitHub Pages, and deploy the function,
  Firestore rules/indexes, and Storage rules to Firebase. Firebase auth via a service
  account in GitHub secrets.

### What's NOT included

- Onboarding/home UI and behavioral logic — out of scope to modify; this feature defines
  their data source and hosting only, not their behavior.
- Resident-file upload/download features in the UI — Storage is provisioned and secured,
  but no upload screen ships here.
- Serving the existing bundled illustrations from Storage — they remain in the Vite bundle.
- Firebase Authentication / Phone Auth — the custom token + OTP flow is retained.
- A custom domain — the default `github.io/platform/` URL is used.
- Staging/preview environments and per-PR deploy previews — a single production
  environment.
- Multi-region replication, backups/restore tooling, and load testing.

## User Journey

A resident opens `https://raiymbek-park.github.io/platform/`. The web app, served as static
files by GitHub Pages, calls the `api` Cloud Function. On first call the function
cold-starts; it reads and writes resident, OTP, and content data in Firestore. The resident
registers, receives a real 4-digit code over WhatsApp, verifies, and gets a session — all of
which persist, so a returning resident with a valid session lands on home even after the
backend has scaled to zero and back. Home content is read from Firestore and can be edited
in the console without shipping code.

A developer merges a branch to `main`. CI runs the existing checks, then builds the web app
and publishes it to GitHub Pages, and deploys the function and security rules to Firebase.
Within minutes the merged change is live at the public URL with no manual steps.

## Success Metrics

- Resident profile, session, and OTP state survive a function cold start and a redeploy — a
  registered resident with a valid session reaches home after the backend has idled to zero
  instances.
- Home content changes made in Firestore appear in the app without a code deploy.
- A real WhatsApp code is delivered to a live number and verifies successfully.
- A push to `main` results in the updated web app and backend being live, with no manual
  deploy command.
- Idle backend cost trends to ~zero — no always-on instances.

## Non-functional Requirements

- **Cost efficiency** — `minInstances: 0` on the function; no provisioned always-on compute.
  Firestore and Storage on usage-based pricing.
- **Cold-start budget** — first request after idle responds within 5 s; warm requests within
  500 ms.
- **Security** — provider and Firebase credentials are server-side secrets, never in the web
  bundle. Firestore and Storage rules deny client access by default; the web app reaches data
  only through the API. CORS on the function is restricted to the Pages origin.
- **Compatibility** — mobile-first web; no keyboard-accessibility work (per project scope).
- **Data location** — Firestore and Storage in `europe-west1` (configurable at
  provisioning).

## Dependencies

- A Google Cloud / Firebase account with **Blaze billing** enabled (required for gen2
  functions; user-provided).
- A **Twilio account** (or equivalent) with a WhatsApp-enabled sender and an approved message
  template (user-provided credentials).
- GitHub repository **Pages enabled** and **Actions secrets** for the Firebase service
  account and provider credentials.
- The existing `apps/api` tRPC router and `apps/web` Vite/TanStack Router setup.

## Open Questions

None — the API host (Cloud Functions gen2), datastore (Firestore), OTP strategy (retain
custom flow + real provider), content storage (Firestore), and hosting URL (default Project
Pages) are all decided. Provider account setup and billing enablement are user-side
prerequisites, not unresolved design questions.
