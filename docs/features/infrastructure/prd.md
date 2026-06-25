# Infrastructure — Firebase Backend, Firestore Persistence & Stateless Auth

## Problem and Goal

«Raiymbek Park» needs a backend whose state — every resident's profile, the home
screen's content, and the verification trust that gates registration — is durable across
server restarts and Cloud Function cold starts, and whose idle cost trends to zero.

The system meets this with a stateless, Firestore-backed Firebase footprint: the tRPC API
runs on a scale-to-zero Cloud Function that holds no in-memory or hardcoded state. All
backend state lives in Firestore and is reached only through the Admin SDK. Identity is
established per-request from a verified Firebase ID token — there are no server-stored
sessions or tokens to lose on a restart. Verification codes are delivered by Firebase Phone
Authentication directly from the client to Google, so the server neither generates nor sends
them.

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
- **Stateless, token-based auth.** The tRPC context reads a `Bearer` **Firebase ID token**
  from the `Authorization` header, verifies it with the Admin SDK (`getAuth().verifyIdToken`),
  and derives `{ uid, phone }`. A request with no token, or with a token that fails
  verification, carries `{ uid: null, phone: null }`. There are no server-stored sessions,
  refresh tokens, or login records. Mutations that require identity (`resident.register`,
  `resident.markVisit`) reject with `UNAUTHORIZED` when `uid` is null.
- **Verification-code delivery via Firebase Phone Authentication.** The web client calls
  `signInWithPhoneNumber` with an invisible reCAPTCHA verifier; Google sends the SMS code
  directly to the resident and returns the confirmation result. The server generates no codes,
  sends no SMS, and stores no OTP state. On confirmation the client holds a Firebase session
  and obtains the ID token that authorizes API mutations.
- **API on Cloud Functions gen2** — the tRPC router (`appRouter`) is served from one HTTPS
  function (`api`) with `region: europe-west1`, `minInstances: 0` (sleeps when idle), and CORS
  restricted to the GitHub Pages origin `https://raiymbek-park.github.io`. End-to-end tRPC
  types flow to the web client with no codegen.
- **Firestore security rules** — deny-all to clients (`allow read, write: if false` on every
  path). The Admin SDK bypasses these rules, so the API function is the only reader and writer
  of `residents`, `serviceContacts`, and `events`.
- **Storage security rules** — `assets/**` is world-readable and not client-writable;
  `users/{uid}/**` is readable and writable only by the matching authenticated owner; every
  other path is denied.
- **Firebase project configuration** — phone sign-in provider enabled, an SMS region policy
  set, test phone numbers registered, and authorized domains configured. The daily
  `send_verification_code` quota is capped as a cost cap; this is distinct from the
  login/token verification quotas.
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

### What's NOT included

- **Server-side OTP, sessions, or refresh tokens** — verification is delegated to Firebase
  Phone Auth and identity is per-request from the ID token; the backend stores no OTP, session,
  or token state.
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
register, the resident enters a phone number; the client triggers Firebase Phone
Authentication, Google sends an SMS code, and the resident enters it. On confirmation the
client holds a Firebase session and attaches the resident's ID token to every API call. The
`api` Cloud Function — cold-starting if it had idled to zero — verifies that token, derives the
resident's `uid` and phone, and writes `residents/{uid}` in Firestore. On later visits the home
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
- A direct client-SDK read or write of `residents`, `serviceContacts`, or `events` is denied by
  the security rules.
- Idle backend cost trends to ~zero — no always-on instances.

## Non-functional Requirements

- **Cost efficiency** — `minInstances: 0` on the function; no provisioned always-on compute.
  Firestore and Storage on usage-based pricing. The `send_verification_code` quota is capped to
  bound SMS cost.
- **Cold-start budget** — the first request after idle responds within 5 s; warm requests
  within 500 ms.
- **Security** — Firebase Admin credentials and the local-dev refresh token are never in the
  web bundle; only `VITE_*` public config and the public Firebase web config (safe to ship) are
  embedded. Firestore and Storage rules deny client access by default; the web app reaches
  resident, contact, and event data only through the API. CORS on the function is restricted to
  the Pages origin.
- **Compatibility** — mobile-first web; no keyboard-accessibility work (per project scope).
- **Data location** — Firestore and Storage in `europe-west1`.

## Dependencies

- A Google Cloud / Firebase project (`raiymbek-park-sa99`) on **Blaze billing** (required for
  gen2 functions).
- **Firebase Phone Authentication** enabled, with an SMS region policy, test numbers, and
  authorized domains configured.
- The Firebase CLI (`firebase-tools`) logged in locally — its stored refresh token is the
  source of the local-dev Admin SDK credentials.
- The existing `apps/api` tRPC router, `apps/functions` HTTPS function wrapper, and `apps/web`
  Vite/TanStack Router setup.

## Open Questions

None — the API host (Cloud Functions gen2), datastore (Firestore via Admin SDK), auth model
(stateless ID-token verification, no server sessions), verification-code delivery (Firebase
Phone Auth), and home-content source (`serviceContacts` and `events` collections) are all
decided.
