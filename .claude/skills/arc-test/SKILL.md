---
name: arc:test
description: >
  Write, run, review, and audit tests driven by Acceptance Criteria. Tests are born from requirements,
  not from code. Use when writing tests from AC scenarios, running test suites, reviewing test quality,
  or auditing with mutation testing. Triggers on "/arc:test", "write tests", "run tests", "test from AC",
  "mutation testing", "audit test quality", "are tests good enough", "review tests".
user-invocable: true
argument-hint: "write|validate|review|mutate {ticket-id} [-y]"
license: MIT
metadata:
  author: supa-magic
  version: 1.0.0
  category: testing
  tags: [testing, requirements-driven, mutation-testing, integration-tests, acceptance-criteria]
---

# /arc:test $ARGUMENTS

Write, run, and audit tests — driven by Acceptance Criteria, not by code.

## Usage

```
/arc:test write JRA-123           Write tests from AC scenarios
/arc:test validate JRA-123        Run tests and report results
/arc:test review JRA-123          Review test quality against methodology
/arc:test mutate JRA-123          Audit test quality with mutation testing
```

| Argument | Format | Default | Effect |
|----------|--------|---------|--------|
| `write` \| `validate` \| `review` \| `mutate` | Subcommand (first token) | — | Determines workflow (required) |
| `ticket-id` | Positional | — | Ticket identifier — used to locate AC and test files |
| `-y`, `--yes` | Flag | `false` | Skip confirmation gates |

## Instructions

### Step 1: Parse Arguments

1. First non-flag token → `subcommand` (`write`, `validate`, `review`, or `mutate`). If missing or not one of these → error: "Subcommand required. Usage: `/arc:test write|validate|review|mutate {ticket-id}`" and stop.
2. Next non-flag token → `ticket-id`. If missing → error: "Ticket ID required. Usage: `/arc:test {subcommand} {ticket-id}`" and stop.
3. `-y` or `--yes` anywhere → `skip_confirmations = true`

### Step 2: Route to Subcommand

Read the corresponding sub-instruction file and follow all steps:

| Subcommand | File | Purpose |
|------------|------|---------|
| `write` | [write.md](write.md) | Generate tests from AC — does not run them |
| `validate` | [validate.md](validate.md) | Run tests — pure execution, does not write code |
| `review` | [review.md](review.md) | Review test quality against methodology — read-only audit |
| `mutate` | [mutate.md](mutate.md) | AI-driven mutation testing — audits test quality |

## Core Principle

**Tests must be written from requirements, not from code.**

```
❌ Bad:  Code → "what does this do?" → test
✅ Good: AC scenario → "what should happen?" → test
```

A test written from code is a tautology — if the code has a bug, the test locks it in as correct behavior. A test written from AC catches the bug because it describes what SHOULD happen, not what DOES happen.

**Criterion:** if you can do a major refactoring (rename components, restructure folders, change state management) and all tests stay green — the tests are good. If tests break on refactoring that doesn't change behavior — they test implementation details, not requirements.

## Position in Pipeline

In the canonical `arc:implement` flow (see `arc-implement/single.md`), test commands run **after** `arc:code`:

```
plan → arc:code → arc:test write → arc:test review → arc:test validate → arc:test mutate → arc:ac verify
```

Running `arc:test write` **before** `arc:code` is TDD order — opt in via `arc:implement --test-first`. If the developer invokes `arc:test write` standalone before code exists for the ticket, confirm this is a deliberate TDD choice before generating tests against unwritten code; the default expectation is that code lands first.

## Shared Context

**Project context:** `.arcana/project-context.md` — read first. Contains AC file locations, test runner, API type, framework, and conventions.

**Report output location:** `.arcana/{feature}/{ticket-id}/` (temp, gitignored)

**Reference material:** [references/testing-strategy.md](references/testing-strategy.md) — decision matrix, mocking rules, contract safety, test writing algorithm. Search patterns for large file:
- `## Decision Matrix` — which test level for which AC type
- `## Mocking Rules` — what to mock, what not to mock
- `## Element Selection Strategy` — selector priority, test-id rules
- `## Test Writing Algorithm` — 5-step process
- `## Bug Coverage` — how to cover bugs with tests
- `## Implementation Details` — what not to test

## Troubleshooting

### Error: No AC files found
Cause: AC files don't exist yet for this ticket.
Solution: Run `/arc:ac enrich` or `/arc:prd create` first. Without AC, tests would be written from code — which this skill explicitly avoids.

### Tests break on refactoring
Cause: Tests are coupled to implementation details (internal state, method names, CSS classes).
Solution: Rewrite tests to interact only through user-facing interfaces. See "Implementation Details" section in [references/testing-strategy.md](references/testing-strategy.md).
