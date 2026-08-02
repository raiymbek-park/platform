# 018. E2E tier: one happy path per feature, real stack, faked datastore

**Date:** 2026-08-02
**Status:** accepted

## Context

The e2e suite held a single scenario (onboarding registration). Everything else was covered
by the integration harness of ADR 017, which renders the real app and runs the real tRPC
router in-process. That harness never leaves the Node process: no browser, no bundler, no
HTTP, no router-level code splitting, no service worker, no real Firebase Auth session. A
class of failures therefore had no test that could see it — a broken vite build, a route that
only fails when lazily loaded, a token that never reaches the server, a CSS-driven element
that no user can tap.

Two constraints shaped the design:

- **The datastore stays the only mock** (ADR 017). An e2e run must not read or write the live
  Firebase project, and must start from a known dataset on every run.
- **The suite must run on every pull request.** That rules out anything requiring Java (the
  Firestore, Database and Storage emulators) and anything requiring cloud credentials.

## Options Considered

1. **Real stack over the in-memory Firestore fake, real Auth emulator (chosen).** A dedicated
   api entrypoint injects the fake datastore and seeds it, then serves the real router over
   real HTTP; the browser runs the real vite build and signs in through the Auth emulator with
   a real custom token.
2. **Real stack over the Firestore emulator.** Faithful Firestore semantics, but needs Java 21
   in CI, is slower to boot, and contradicts the "datastore is the mock" boundary already
   fixed by ADR 017 for every other tier.
3. **Real stack over the live dev project.** No new infrastructure, but every run pollutes real
   data, scenarios depend on whatever the project currently holds, and parallel runs collide.
4. **No e2e beyond onboarding.** Cheapest, but leaves the whole browser/bundle/transport layer
   untested — the reason this tier exists.

## Decision

- **One happy-path spec per user-drivable feature**, derived from that feature's
  `docs/features/{feature}/ac/happy-path.md`: onboarding, home, posts, issue-tracker,
  user-profile, i18n. Each spec drives one end-to-end journey, not a scenario matrix.
- **Deliberately out of scope:** `content-translation` (its happy path is an Anthropic call on
  a Firestore trigger, not a user gesture), `push-notifications` (browser permission prompt and
  FCM delivery are outside the page), `design-system` and `infrastructure` (no user-facing
  journey of their own — they are exercised by every other spec). These stay on the
  integration and api tiers.
- **The stack.** `npm run test:e2e` starts the Auth emulator (Node-based, no Java), then
  `apps/api/src/test/e2e-server.ts` — which injects the in-memory Firestore fake, seeds the
  fixtures, and starts the *real* tRPC server — then the real vite dev server in `e2e` mode,
  then CodeceptJS/Playwright. Everything between the browser and the datastore is real,
  including HTTP, zod validation, authorization, business logic and projection.
- **Identity is real.** The api runs firebase-admin against the Auth emulator, so `otp.verify`
  mints a genuine custom token, the browser signs in with it, and the id token is verified
  server-side — the one thing the ADR 017 harness cannot reach.
- **Fixtures are deterministic.** The seed pre-creates one auth user per spec with a fixed
  `uid` and the matching resident document. Each spec owns its own test phone, so the OTP
  send-interval rule never makes one spec's sign-in throttle another's. Seeded documents are
  timestamped below the fake's clock base, so anything a spec creates sorts above them.
- **CI gates on it.** A required `e2e` job runs the suite on every pull request.
- **No duplication with the integration tier.** A happy path an e2e spec drives end to end is
  removed from the integration harness; the harness keeps edge cases, error and empty states,
  validation, permissions, and every behaviour a single journey cannot reach.

## Consequences

### Positive
- The browser, the bundle, the HTTP transport and the real auth session are covered.
- Runs anywhere with Node — no Java, no credentials, no cloud project.
- Deterministic: every run starts from the same seeded dataset in memory.
- A spec reads as a user journey and is written from AC, not from code.

### Negative
- Slower than the integration tier (~25s for six specs), and it needs a Playwright browser
  (`npx playwright install chromium`) locally and in CI.
- Fixtures live in two places — seeded documents in `apps/api/src/test/e2e-seed.ts`, personas
  in `apps/web/src/test/support/residents.ts` — and drift shows up as a failing sign-in.
- Losing the integration copy of a happy path means a regression in it surfaces later in the
  pipeline than before, at browser speed rather than unit speed.

### Neutral
- The Firestore fake is now load-bearing for a second consumer; a store that calls an
  unimplemented method fails the e2e run as well as the harness.
- Test-phone codes stay guarded by `OTP_TEST_MODE`, so the fixture phones are inert in any
  environment that does not set it.
