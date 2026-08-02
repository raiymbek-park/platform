# 019. Drop the emulator tier: every test runs on in-memory fakes

**Date:** 2026-08-02
**Status:** accepted

Supersedes the "Emulator (real Firestore)" tier of ADR 017 and the Auth-emulator step of the
e2e stack in ADR 018.

## Context

Two tiers still needed an emulator process: `apps/api/src/infra-2.test.ts` ran against the
Firestore emulator (Java 21, a CI step of its own), and the first version of the e2e stack
signed in through the Auth emulator. Everything else in the repository — the web harness, the
api store tests, and now the e2e suite — runs on in-memory fakes.

An emulator is infrastructure: it must be installed, booted, versioned and kept alive by every
developer and by CI, and most of the suite needs a JDK for it. That cost buys a narrow band of
guarantees, and it makes "run the tests" mean something different on each machine.

## Decision

**No test tier boots an emulator.** The Firestore emulator tier is removed
(`infra-2.test.ts`, the `test:emulator` script, the `@firebase/rules-unit-testing` dependency,
and the Java setup + emulator step in the `checks` CI job). The whole suite is `npm test` plus
`npm run test:e2e`, and both need nothing but Node and a browser.

## Consequences

### Positive
- One way to run every test, on any machine, with no JDK and no background process.
- The `checks` CI job loses a Java toolchain setup and an emulator boot.

### Negative — accepted, and to be covered by hand
- **`firestore.rules` has no automated verification.** The deny-all assertion for direct client
  access is gone. Read rule changes carefully, and exercise them against a manually started
  emulator before merging a change to `firestore.rules`.
- **Transaction atomicity is only asserted against the fake's `runTransaction`.** The fake
  serialises, so it cannot prove a contended write converges on real Firestore. Keep
  transactional code obviously correct instead of relying on a test to catch a race.
- **Query and index correctness surface at runtime.** When a store adds a query shape, check
  `firestore.indexes.json` covers it by hand.

### Neutral
- The `emulators` block in `firebase.json` stays: starting an emulator by hand is still the way
  to check rules or a suspected race — it is simply not part of the automated suite.
