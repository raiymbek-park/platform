# Test Write

Generate tests from AC scenarios. Does not run tests — only writes test files.

## Two modes

**Full** (default) — write the suite for every AC scenario of `ticket-id`. This is the pipeline's
first pass, right after `arc:code`.

**Targeted** — close specific gaps named by an upstream step, typically the survivor triage in
[mutate.md](mutate.md) Step 5 (which names the AC scenario and the assertion that is missing), or a
`test review` finding. In targeted mode:

- Read `.arcana/{feature}/{ticket-id}/mutate-report.md` (or the finding you were handed) and work
  **only** the gaps it lists. Do not regenerate the suite — it already exists and is green.
- The AC scenario is still the source of truth. A survivor is a *pointer* to an under-asserted
  scenario, not a spec of its own: find the scenario it violates and assert what that scenario
  promises. Never write a test that encodes the mutant.
- If the triage says a survivor is equivalent or noise, write nothing for it.
- Prefer strengthening an existing test over adding a near-duplicate one. A survivor usually means a
  test exercises the code but asserts too little — the fix is an assertion, not a new test.
- **A mutant can be equivalent under a test double yet real in production** (a guard that only throws
  against the real datastore, a branch the mock flattens). The AC's promise still holds under the mock
  *with the bug present*, so no assertion on the AC's own wording will kill it. Assert the interaction
  the AC implies instead — that the collaborator is or isn't reached — rather than the outcome the mock
  fakes. If even that can't distinguish it, the mutant is equivalent *at this level*: say so and name
  the level where it would be caught.

Steps 1-5 below apply to both modes; in targeted mode read "each AC scenario" as "each scenario named
in the report".

## Steps

### Step 0: Confirm Order

By default this command runs **after** `arc:code` in the canonical pipeline (see `arc-implement/single.md`). If the production code referenced by the AC scenarios for `ticket-id` doesn't exist yet:

- Check whether the developer asked for TDD (`--test-first` flag, explicit "tests first" instruction, or invocation via `arc:implement --test-first`).
- If TDD was not requested, surface this and ask: "Code for `{ticket-id}` isn't implemented yet. Run `/arc:code {ticket-id}` first, or proceed with TDD-style test-first?" Wait for confirmation.
- Do not silently generate tests against unwritten code — TDD vs code-first is a workflow choice the developer should make consciously.

### Step 1: Locate AC and Code

1. Read `.arcana/project-context.md` for AC file locations, test runner, API type, framework, conventions, and active example references
2. Find AC files for `ticket-id`
3. If no AC files found → error and stop
4. Read production code relevant to the feature

### Step 2: Apply Decision Matrix

For each AC scenario, determine the test level using the decision matrix (top-down, no duplication between levels). See `## Decision Matrix` in [references/testing-strategy.md](references/testing-strategy.md).

```
1. Critical user path (money, auth, irreversible action with business impact)?
   YES → E2E test (happy path only)
   NO  → skip E2E

2. Observable feature behavior (form, list, dialog, async operation)?
   YES → Integration test (bulk of all tests)
        Covers edge cases that E2E didn't cover
   NO  → skip Integration

3. Isolated logic used in multiple places across the project?
   (utilities, formatting, validation, calculations)
   YES → Unit test (mandatory regardless of integration coverage)

4. Isolated logic used only here?
   NO  → Integration already covers it
   YES, but complex with many edge cases? → Unit test
```

**Key rules:**
- E2E covered happy path → Integration does NOT repeat it, covers edge cases instead
- Integration covered behavior → Unit does NOT duplicate it, only covers isolated logic
- Shared utilities (formatPrice, validateEmail, parseDate) → Unit test mandatory even if integration covers them

**Top-down, highest-level-first — the anti-duplication rule.** Assign each behavior to the HIGHEST level that can exercise it, and push only the remainder lower. A behavior a full-flow / page / main-form integration test can drive is covered *there* — do NOT also write a component or unit test for it. **One integration file per screen:** it covers that screen's client-side behavior (field validation, disabled states, limits) AND its backend-touching behavior together — never split a screen into a "narrow/UI-only" file and a "wide" file. Reserve lower levels (component, hook, pure function) for what the top cannot reach: shared utilities, isolated logic with many branches, states a full flow can't force.

### Step 3: Apply Mocking Rules

See `## Mocking Rules` in [references/testing-strategy.md](references/testing-strategy.md).

