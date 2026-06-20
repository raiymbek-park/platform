# Implement — Single Ticket

Full implementation cycle for one ticket. Groups related skills into tiered agent calls to share context. Single skills run directly in main chat.

**Agent tiers:**
- `arc:archmage` — deep reasoning, code generation (opus)
- `arc:mage` — analysis, enrichment, tests (sonnet)
- `arc:apprentice` — validation, checks, execution (haiku)

## Pipeline

```
/arc:apprentice — PRD Phase: prd validate
[gate]

/arc:mage       — AC Phase: ac validate → ac enrich → ac validate
[gate]

main            — plan
[gate]

/arc:archmage   — Code: code
[gate]

main            — Validate: code validate
[gate]

/arc:mage       — Test Phase: test write → test review → test validate → test mutate → ac verify
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

### Step 0: PRD Phase (arc:apprentice)

```
/arc:apprentice
Read .arcana/project-context.md and the PRD for the feature owning {ticket-id}.
Run: prd validate.
Flags: {pass --yes}.
Write result to .arcana/{feature}/prd-validate-report.md.
```

**Gate:** Read prd-validate-report.md. If FAILED → stop, show report. The AC-update loop spins indefinitely when the root cause is in the PRD; stopping early saves iterations. Resolution: `/arc:prd update {feature-name}` then re-run `/arc:implement {ticket-id}`.

If `--skip=prd-validate` → skip this step. Use only when the PRD is known-good (e.g., it was just validated in a prior run).

### Step 1: AC Phase (arc:mage)

```
/arc:mage
Read .arcana/project-context.md and AC files for {ticket-id}.
Run in order: ac validate → ac enrich → ac validate.
If ac validate fails → ac update → ac validate (loop, max {--max-retries}).
If --skip=ac-enrich → skip ac enrich.
Flags: {pass --yes and --max-retries}.
Write result to .arcana/{feature}/{ticket-id}/ac-phase-result.md.
```

**Gate:** Read ac-phase-result.md. If FAILED → stop, show report. If not `--yes` → show enriched AC and ask: "Proceed?"

### Step 2: Plan (main)

Run `/arc:plan {ticket-id}` directly in main chat.

If plan recommends splitting → stop, suggest `/arc:prd update`.

**Gate:** If not `--yes` → show plan and ask: "Proceed?"

### Step 3: Code (arc:archmage)

If `--test-first` → skip to Step 4 first, then return here.

```
/arc:archmage
Read .arcana/project-context.md, AC files for {ticket-id},
plan from .arcana/{feature}/{ticket-id}/plan.md.
Run: code.
Flags: {pass --yes}.
Write result to .arcana/{feature}/{ticket-id}/code-phase-result.md.
```

**Gate:** Read code-phase-result.md. If not `--yes` → show changes and ask: "Proceed?"

### Step 3.5: Validate (main)

Run `/arc:code validate` directly in main chat to audit the branch diff against the project's coding rules before tests are written.

Behavior:
- `--yes` → pass `-y` to validate so mechanical fixes auto-apply.
- Pair mode (no `--yes`) → validate's own confirmation gate handles approval of mechanical fixes.
- Review-only findings are surfaced but do NOT block — the developer decides per finding whether to address them now or carry them into the test/review cycle.

If validate applies mechanical fixes → commit them via `/git` before continuing (e.g., `fix({slug}): {short summary of rule violations}`). Loop: validate → fix → validate, max `{--max-retries}` iterations. If iterations exhaust with mechanical findings still present → stop and escalate.

If `--skip=validate` → skip this step. Use only when validate was already run separately or when the project has no rules to enforce.

**Gate:** With `--yes` → proceed if 0 findings or only review-only remain. With pair mode → show the validate report and ask: "Proceed to test phase?"

### Step 4: Test Phase (arc:mage)

```
/arc:mage
Read .arcana/project-context.md, AC files for {ticket-id},
test/references/testing-strategy.md, relevant example references from project-context,
production code and test files for the feature.
Run in order: test write → test review → test validate → test mutate → ac verify.
If test review needs work → test write → test review (loop, max {--max-retries}).
If test validate red → fix code or tests → test validate (loop, max {--max-retries}).
If test mutate survivors → ac update → test write → test mutate (loop, max {--max-retries}).
If ac verify partial → fix code → ac verify (loop, max {--max-retries}).
If --skip=test-review → skip test review.
If --skip=test-mutate → skip test mutate.
Flags: {pass --yes and --max-retries}.
Write result to .arcana/{feature}/{ticket-id}/test-phase-result.md.
```

**Gate:** Read test-phase-result.md. If FAILED → stop, show report. If not `--yes` → show test results and ask: "Proceed?"

### Step 5: PR (main)

Run `/arc:code review-request {ticket-id}` directly in main chat.

**Gate:** If not `--yes` → show PR link.

### Step 6: PR Resolution (arc:archmage — on demand)

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

### Step 7: Merge

**Always human.** Merge is irreversible. Agent does not press the merge button.

### Step 8: Skill-Up

With `--yes` → run `/arc:project skill-up` after merge.
Without `--yes` → developer invokes manually.

## --stop Flag

`--stop={phase}` runs in `--yes` mode until the specified phase, then switches to pair mode.

Phase names for `--stop`:
```
prd-validate, ac-validate, ac-enrich, plan, code, validate, test-write, test-review,
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
