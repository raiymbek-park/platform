# 014. Push notifications: FCM Web Push, scheduled hourly digest, per-device token registration

**Date:** 2026-07-14
**Status:** accepted

## Context

The push-notifications feature (`docs/features/push-notifications/prd.md`) requires reaching a
resident's device with new activity while the app is closed, as one aggregated digest per hour rather
than one message per event.

Constraints shaping the decision:

- **The web app is a plain SPA served from GitHub Pages under the base path `/platform/`**
  (`VITE_BASE=/platform/`, `apps/web/vite.config.ts`). There is no native shell — no Tauri, no
  React Native — so the only delivery path is the browser's Push API. `firebase.json` has no
  `hosting` block; only functions, firestore, and storage deploy to Firebase.
- **Firestore is locked down end to end** (`firestore.rules`: `allow read, write: if false`). Every
  client access goes through the tRPC API on the Admin SDK, so a client cannot write its own token
  document.
- **The event computation already exists** — `getEvents(uid, role, lastVisit)` in
  `apps/api/src/events/events-store.ts` returns the discriminated union the Home feed renders,
  already excluding the resident's own actions and already honouring the `watch` subscription and the
  staff-sees-all-issues rule.
- **Cloud Functions v2 hosts the API and the translation triggers** in `europe-west1`. There is no
  scheduled function yet.
- **`apps/functions` has no test infrastructure by design** (`.arcana/project-context.md`): triggers
  are thin wrappers, and all orchestration lives in `apps/api`, which has Vitest and the
  `vi.mock('../firestore', …)` convention.
- **The API localizes by caller locale** (`ctx.locale` from the `x-locale` header,
  `apps/api/src/i18n.ts`). A scheduled run has no caller and no request header.
- **`firebase-admin` is already a dependency** of both `apps/api` and `apps/functions`; only
  `/app`, `/auth`, `/firestore`, and `/storage` are imported so far.

Four questions need deciding: **which transport**, **how delivery is triggered**, **where the device
token lives**, and **how the digest window is anchored**.

## Options Considered

### Transport

#### Option 1: Third-party push service (OneSignal, Pusher Beams)

- **Pros:** Dashboard, segmentation, analytics, and delivery reporting for free; no service-worker
  code to own.
- **Cons:** A new vendor, a new account, and a new secret for a capability the project's existing
  Firebase project already includes; resident identifiers and activity metadata leave the stack for a
  third party; per-MAU pricing for a feature with no revenue.

#### Option 2: Raw Web Push (VAPID) with a hand-rolled sender

- **Pros:** No vendor beyond the browser vendors' own push services; full control of the payload.
- **Cons:** The project owns encryption, per-browser endpoint quirks, retry, and 410-Gone pruning by
  hand; every one of these is a bug surface that FCM already absorbs, and none of it is the feature's
  value.

#### Option 3 (chosen): Firebase Cloud Messaging Web Push

FCM is the messaging half of the Firebase project the app already runs on
(`apps/web/src/shared/firebase/config.ts` already carries `messagingSenderId`). The web SDK obtains a
registration token via `getToken(messaging, { vapidKey, serviceWorkerRegistration })`; the server
sends with `getMessaging().sendEachForMulticast(...)` from `firebase-admin/messaging`, already a
dependency.

- **Pros:** No new vendor, account, or bill; `firebase-admin` is already installed and already
  authenticated in the Functions runtime, so the send path needs no new credential plumbing beyond
  the VAPID key; FCM handles per-browser endpoints, encryption, and retry; invalid tokens surface as
  a typed error code the sender can act on.
- **Cons:** Ties the feature to Firebase (already true of auth, storage, and the whole data layer);
  requires owning a service worker file; the FCM web SDK's own SW imports the compat bundle.

### Trigger

#### Option 1: Firestore `onDocumentWritten` trigger per event source

The pattern the translation triggers already use — react to each post/issue/comment write and send.

- **Pros:** Reuses an established pattern in the codebase; delivery is immediate.
- **Cons:** **Directly contradicts the PRD's core requirement.** One message per write is exactly the
  behaviour the digest exists to prevent. Batching on top of triggers means holding pending state and
  a timer per resident — re-implementing a scheduler on top of triggers.

