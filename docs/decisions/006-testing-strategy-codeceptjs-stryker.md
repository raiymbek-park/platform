# 006. Testing strategy: CodeceptJS for e2e, mutation-tested unit/integration

**Date:** 2026-06-20
**Status:** accepted

## Context

The product runs on more than one target: a web build (Vite) today, a Tauri
desktop shell now, and Tauri mobile backends down the road. Tests come out of the
Arcana working process, which doesn't stop at "a test exists" — a skill checks
that generated tests match the methodology, and we want a mechanical way to tell
whether those tests are any good, i.e. whether they'd actually fail when the code
breaks.

Two forces shape the choice:

- **Specs should travel across targets.** The same end-to-end behaviour ought to
  be written once and run against web now and the packaged mobile app later,
  rather than rewritten per runtime.
- **Test quality is a first-class concern.** Under the Arcana process,
  "are these tests meaningful?" has to be answerable by a tool, not by reading
  them and hoping.

## Options Considered

### Option 1: CodeceptJS e2e + Vitest/Testing Library/MSW + Stryker (chosen)

- **Pros:** CodeceptJS writes scenarios in a terse, helper-based style
  (`I.click(...)`). The helper layer is the whole point: the same specs run on
  the Playwright helper for web today and can point at a Tauri/mobile e2e helper
  for the packaged app — exactly the cross-target reuse we're after. Vitest is
  Vite-native, so it shares config and stays fast. Stryker mutation testing
  answers the "are the tests good" question head-on: it mutates the code and
  checks that the suite goes red.
- **Cons:** CodeceptJS has a smaller ecosystem than raw Playwright and puts a
  layer between the specs and the driver. Mutation runs are slow and cost CI
  time.

### Option 2: Raw Playwright Test for e2e

- **Pros:** The biggest ecosystem, first-party tooling, excellent debugging.
- **Cons:** Specs are written straight against the browser driver, which pins
  them to the web target. Reusing them on a Tauri mobile runtime would mean a
  rewrite — the opposite of what we want. The imperative style is also wordier
  than a CodeceptJS scenario.

### Option 3: Cypress for e2e

- **Pros:** Great DX, time-travel debugging.
- **Cons:** A browser-centric architecture that fits a Tauri/native target
  poorly, and one more heavy dependency that does nothing for cross-target reuse.

## Decision

Use **CodeceptJS** for end-to-end tests — the **Playwright helper** for web now,
a **Tauri mobile e2e helper** later — so one scenario style covers every target.
Use **Vitest + Testing Library + MSW** for unit and integration tests, mocking
the network at the boundary, and **Stryker** mutation testing as the
test-quality gate.

This lines up with how Arcana works: every artifact goes through the working
process, a conformance skill checks the tests against the methodology, and
Stryker supplies the mechanical proof that those tests bite — that they fail when
the implementation regresses. CodeceptJS's helper abstraction is what makes a
single e2e suite realistic across web and the future mobile shell, and Playwright
know-how still carries over, since CodeceptJS drives Playwright underneath for
the web target.

## Consequences

### Positive
- One terse, readable e2e style reused across web and Tauri mobile.
- Mutation testing catches tests that never fail and would otherwise pass for
  the wrong reasons.
- Vitest rides on the Vite pipeline — fast, with shared config.
- MSW mocks the network at the boundary, keeping integration tests honest.

### Negative
- CodeceptJS's ecosystem and community are smaller than raw Playwright's.
- There's an extra layer between specs and the driver.
- Mutation runs are slow, so they're an on-demand/CI gate rather than a per-push
  cost.

### Neutral
- CodeceptJS uses Playwright for web, so Playwright skills and debugging tooling
  still apply.
- Stryker runs deliberately (`npm run mutate`), not on every commit.
