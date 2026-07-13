# Infrastructure — Firebase Backend, Firestore Persistence & Stateless Auth

## Problem and Goal

«Raiymbek Park» needs a backend whose state — every resident's profile, the home
screen's content, and the verification trust that gates registration — is durable across
server restarts and Cloud Function cold starts, and whose idle cost trends to zero.

The system meets this with a stateless, Firestore-backed Firebase footprint: the tRPC API
runs on a scale-to-zero Cloud Function that holds no in-memory or hardcoded state. All
backend state lives in Firestore and is reached only through the Admin SDK. Identity is
established per-request from a verified Firebase ID token — there are no server-stored
sessions or tokens to lose on a restart. The API issues and checks the phone verification
code itself and delivers it through an SMS gateway; the only verification state it keeps is a
short-lived, expiring record in Firestore, so nothing is lost on a restart. See ADR 013 for
the gateway and custom-token mechanics.

## Users

- **Residents** — register once; their profile and the home content they see survive server
  restarts and cold starts. Each call carries their own verified identity.
- **The development team** — backend state is inspectable in the Firebase console; no hidden
  in-process state. Security rules guarantee Firestore is reachable only through the API.

## Scope

### What's included

- **Firebase project `raiymbek-park-sa99`** on the Blaze (pay-as-you-go) plan — the
  prerequisite for Cloud Functions gen2 and scale-to-zero. Project resources live in region
  `europe-west1`.
- **All backend state persists in Firestore (native mode) via the Admin SDK.** No in-memory
  caches and no hardcoded data back any API response. Collections:
  - `residents/{uid}` — `{ name, phone, block, apartment, role, lastVisit }`. The document id
    is the resident's Firebase Auth `uid`. `lastVisit` is a server timestamp marking the last
    time the resident opened the home screen.
  - `serviceContacts/{id}` — `{ name, role, phone, glyph, tone, order }`. The home screen's
    service-contact list, ordered by `order` ascending. Editable in the console without a
    redeploy.
  - `events/{id}` — `{ kind, title, text, glyph, tone, createdAt }`. The home screen's
    "changes" feed, ordered by `createdAt` descending and limited to 10. When a resident has a
    `lastVisit`, only events created after it are returned. Editable in the console without a
    redeploy.
  - `otps/{phone}` — the pending verification code for a phone number, keyed by the E.164
    number. It holds the code as a salted hash (never plaintext), an expiry, and send/verify
    attempt counters. Records are short-lived: they expire and are removed once the code is
    verified or superseded.
- **Server-issued verification code delivered over the smsc.kz SMS gateway.** The tRPC API
  exposes `otp.send` and `otp.verify`. `otp.send` generates a 6-digit code, stores its hash in
  `otps/{phone}`, and delivers it to the resident through the smsc.kz SMS gateway. `otp.verify`
  checks the submitted code against the stored hash, and on success mints a Firebase **custom
  token** that the client exchanges for a Firebase session. The resulting ID token carries the
  resident's phone, so token verification and identity derivation are unchanged. The gateway
  credentials, code format, expiry, rate limits, and custom-token flow are specified in ADR 013.
- **Stateless, token-based auth.** The tRPC context reads a `Bearer` **Firebase ID token**
  from the `Authorization` header, verifies it with the Admin SDK (`getAuth().verifyIdToken`),
  and derives `{ uid, phone }`. A request with no token, or with a token that fails
  verification, carries `{ uid: null, phone: null }`. There are no server-stored sessions,
  refresh tokens, or login records. Mutations that require identity (`resident.register`,
  `resident.markVisit`) reject with `UNAUTHORIZED` when `uid` is null.
- **Rate-limited send endpoint.** `otp.send` is protected against SMS-bombing by the API
  itself — a per-phone minimum interval between sends and a cap on sends per rolling window,
  after which it returns a too-many-requests error — with no client-side challenge. Concrete
  limits are in ADR 013.