#### Option 2: Cloud Tasks with a per-resident debounce

- **Pros:** True per-resident batching windows; each resident's digest lands one hour after *their*
  first unseen event rather than on a shared clock.
- **Cons:** A queue, a handler endpoint, task deduplication, and IAM — new infrastructure for a
  complex of a few hundred residents; the per-resident window is a refinement nobody has asked for.

#### Option 3 (chosen): `onSchedule` Cloud Function, hourly

A v2 scheduled function in `europe-west1` runs at the top of every hour, iterates residents that have
at least one registered token, computes their window's events, sends one digest each, and advances
their marker.

- **Pros:** The cadence *is* the requirement, expressed directly — no batching machinery to build;
  one moving part; quiet hours are a comparison on the run's clock; a missed or failed run is simply
  covered by the next one, because the anchor is stored state rather than in-flight state.
- **Cons:** Up to an hour of latency for a fresh event (accepted — the PRD chooses this trade
  explicitly); the run scans residents with tokens each hour whether or not anything happened.

### Token storage

#### Option 1: Array field on the resident document (`pushTokens: string[]`)

- **Pros:** One read to fetch a resident's devices; no subcollection.
- **Cons:** Concurrent registrations from two devices race on one document; pruning a dead token is a
  read-modify-write; no per-device metadata without a parallel array; the document grows unbounded in
  the pathological case.

#### Option 2 (chosen): `residents/{uid}/pushTokens/{token}` subcollection

The token is the document id — making registration idempotent by construction — and the document
carries `{ locale, updatedAt }`.

- **Pros:** Mirrors the existing `residents/{uid}/watches/{issueId}` subscription shape, so the
  codebase gains no new idea; registration is a `set(..., { merge: true })` with no transaction;
  pruning is a `delete` on a known path; per-device `locale` has somewhere to live; a
  `collectionGroup('pushTokens')` query enumerates exactly the residents the run must consider,
  skipping everyone who never granted permission.
- **Cons:** A `collectionGroup` query needs its scope understood (it is unfiltered, so no composite
  index is required); the run does one extra read per resident.

Registration flows through a tRPC mutation (`notifications.registerToken` / `unregisterToken`)
because the client cannot write Firestore directly. The mutation takes the token from its input and
the **locale from `ctx.locale`** — the header the client already sends — so the device's reading
language is captured at registration time and is available to a run that has no caller.

### Window anchor

#### Option 1: `lastNotifiedAt` alone

- **Cons:** Pushes events the resident already read on Home — the exact annoyance the feature must
  avoid.

#### Option 2: `lastVisit` alone

- **Cons:** A resident who never opens the app has a frozen anchor, so every digest re-sends the
  whole backlog forever.

#### Option 3 (chosen): `max(lastVisit, lastNotifiedAt)`

- **Pros:** Each of the two failure modes above cancels the other. Seen-on-Home events are excluded
  by `lastVisit`; already-pushed events are excluded by `lastNotifiedAt`; both are timestamps already
  on (or trivially added to) the resident document, and `getEvents` already takes the anchor as its
  parameter.
- **Cons:** Two markers to reason about when debugging "why did/didn't I get a push".

## Decision

Deliver via **FCM Web Push**. Register each device through a **tRPC mutation** that stores the token
as the document id under **`residents/{uid}/pushTokens/{token}`** with the device's `locale` taken
from `ctx.locale`; delete the same token from every other resident's `pushTokens` as part of that
registration — a `collectionGroup('pushTokens')` query on the token id finds the stale documents —
and prune it when FCM answers `messaging/registration-token-not-registered`. The
`unregisterToken` mutation is the counterpart API and has no web caller in this iteration.

Build and send digests from an **hourly `onSchedule` v2 function** in `europe-west1`, which is a thin
wrapper over an exported `apps/api` function (`sendDigests`) holding all orchestration and carrying
the tests — the same split the translation triggers use. The run:

1. Enumerates residents via `collectionGroup('pushTokens')`.
2. Skips the run entirely when the current Asia/Almaty hour falls in **22:00–08:00**.
3. Computes each resident's events with the existing `getEvents(uid, role, anchor)` where
   `anchor = max(lastVisit, lastNotifiedAt)` — **`getEvents`' third parameter is renamed from
   `lastVisit` to `since`**, which is the whole extent of the change to the events module.
