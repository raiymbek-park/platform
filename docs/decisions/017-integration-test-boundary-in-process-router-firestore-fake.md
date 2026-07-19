# 017. Integration test boundary: real in-process router with an in-memory Firestore fake

**Date:** 2026-07-19
**Status:** accepted

## Context

Two disconnected test worlds left the web↔api contract unverified on both sides:

- **Web (jsdom)** integration tests ran the real React + store + TanStack Query + tRPC
  client, but the *entire server* was faked as canned JSON by hand-written MSW resolvers
  (`apps/web/src/shared/test/trpc-server.ts`). The real tRPC router, zod validation,
  authorization, derivation, and projection never executed.
- **API (node)** tests ran the real router and stores but mocked Firestore per-test via
  `vi.mock('../firestore')`.

Nothing exercised the seam between them: the web tests asserted against a fabricated
backend, and could drift from what the real router produces (a false-positive class). This
is exactly the "network is not the boundary — don't fabricate your own backend" anti-pattern
the arc-test testing-strategy now forbids (see also ADR 006).

The goal: **wide-boundary integration** — drive the real UI, run the real backend, and mock
only the true external edge (the datastore, plus third-party services). The seam between the
web client and our own server is internal, not a boundary.

A blocking constraint surfaced while wiring this: **Vitest externalizes the workspace
package `@raiymbek-park/api`** (it resolves through a `node_modules` symlink), so a web test
cannot intercept `firebase-admin` inside the api with `vi.mock`. Left unmocked, `getDb()`
initializes real firebase-admin, and `dev-credentials.ts` picks up the local firebase-CLI
token — meaning tests would hit **production Firestore** (reads, and writes on create paths).

## Options Considered

1. **In-process real router + in-memory Firestore fake, injected via a DI seam (chosen).**
   The tRPC client's transport calls `fetchRequestHandler(appRouter)` in-process (no socket);
   the datastore is an in-memory fake injected into `apps/api/src/firestore.ts`, so
   firebase-admin never initializes.
2. **Firestore emulator.** Real Firestore semantics, but an external process, slower, and
   heavier setup — wrong tradeoff for hundreds of fast integration tests, and contrary to the
   in-memory goal.
3. **Keep the fabricated-backend MSW resolvers.** Rejected — it is the anti-pattern this work
   exists to remove.
4. **Mock `firebase-admin` from the web test.** Not viable: the api package is externalized by
   Vitest, so module mocking does not reach it (this is *why* option 1 injects instead).

## Decision

- **Transport.** Web integration tests render the real app and route the tRPC client through
  `fetchRequestHandler({ router: appRouter, createContext })` in-process. No HTTP server, no
  socket, no MSW. The injected `createContext` sets the viewer identity (`uid`) directly —
  token verification is a genuinely external boundary (Firebase Auth) and is not exercised.
- **Datastore = the only mock.** An in-memory Firestore fake
  (`apps/api/src/test/firestore-fake.ts`) faithfully implements the subset of the Firestore
  Admin API the code uses (subcollections with auto-ids, `runTransaction`, queries incl.
  `array-contains-any`/`orderBy`/`startAfter`/`limit`, `FieldValue`, a `Timestamp` class,
  monotonic server timestamps). It is verified by driving the real stores against it
  (`firestore-fake.test.ts`).
- **Injection seam.** `apps/api/src/firestore.ts` exposes `injectFirestore(parts)` /
  `resetFirestore()`. When injected, `getDb()` returns the fake and `FieldValue`/`Timestamp`
  are swapped for the fake's, so no store call site changes; firebase-admin is never
  initialized and `dev-credentials.ts` never runs. The seam is exported only through the
  `@raiymbek-park/api/testing` subpath, keeping the production `.` surface clean.
- **Typing.** Production `firestore.ts` keeps returning firebase-admin's `Firestore` type and
  store signatures are unchanged. `FieldValue` is swapped through a narrow `FieldValueApi`
  type (no assertion). `Timestamp` is **not** swapped — the fake builds stored timestamps with
  the real `Timestamp.fromMillis`, so `instanceof Timestamp` checks in the stores still hold.
  The fake declares its db as `Firestore` at a single, contained assertion in the test fake
  (`firestore-fake.ts`) — the one place `as` is used, confined to test infrastructure and
  justified by the fake being a verified subset. The stricter alternative — narrowing
  `getDb`'s return type across production store signatures — was rejected as more invasive
  (firebase-admin's generic `Firestore` and private-constructor `Timestamp` make a clean
  no-assertion narrowing fragile).
- **What stays mocked beyond the datastore:** genuinely external services — Firebase
  Auth/Storage, the SMS gateway, the LLM.
- **Narrow boundary retained** for behavior with no server logic (form validation, disabled
  states, file-size limits, toasts): these may render without the router.
- **MSW retained only** for the thin transport-contract set the in-process path cannot see
  (headers, serialization, batching, HTTP-status → error mapping).

## Consequences

### Positive
- Closes the web↔api seam: real validation, authorization, derivation, and projection run
  behind the UI, so a broken server rule fails a web test.
- Fast and deterministic — no socket, no external process, no network; the fake's monotonic
  clock keeps ordering/pagination stable.
- **Never touches production** — firebase-admin does not initialize under injection.

### Negative
- A test-facing DI seam lives in the production `firestore.ts` (a holder plus
  `injectFirestore`/`resetFirestore`, exported via `./testing`). It is dependency injection,
  not business logic, and the production path is unchanged when the seam is unused.
- `FieldValue`/`Timestamp` become runtime-swappable in `firestore.ts`.
- The in-memory fake is load-bearing infrastructure: an unfaithful fake yields false
  confidence, so it carries its own verification test and must track the used surface.

### Neutral
- Directly realizes the arc-test testing-strategy rules ("the network is not automatically
  the boundary"; mock only the external edge). Complements ADR 006.
- Vitest's externalization of the api package — the reason module mocking is unavailable — is
  what makes the single-instance DI seam simple and consistent.