- **API on Cloud Functions gen2** — the tRPC router (`appRouter`) is served from one HTTPS
  function (`api`) with `region: europe-west1`, `minInstances: 0` (sleeps when idle), and CORS
  restricted to the GitHub Pages origin `https://raiymbek-park.github.io`. End-to-end tRPC
  types flow to the web client with no codegen.
- **Firestore security rules** — deny-all to clients (`allow read, write: if false` on every
  path). The Admin SDK bypasses these rules, so the API function is the only reader and writer
  of `residents`, `serviceContacts`, `events`, and `otps`.
- **Storage security rules** — `assets/**` is world-readable and not client-writable;
  `users/{uid}/**` is readable and writable only by the matching authenticated owner; every
  other path is denied.
- **Firebase project configuration** — custom-token sign-in and authorized domains configured;
  the phone sign-in provider is no longer used. Verification-code delivery and its cost cap are
  owned by the smsc.kz SMS gateway (its account balance bounds SMS spend), not by a Firebase SMS
  quota.
- **smsc.kz gateway credentials** — the gateway `login` + password (or API key) are held as
  required Firebase Functions secrets and set out of band; deployment fails until they exist in
  the project. The sender name is optional (not a secret) — the gateway's default sender is used
  when it is unset. None of these enter the repository or the web bundle. See ADR 013 for the
  secret names and setup.
- **Local-dev credentials without a service-account key** — the Admin SDK authenticates
  against the live project locally by building an `authorized_user` ADC file from the Firebase
  CLI's stored refresh token (the well-known firebase-tools OAuth client id/secret), written to
  a temp file pointed at by `GOOGLE_APPLICATION_CREDENTIALS`. No service-account key and no
  `gcloud` are required. This is skipped in production, when credentials are already set, or
  when the Firestore emulator host is configured.
- **Web client Firebase config** — `apps/web` initializes Firebase with the public project
  config (api key, auth domain, project id, storage bucket, sender id, app id) and exposes a
  shared `auth` instance. The API base URL and router base path come from `VITE_API_URL` and
  `VITE_BASE`.
- **Continuous deployment on push to `main`.** The GitHub Actions pipeline
  (`.github/workflows/fallow.yml`) gates deployment on the `checks` job (lint, typecheck, FSD
  lint, unit tests); only when it passes do two independent jobs run. `deploy-web` builds
  `apps/web` with `VITE_BASE=/platform/` and the `VITE_API_URL` repository variable and
  publishes it to GitHub Pages through the official `actions/deploy-pages` artifact flow (Pages
  source is "GitHub Actions"). `deploy-firebase` runs `firebase deploy --only
  functions,firestore,storage` against `raiymbek-park-sa99`. It authenticates keylessly, the
  same way local dev does: the `FIREBASE_TOKEN` secret (a `firebase login:ci` token) is used as
  the refresh token in an `authorized_user` ADC file — built in-step with the well-known
  firebase-tools OAuth client id/secret and pointed at by `GOOGLE_APPLICATION_CREDENTIALS` —
  rather than the deprecated `--token`/`FIREBASE_TOKEN` auth path. Each target deploys
  atomically, so a failure in one leaves the previously published version live. The web build emits `404.html`
  (a copy of `index.html`) so SPA deep links resolve on Pages.

### What's NOT included

- **Server-stored sessions or refresh tokens** — identity is per-request from the ID token; the
  backend stores no session or refresh-token state. The only verification state kept is the
  short-lived, expiring `otps/{phone}` record consumed at verify time.
- **A content-management collection** — home content is sourced from the `serviceContacts` and
  `events` collections directly; there is no separate `content` collection.
- **A committed seed script or any seeded personal data** — real service contacts and events
  live only in Firestore. No PII is committed to the repository.
- **Onboarding/home UI and behavioral logic** — this feature defines their backend data source
  and security boundary only, not their on-screen behavior.