4. Sends one multicast message per resident to that resident's tokens, with copy authored server-side
   per token locale via the existing `apps/api/src/i18n.ts` catalogue, `collapseKey`/`tag` set per
   resident so a newer digest replaces an unread one, and `fcmOptions.link` pointing at the deployed
   Home URL — the Pages origin plus the `/platform/` base, since `fcmOptions.link` takes an absolute
   HTTPS URL rather than a route path.
5. Advances `lastNotifiedAt` **only after** a send that FCM accepted for at least one token.

Serve the service worker as a **static file at `apps/web/public/firebase-messaging-sw.js`**, which
Vite copies verbatim to `dist/`, publishing it at **`/platform/firebase-messaging-sw.js`** with scope
`/platform/`. It is registered explicitly (`navigator.serviceWorker.register(url, { scope })`) and
the resulting registration is handed to `getToken` — the SDK's default lookup assumes the origin
root and does not find a worker under a base path. The Firebase config is **inlined literally** in
the worker: it is a classic script outside Vite's module graph, so it receives no `import.meta.env`
substitution, and the values are public identifiers already committed in
`apps/web/src/shared/firebase/config.ts`.

Ship a **`manifest.webmanifest`** and link it from `index.html`, because iOS Safari delivers web push
only to an app installed to the Home Screen, and installation requires a manifest.

The **VAPID key** is public and ships in the web bundle (`VITE_FCM_VAPID_KEY`). No new *secret* is
needed on the Functions side: `firebase-admin` sends under the runtime service account's own
credentials, exactly as the existing Firestore access does.

## Consequences

### Positive

- No new vendor, no new bill, and no new server-side secret; the send path authenticates with the
  credentials the runtime already holds.
- The digest and the Home feed cannot drift apart: both call `getEvents`, so a change to what counts
  as new activity — a new event kind, a change to the own-action exclusion — lands on both surfaces
  at once, and the events module's unit tests cover both.
- The `pushTokens` subcollection is the same shape as `watches`, so the storage model teaches nothing
  new to a reader of the codebase.
- Token registration is idempotent for free (the token is the document id), so a client may register
  on every Home load — the natural way to pick up FCM's token rotation — with no dedupe logic.
- Failure is contained by construction: `lastNotifiedAt` advances only on a delivered digest, so a
  crashed or retried run re-covers the same window rather than skipping it, and a resident whose send
  throws does not abort the loop.
- Quiet hours cost one clock comparison, because the schedule is a real clock rather than N in-flight
  timers.

### Negative

- Up to one hour of latency between an event and its notification; genuinely urgent
  broadcast (an evacuation) is not what this channel delivers.
- The project now owns a service worker — a second, separate runtime with its own cache and update
  semantics, and a file whose Firebase config is duplicated from `config.ts` by hand. A change to the
  Firebase project's identifiers must be made in both places; nothing mechanical enforces it.
- iOS delivery requires the resident to install the app to their Home Screen. Most will not, so
  **iOS reach is structurally lower than Android's** for reasons the code cannot fix. The manifest
  makes installation possible, not likely.
- The hourly run touches Firestore even when the complex was silent (one collection-group read plus a
  per-resident read); at a few hundred residents this is negligible, but it is a floor that does not
  drop to zero.
- `apps/functions` gains a scheduled function, which Cloud Scheduler bills as a job and which cannot
  be exercised locally without the emulator's scheduler support.
- Events beyond the tenth in a window are reported as a count only and are read on Home rather than
  re-pushed — an accepted under-report inherited from the feed's `EVENT_LIMIT`.

### Neutral

- The web app gains a manifest and therefore becomes installable as a PWA on Android too; this is a
  side effect, not a goal, and no offline caching is introduced with it.
- Relationship to ADR 001 (state boundaries): a digest is a server-side projection over server truth;
  the client stores only the fact that permission was already requested on this device, which is
  device state and belongs in neither the query cache nor the router.
- Relationship to ADR 012 (translation): digest copy is a fixed server-authored catalogue string, not
  LLM-translated content; the event's own title, when named in a digest, is the stored original.
