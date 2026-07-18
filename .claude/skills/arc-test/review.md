# Test Review

Review test quality against the testing methodology. Read-only audit — does not modify test files, only reports findings with actionable recommendations.

Mutation testing checks whether tests catch code changes. Test review checks whether tests follow the methodology — correct selectors, proper mocking boundaries, no implementation detail coupling, correct test level assignment.

## Steps

### Step 1: Gather Context

1. Read `.arcana/project-context.md` for test runner, framework, conventions, and active example references
2. Find AC files for `ticket-id`
3. Find test files relevant to `ticket-id`
4. If no test files found → error: "No tests found. Run `/arc:test write {ticket-id}` first." and stop

### Step 2: Review Against Checklist

For each test file, check every item. Reference the relevant section of [references/testing-strategy.md](references/testing-strategy.md) for each rule.

#### A. Test Level Assignment

See `## Decision Matrix` in testing-strategy.md.

- [ ] Critical paths covered by E2E (happy path only)
- [ ] Observable behavior covered by integration tests (bulk)
- [ ] Shared utilities covered by unit tests
- [ ] No duplication between levels — E2E happy path is NOT repeated in integration
- [ ] No unit tests for things already covered by integration (unless shared utility)

#### B. Implementation Detail Coupling

See `## Implementation Details` in testing-strategy.md.

- [ ] Tests interact through user-facing interfaces only (props/args, rendered output, events, HTTP)
- [ ] No assertions on internal state, method names, CSS classes, or child component names
- [ ] Test would survive major refactoring (rename components, change state management, restructure folders) without breaking

#### C. Element Selection

See `## Element Selection Strategy` in testing-strategy.md.

- [ ] Selectors follow priority: role+name → label → text → placeholder → test-id
- [ ] No selectors tied to HTML structure (`div > ul > li`, `.container .item`)
- [ ] No selectors tied to CSS classes (`.btn-primary`, `.header-nav`)
- [ ] test-id passed as prop from page level, not hardcoded in components
- [ ] test-id only used when role/label/text alternatives are exhausted
- [ ] Modals/portals selected by role+aria-label, not DOM position

#### D. Mocking Boundaries

See `## Mocking Rules` in testing-strategy.md — especially "The network is not automatically the boundary."

**"Mocked at the network layer" is NOT sufficient on its own.** A network mock that hand-writes the server's responses fabricates the application's own backend: it satisfies a naive boundary check while exercising nothing below the client. Do not rubber-stamp it — detect it actively.

**Procedure — classify every mock in the test.** For each mock, stub, or intercepted response, ask *what value it returns*:

```
Raw data an external dependency holds, or a third-party payload
  → allowed boundary mock.

The application's OWN server/business output — assigned ids, derived or aggregated
fields, status codes, authorization allow/deny verdicts, localized/filtered projections
  → CRITICAL finding: the server logic that produces that value never runs.
```

**Checklist:**

- [ ] No mock re-implements or hard-codes what the application's own server/business logic would compute — the response is produced by real code, not authored by the test
- [ ] Server-side rules the AC depends on (validation, authorization/roles, derivation, projection) run through the real code path, not asserted against a stand-in
- [ ] The boundary sits at the true external edge (datastore, third-party services); the real server/business logic runs whenever the infrastructure allows it (widest-boundary rule)
- [ ] No module-level mocking of business logic, components, hooks, or store
- [ ] Canned server responses appear ONLY for behavior with no server logic (pure client rendering, form validation, disabled states) or for a genuinely external server
- [ ] Assertions check real outputs — seed the external dependency, then assert the result the real logic produces — not fixtures that duplicate the server's computation

#### E. Test Describes Behavior, Not Code

See `## Bug Coverage` and `## Test Writing Algorithm` in testing-strategy.md.

- [ ] Test names describe user behavior or business outcomes, not function names
- [ ] Bug-related tests describe expected behavior, not the specific bug
- [ ] Each test traces back to an AC scenario (not invented from code inspection)

### Step 3: Write Report

Write review report to `.arcana/{feature}/{ticket-id}/test-review-report.md`.

Report format:

```markdown
# Test Review Report — {ticket-id}

**Date:** {date}
**Files reviewed:** {list}

## Summary

- Findings: {total}
- Critical: {count} (tests will break on refactoring or miss real bugs)
- Improvement: {count} (methodology deviations, not blocking)

## Findings

### Finding 1
- **Category:** {A|B|C|D|E}
- **Severity:** critical | improvement
- **File:** {path}:{line}
- **Issue:** {what's wrong}
- **Recommendation:** {how to fix, with example if helpful}

### ...

## Verdict

{PASS — no critical findings | NEEDS WORK — critical findings require attention}
```

**Confirmation gate:** If `-y` → write report. Otherwise → show report and ask: "Write test review report?" Wait for confirmation.

### Step 4: Output

> **Test Review — {ticket-id}:** {PASS|NEEDS WORK}
> {critical} critical, {improvement} improvement findings across {file-count} files
> Report: `.arcana/{feature}/{ticket-id}/test-review-report.md`

**On NEEDS WORK:** the orchestrator routes to `/arc:test write {ticket-id}` to fix critical findings, then `/arc:test review` again to verify.