- **Resident-file upload/download UI** — Storage paths are secured by rules, but no upload
  screen ships here.
- **A custom domain** — the default Firebase / GitHub Pages URLs are used.
- **Staging/preview environments, per-PR deploy previews, multi-region replication, backups,
  and load testing.**

## User Journey

A resident opens the web app, which initializes Firebase with the project's public config. To
register, the resident enters a phone number; the client calls `otp.send`, the `api` function
generates a code, stores its hash in `otps/{phone}`, and delivers it over the smsc.kz SMS
gateway. The resident enters the code; the client calls `otp.verify`, the function checks it and
returns a Firebase custom token, and the client exchanges it for a Firebase session. From then
on the client attaches the resident's ID token to every API call. The `api` Cloud Function —
cold-starting if it had idled to zero — verifies that token, derives the resident's `uid` and
phone, and writes `residents/{uid}` in Firestore. On later visits the home
screen reads the resident's profile, the `serviceContacts` list, and recent `events` (those
after the resident's `lastVisit`) through the same function; because nothing lives in process
memory, the data is identical before and after the backend scales to zero and back. An editor
changes a `serviceContacts` or `events` document in the Firebase console and the home screen
reflects it on the next load, with no code deploy.

## Success Metrics

- A registered resident's profile and the home content are identical before and after the
  backend idles to zero instances and cold-starts — no state is held in process memory.
- A mutation that requires identity succeeds only when accompanied by a verifiable Firebase ID
  token, and is rejected as `UNAUTHORIZED` otherwise.
- Editing a `serviceContacts` or `events` document in the console changes what the app shows on
  the next load, with no code deploy.
- A direct client-SDK read or write of `residents`, `serviceContacts`, `events`, or `otps` is
  denied by the security rules.
- A resident who enters a valid phone number receives the code over the smsc.kz SMS gateway and,
  on entering it, obtains a Firebase session whose ID token authorizes API mutations.
- Idle backend cost trends to ~zero — no always-on instances.

## Non-functional Requirements

- **Cost efficiency** — `minInstances: 0` on the function; no provisioned always-on compute.
  Firestore and Storage on usage-based pricing. SMS cost is bounded by the smsc.kz account
  balance and the server-side send rate limits.
- **Cold-start budget** — the first request after idle responds within 5 s; warm requests
  within 500 ms.
- **Security** — Firebase Admin credentials, the local-dev refresh token, and the smsc.kz
  gateway credentials are never in the web bundle; only `VITE_*` public config and the public
  Firebase web config (safe to ship) are embedded. Verification codes are stored only as salted
  hashes, never plaintext. Firestore and Storage rules deny client access by default; the web
  app reaches resident, contact, event, and OTP data only through the API. CORS on the function
  is restricted to the Pages origin.
- **Compatibility** — mobile-first web; no keyboard-accessibility work (per project scope).
- **Data location** — Firestore and Storage in `europe-west1`.

## Dependencies

- A Google Cloud / Firebase project (`raiymbek-park-sa99`) on **Blaze billing** (required for
  gen2 functions).
- **An smsc.kz account** with a positive balance, an approved sender name, and credentials set
  as Firebase Functions secrets (see ADR 013).
- **Firebase custom-token sign-in** and authorized domains configured; the Firebase phone
  sign-in provider is no longer required.
- The Firebase CLI (`firebase-tools`) logged in locally — its stored refresh token is the
  source of the local-dev Admin SDK credentials.
- The existing `apps/api` tRPC router, `apps/functions` HTTPS function wrapper, and `apps/web`
  Vite/TanStack Router setup.

## Open Questions

None — the API host (Cloud Functions gen2), datastore (Firestore via Admin SDK), auth model
(stateless ID-token verification, no server sessions), verification-code delivery (server-issued
OTP over the smsc.kz SMS gateway with a Firebase custom-token exchange, per ADR 013), and
home-content source (`serviceContacts` and `events` collections) are all decided.
