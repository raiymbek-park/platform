# Implement — Single Ticket

Full implementation cycle for one ticket. Groups related skills into tiered agent calls to share context. Single skills run directly in main chat.

**Agent tiers:**
- `arc:archmage` — deep reasoning, code generation (fable)
- `arc:mage` — analysis, enrichment, tests (opus)
- `arc:apprentice` — independent verification, fresh context (opus, low effort)

## Pipeline

```
/arc:apprentice — PRD Phase: prd validate
[gate]

/arc:mage       — AC Phase: ac validate → ac enrich
/arc:apprentice — AC Gate: ac validate (fresh context)
[gate]

main            — plan
[gate]

/arc:archmage   — Code: code
[gate]

main            — Validate: code validate
[gate]

/arc:mage       — Test Phase: test write → test review → test validate → test mutate
[gate]

/arc:apprentice — Verify Phase: ac verify (fresh context)
[gate]

main            — code review-request
[gate]
/arc:archmage   — code review-resolve (on demand)
[gate]
                  merge → main (HUMAN)
                  project skill-up (post-merge)
```

If `--test-first` → Test Phase (arc:mage) runs before Code Phase (arc:archmage). Mage writes tests first, then archmage writes code to make them pass.

## Steps

### Step 1: PRD Phase (arc:apprentice)

```
/arc:apprentice
Read .arcana/project-context.md and the PRD for the feature owning {ticket-id}.
Run: prd validate.
Flags: {pass --yes}.
Write result to .arcana/{feature}/prd-validate-report.md.
```

**Gate:** Read prd-validate-report.md. If FAILED → stop, show report. The AC-update loop spins indefinitely when the root cause is in the PRD; stopping early saves iterations. Resolution: `/arc:prd update {feature-name}` then re-run `/arc:implement {ticket-id}`.

If `--skip=prd-validate` → skip this step. Use only when the PRD is known-good (e.g., it was just validated in a prior run).

### Step 2: AC Phase (arc:mage)

```
/arc:mage
Read .arcana/project-context.md and AC files for {ticket-id}.
Run in order: ac validate → ac enrich.
If the opening ac validate fails → ac update → ac validate (loop, max {--max-retries}).
If --skip=ac-enrich → skip ac enrich.
Flags: {pass --yes and --max-retries}.
Write result to .arcana/{feature}/{ticket-id}/ac-phase-result.md.
```

The opening `ac validate` grades AC this agent did not write, so it stays here. The closing one
does not: it would grade the scenarios `ac enrich` just produced, in the same context that
produced them, against criteria that were already in view during writing. That is a rubber
stamp, so it moves to Step 3.

**Gate:** Read ac-phase-result.md. If FAILED → stop, show report. If not `--yes` → show enriched AC and ask: "Proceed?"

### Step 3: AC Gate (arc:apprentice)

```
/arc:apprentice
Read .arcana/project-context.md and AC files for {ticket-id}.
Run: ac validate.
If fail → report which scenarios failed which criteria; do NOT rewrite them yourself.
Flags: {pass --yes and --max-retries}.
Write result to .arcana/{feature}/{ticket-id}/ac-gate-result.md.
```

On fail, the orchestrator routes back to `/arc:mage` for `ac update`, then re-runs this gate
(loop, max `{--max-retries}`). Keep writer and grader in separate contexts across every
iteration — collapsing them to save a call is what the gate exists to prevent.

A fresh grader has no memory of the previous round and can raise a different set of objections
each time. That is the cost of independence, and `--max-retries` is its bound: when retries
exhaust with findings still open, stop and escalate rather than raising the cap. Repeated
divergence usually means the defect is upstream in the PRD — see
`skills/arc-ac/validate.md` § Troubleshooting.

If `--skip=ac-enrich` was passed, the AC phase wrote nothing, so skip this gate too.

**Gate:** Read ac-gate-result.md. If FAILED after retries → stop, show report. If not `--yes` → show findings and ask: "Proceed?"

### Step 4: Plan (main)

Run `/arc:plan {ticket-id}` directly in main chat.

If plan recommends splitting → stop, suggest `/arc:prd update`.

**Gate:** If not `--yes` → show plan and ask: "Proceed?"

### Step 5: Code (arc:archmage)

If `--test-first` → skip to Step 7 first, then return here.

```
/arc:archmage
Read .arcana/project-context.md, AC files for {ticket-id},
plan from .arcana/{feature}/{ticket-id}/plan.md.
Run: code.
Flags: {pass --yes}.
Write result to .arcana/{feature}/{ticket-id}/code-phase-result.md.
```

**Gate:** Read code-phase-result.md. If not `--yes` → show changes and ask: "Proceed?"

### Step 6: Validate (main)

Run `/arc:code validate` directly in main chat to audit the branch diff against the project's coding rules before tests are written.

Behavior:
- `--yes` → pass `-y` to validate so mechanical fixes auto-apply.
- Pair mode (no `--yes`) → validate's own confirmation gate handles approval of mechanical fixes.
- Review-only findings are surfaced but do NOT block — the developer decides per finding whether to address them now or carry them into the test/review cycle.

