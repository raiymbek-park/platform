# Implement — Bug Fix

Short implementation cycle for bug fixes. Groups related skills into tiered agent calls. Single skills run directly in main chat.

**Agent tiers:**
- `arc:archmage` — deep reasoning, code generation (fable)
- `arc:mage` — analysis, enrichment, tests (opus)
- `arc:apprentice` — independent verification, fresh context (opus, low effort)

## Pipeline

```
main            — create ticket (if no ticket-id)
[gate]

/arc:mage       — AC Phase: read bug → prd update → ac update
/arc:apprentice — AC Gate: ac validate (fresh context)
[gate]

/arc:archmage   — Fix Phase: test write → code → test validate
[gate]

main            — Validate: code validate
[gate]

/arc:apprentice — Verify Phase: ac verify (fresh context)
[gate]

main            — code review-request
[gate]
/arc:archmage   — code review-resolve (on demand)
[gate]
                  merge → main (HUMAN)
```

## Steps

### Step 1: Gather Bug Details and Create Ticket (main — if no ticket-id)

If the developer provided a `ticket-id` → skip this step.

If `--fix` was called without a ticket-id → interactive mode:

> **What's the bug?** Describe what's broken — expected vs actual behavior.

Wait for response.

> **How to reproduce?** Steps to trigger the bug (or "unknown").

Wait for response.

> **Which feature/area is affected?** (or "not sure")

Wait for response.

From the collected details:
1. Summarize into a structured bug report (what's broken, reproduction steps, affected area)
2. Use the issue tracker skill (configured in `project-context.md`) to create a bug ticket
3. Store the created `ticket-id` for the rest of the pipeline

**Gate:** If not `--yes` → show the created ticket and ask: "Proceed?"

### Step 2: AC Phase (arc:mage)

```
/arc:mage
Read .arcana/project-context.md, AC files for {ticket-id}, and bug report from tracker.
Run in order:
  1. Analyze the bug report — identify what's broken, reproduction steps, affected feature.
  2. If PRD is vague or missing context for this bug → prd update.
  3. ac update — add scenario covering the bug (describe expected behavior, not the bug).
Flags: {pass --yes and --max-retries}.
Write result to .arcana/{feature}/{ticket-id}/ac-phase-result.md.
```

Quality grading of the new scenario is deliberately not in this block: the agent that wrote it
would be marking its own work against criteria it already had in view. It moves to Step 3.

**Gate:** Read ac-phase-result.md. If FAILED → stop. If not `--yes` → show new AC scenario and ask: "Proceed?"

### Step 3: AC Gate (arc:apprentice)

```
/arc:apprentice
Read .arcana/project-context.md and AC files for {ticket-id}.
Run: ac validate.
If fail → report which scenarios failed which criteria; do NOT rewrite them yourself.
Flags: {pass --yes and --max-retries}.
Write result to .arcana/{feature}/{ticket-id}/ac-gate-result.md.
```

On fail, route back to `/arc:mage` for `ac update`, then re-run this gate (loop, max
`{--max-retries}`). Writer and grader stay in separate contexts on every iteration.

**Gate:** Read ac-gate-result.md. If FAILED after retries → stop, show report. If not `--yes` → show findings and ask: "Proceed?"

### Step 4: Fix Phase (arc:archmage)

```
/arc:archmage
Read .arcana/project-context.md, AC files for {ticket-id},
test/references/testing-strategy.md, relevant example references from project-context,
production code and test files for the feature.
Run in order:
  1. test write — write test that reproduces the bug (should be RED before fix).
  2. code — fix the bug (test should go GREEN).
  3. test validate — run tests.
     If red → fix code or tests → test validate (loop, max {--max-retries}).
Flags: {pass --yes and --max-retries}.
Write result to .arcana/{feature}/{ticket-id}/fix-phase-result.md.
```

**Gate:** Read fix-phase-result.md. If FAILED → stop. If not `--yes` → show results and ask: "Proceed?"

### Step 5: Validate (main)

Run `/arc:code validate` directly in main chat to audit the branch diff against the project's coding rules before the verify phase.

Behavior:
- `--yes` → pass `-y` so mechanical fixes auto-apply.
- Pair mode → validate's own confirmation gate handles fix approval.
- Review-only findings are surfaced but do NOT block.

If validate applies mechanical fixes → commit via `/git` before continuing. Loop: validate → fix → validate, max `{--max-retries}`. If iterations exhaust with mechanical findings still present → stop and escalate.

If `--skip=validate` → skip this step.

**Gate:** With `--yes` → proceed. With pair mode → show validate report and ask: "Proceed?"

### Step 6: Verify Phase (arc:apprentice)

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

The fix-phase archmage just wrote this code, so it cannot be the one to judge whether the code
satisfies the AC. On PARTIAL, route back to `/arc:archmage` and re-run this phase (loop, max
`{--max-retries}`); the verifier never fixes what it flagged.

**Gate:** Read verify-phase-result.md. If FAILED → stop. If not `--yes` → show verify report and ask: "Proceed?"

### Step 7: PR (main)

Run `/arc:code review-request {ticket-id}` directly in main chat.

**Gate:** If not `--yes` → show PR link.

### Step 8: PR Resolution (arc:archmage — on demand)

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

### Step 9: Merge

**Always human.** Merge is irreversible. Agent does not press the merge button.