```
✅ Mock:     External edge (datastore, third-party services: email, payment, SMS, LLM), animations
❌ Don't mock: Business logic, authorization, child components, hooks, store, your own server
```

Mock at the true external boundary, not at the module level, and **not at the network line when the server is your own code** — see "The network is not automatically the boundary" in testing-strategy.md. The whole chain must run for real, down to and including the application's own server/business logic; replace only what the server itself cannot control (the datastore, third-party services). Do NOT hand-write the server's computed output (assigned ids, derived fields, status codes, authorization verdicts, projections) — seed the external dependency and let real code produce the response, so the test asserts real outputs.

**Self-check — mirror of `review.md` §D.** Before writing each mock, classify it by *what it returns*, applying the exact litmus the review step will use to grade it:

```
Raw data an external dependency holds, or a third-party payload  → keep.
Your own server's computed output (ids, derived/aggregated fields, status codes,
authorization allow/deny verdicts, localized/filtered projections)  → fabricated
backend. Rewrite: seed the datastore and let real code produce it.
```

Carve-out: a canned **error / empty / loading** response at the boundary is allowed even under this litmus — you are testing the UI's *reaction*, not fabricating server success. Only a canned *success* payload that stands in for server logic is a fabricated backend.

**Assert the behaviour, not the plumbing** (see "Assert the behaviour the requirement demands" in testing-strategy.md). Avoid two things: (1) mocking a collaborator and then asserting it was called or a value echoed from its configured return — that tests the mock, not a requirement; (2) asserting the code *asked* for an effect (a recorded call, an unresolved write token) instead of the observable outcome it produces. Start from what the requirement must make true, exercise it through real code, and assert the outcome read back from where it lands. And **name only what the test proves**: apply the break-the-mechanism check before titling a test for a guarantee (delete the mechanism → the test must fail), else verify it at a tier that can, or rename.

A test generated under this self-check is exactly what §D verifies — write and review apply one rule, so they can never diverge. If following it is impossible because the project has no way to run the real server logic in a test, do NOT fall back to fabricating the backend: surface that the in-process harness is a prerequisite (see below) and stop, rather than generating a test the review step will reject.

If `project-context.md` specifies how the real server logic runs in tests (an in-process harness, a disposable test datastore) with example references → load the relevant example file for implementation patterns.

### Step 4: Apply Optional Layers

Check `.arcana/project-context.md` for optional testing layers enabled for the project:

- **Visual regression** — enable for design systems, UI kits, public landing pages
- **Accessibility** — enable for public products, enterprise/government, design systems

If enabled and example references exist → load relevant example files and generate corresponding tests alongside the main test files.
If not configured → skip.

### Step 5: Write Test Files

For each AC scenario, write the test following the 5-step algorithm from [references/testing-strategy.md](references/testing-strategy.md) (`## Test Writing Algorithm`).

**AC traceability lives in the test name, never a comment.** Put the scenario reference inside the `it(...)` / `test(...)` title — e.g. `it('re-enables RESEND when the countdown reaches 0:00 (error-states 10)')` — not as a `// error-states 10` comment above it. A `// scenario N` marker duplicates the title and violates the project's "no comments unless they explain a workaround or non-obvious logic" rule (it explains nothing the name can't). Tests are code: they're bound by the same coding rules as production, so honor the project's comment/naming conventions when generating them.

**Name the behaviour, not the mechanics.** The title states the user-visible outcome; do NOT restate what the test's *level* already implies — that it hits the real backend, stores a row, or runs the real router. At the integration level those are givens, not part of the scenario. "publishes an offer and it appears in the feed" — not "publishes an offer through the real backend, which stores it and returns it".

Produce a mapping showing which AC scenario maps to which test at which level:

```
AC scenario → test file : test name → level (E2E / Integration / Unit)
```

**Confirmation gate:** If `-y` → write test files and commit. Otherwise → show the mapping and test structure, then ask: "Write these test files?" Wait for confirmation.

Commit test files to the feature branch with a dedicated test commit.

### Step 6: Output

> **Tests Written — {ticket-id}:**
> - E2E: {number} tests
> - Integration: {number} tests
> - Unit: {number} tests
> - Optional: {visual regression / a11y if enabled}
>
> **Mapping:**
> {AC scenario → test → level for each}
>
> Run `/arc:test validate {ticket-id}` to execute tests.