If validate applies mechanical fixes → commit them via `/git` before continuing (e.g., `fix({slug}): {short summary of rule violations}`). Loop: validate → fix → validate, max `{--max-retries}` iterations. If iterations exhaust with mechanical findings still present → stop and escalate.

If `--skip=validate` → skip this step. Use only when validate was already run separately or when the project has no rules to enforce.

**Gate:** With `--yes` → proceed if 0 findings or only review-only remain. With pair mode → show the validate report and ask: "Proceed to test phase?"

### Step 7: Test Phase (arc:mage)

**Establish a baseline before attributing any failure to your own work.** This suite is load-flaky:
at default parallelism `npm test` produces a shifting set of failures in timing-sensitive suites
(waitFor/timers) that have nothing to do with the diff — measured at 14-16 failures both with and
without the branch's changes, and 0 when run serially. A phase that assumes green-means-mine will
conclude it broke unrelated features and "fix" production code that was never broken.

Before treating a red test as yours:
1. Re-run that file alone. Passing alone + failing in the full run = contention, not a defect.
2. If still unsure, `git stash` and run the same scope. Same failures without your changes = baseline.
3. Only failures that survive both checks are yours.

Never report "npm test is green/red" as a bare fact — report it against the baseline you measured.

```
/arc:mage
Read .arcana/project-context.md, AC files for {ticket-id},
test/references/testing-strategy.md, relevant example references from project-context,
production code and test files for the feature.
Run in order: test write → test review → test validate → test mutate.
If test review needs work → test write → test review (loop, max {--max-retries}).
If test validate red → fix code or tests → test validate (loop, max {--max-retries}).
If test mutate survivors → triage every one per mutate.md Step 5 before acting. Route by class:
  - missing test → test write (targeted mode) — the common case
  - missing AC → ac update → test write. Add the scenario to THIS feature's AC only.
  - other feature's AC → report it under that feature; do NOT widen this ticket or borrow the scenario
  - equivalent / noise / defensive-unreachable → record why, change nothing, do NOT loop on them
  - dead code → propose deletion; if deleting forces a construct the rules ban, it is defensive instead
Then test mutate again (loop, max {--max-retries}). Never weaken production code to kill a mutant.
If --skip=test-review → skip test review.
If --skip=test-mutate → skip test mutate.
Flags: {pass --yes and --max-retries}.
Write result to .arcana/{feature}/{ticket-id}/test-phase-result.md.
```

**Gate:** Read test-phase-result.md. If FAILED → stop, show report. If not `--yes` → show test results and ask: "Proceed?"

### Step 8: Verify Phase (arc:apprentice)

`ac verify` asks whether each AC scenario is implemented, has a test, and whether that test
checks the scenario's actual behaviour. Run inside the test phase it would ask the agent that
just wrote those tests to grade them — the third self-assessment in a row, after `test review`
and `test mutate`. It gets its own call with fresh context, matching `fix.md`.

```
/arc:apprentice
Read .arcana/project-context.md, AC files for {ticket-id},
production code and test files for the feature.
Run: ac verify.
Report DONE / PARTIAL / MISSING per scenario with file-and-line evidence.
Do NOT write or amend code or tests — report the gap, the orchestrator routes the fix.
Flags: {pass --yes and --max-retries}.
Write result to .arcana/{feature}/{ticket-id}/verify-phase-result.md.
```

On PARTIAL or MISSING, the orchestrator routes back — `/arc:archmage` for missing behaviour,
`/arc:mage` for a missing or mis-aimed test — then re-runs this phase (loop, max
`{--max-retries}`). The verifier never fixes what it just flagged; that would put writer and
grader back in one context.

**Gate:** Read verify-phase-result.md. If FAILED after retries → stop, show report. If not `--yes` → show verify report and ask: "Proceed?"

### Step 9: PR (main)

Run `/arc:code review-request {ticket-id}` directly in main chat.

**Gate:** If not `--yes` → show PR link.

### Step 10: PR Resolution (arc:archmage — on demand)

When review comments appear:

```
/arc:archmage
Read .arcana/project-context.md, AC files for {ticket-id},
PR comments and review status for {pr-id}.
Run: code review-resolve.
Flags: {pass --yes and --max-retries}.
Write result to .arcana/{feature}/{ticket-id}/review-resolve-result.md.
```

Without `--yes` → developer invokes `/arc:code review-resolve {pr-id}` manually.

### Step 11: Merge

**Always human.** Merge is irreversible. Agent does not press the merge button.

### Step 12: Skill-Up

With `--yes` → run `/arc:project skill-up` after merge.
Without `--yes` → developer invokes manually.

## --stop Flag

`--stop={phase}` runs in `--yes` mode until the specified phase, then switches to pair mode.

Phase names for `--stop`:
```
prd-validate, ac-validate, ac-enrich, ac-gate, plan, code, validate, test-write, test-review,
test-validate, test-mutate, ac-verify, code-review-request, code-review-resolve
```

Example: `--yes --stop=code-review-request` → autopilot through coding and testing, then pair mode for PR review.

## --skip Flag

`--skip={phase}` skips a phase entirely. Can be repeated.

Skippable phases:
```
prd-validate, ac-enrich, validate, test-review, test-mutate
```

Other phases are mandatory and cannot be skipped.
