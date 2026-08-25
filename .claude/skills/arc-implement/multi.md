# Implement — Multi-Ticket (PRD)

Implement all tickets from a PRD. Builds a dependency graph, runs tickets in waves. Each ticket's
writing work runs as a separate `arc:archmage` agent in one context; its checks run from the
orchestrator so they never land in the context that produced the work (no nested agents).

**Agent tiers:**
- `arc:archmage` — each ticket in a wave gets its own archmage (AC enrich → plan → code → tests)
- `arc:apprentice` — per-ticket gate from the orchestrator (ac validate → ac verify), then PR
- `arc:mage` — not used directly (archmage handles the writing half per ticket)

## Steps

### Step 1: Read PRD and Tickets

1. Read `.arcana/project-context.md` for project structure
2. Find the PRD for `feature-name`
3. Find all tickets associated with this PRD (via tracker skill or AC file references)
4. If no tickets found → error: "No tickets found for `{feature-name}`. Run `/arc:prd create {feature-name}` first." and stop

### Step 2: Validate PRD (arc:apprentice)

```
/arc:apprentice
Read .arcana/project-context.md and the PRD for {feature-name}.
Run: prd validate.
Flags: {pass --yes}.
Write result to .arcana/{feature}/prd-validate-report.md.
```

**Gate:** Read prd-validate-report.md. If FAILED → stop, show report. A bad PRD propagates to every ticket in every wave; fixing it once is much cheaper than discovering the same defect in N parallel ticket runs. Resolution: `/arc:prd update {feature-name}` then re-run `/arc:implement prd:{feature-name}`.

If `--skip=prd-validate` → skip this step. Use only when the PRD is known-good.

### Step 3: Build Dependency Graph

Analyze ticket dependencies and group into waves:

```
Wave 1 (parallel):  Tickets with no dependencies
Wave 2 (parallel):  Tickets that depend only on Wave 1
Wave 3 (parallel):  Tickets that depend only on Wave 1 + 2
...
```

Write wave status to `.arcana/{feature}/wave-status.md`:

```markdown
# Wave Status — {feature-name}

## Wave 1 (parallel)
- [ ] {ticket-id}: {title} — not started
- [ ] {ticket-id}: {title} — not started

## Wave 2 (depends on Wave 1)
- [ ] {ticket-id}: {title} — blocked

## Wave 3 (depends on Wave 2)
- [ ] {ticket-id}: {title} — blocked
```

**Confirmation gate:** If not `--yes` → show dependency graph and ask: "Proceed with this execution order?" Wait for confirmation.

### Step 4: Execute Waves

For each wave, launch all tickets as separate `arc:archmage` agents:

**With `--yes`:**

```
For each ticket in wave:
  /arc:archmage
  Read .arcana/project-context.md, AC files for {ticket-id},
  test/references/testing-strategy.md, relevant example references from project-context.
  Execute the writing half of the single-ticket cycle in this context:
    1. ac enrich
    2. plan
    3. code
    4. test write → test review → test validate → test mutate
  Handle all feedback loops internally (max {--max-retries}).
  Do NOT run ac validate or ac verify on your own output, and do NOT open the PR —
  the orchestrator gates both (Step 5).
  Flags: --yes --max-retries={N}.
  Write result to .arcana/{feature}/{ticket-id}/full-cycle-result.md.
```

### Step 5: Per-Ticket Gate (arc:apprentice, orchestrator level)

Each ticket's archmage holds one context from AC through tests. Left to also run `ac validate`
and `ac verify` there, it would be grading work it produced minutes earlier in the same context
— the rubber stamp `single.md` Steps 3 and 8 exist to prevent. Archmage cannot spawn its own
verifier (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1`), so the gate runs from the orchestrator, which
sits at depth 0.

As each ticket's archmage returns — not after the whole wave — run:

```
/arc:apprentice
Read .arcana/project-context.md, AC files for {ticket-id},
production code and test files for the ticket.
Run in order: ac validate → ac verify.
Report findings with file-and-line evidence. Do NOT amend AC, code, or tests.
Flags: --yes --max-retries={N}.
Write result to .arcana/{feature}/{ticket-id}/gate-result.md.
```

On findings, route back to that ticket's `/arc:archmage` and re-run this gate (loop, max
`{--max-retries}`). Only after the gate is clean does the orchestrator run
`/arc:code review-request {ticket-id}` and mark the ticket as PR-open in wave-status.md.

Gating per ticket rather than per wave keeps the concurrency budget honest: with
`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS=3`, a returning archmage frees a slot that the gate then
occupies, instead of every gate queueing behind the slowest ticket in the wave.

- Tickets within a wave run in parallel (independent of each other), bounded by
  `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`; a wave wider than that cap runs in batches
- Each archmage has its own context — no interference between tickets
- Every ticket passes the Step 5 gate before its PR is opened
- When all tickets in a wave are merged → start next wave

**Without `--yes` (pair mode):**
- Execute tickets sequentially within each wave
- Developer confirms at each gate

Update `.arcana/{feature}/wave-status.md` as tickets progress:
```
- [x] {ticket-id}: {title} — merged
- [ ] {ticket-id}: {title} — PR open, review in progress
```

### Step 6: Wave Transitions

Monitor wave progress:
- Ticket merged → update wave-status.md → check if all tickets in current wave are done
- All tickets in current wave merged → start next wave automatically
- Ticket blocked (failed after max retries) → block the entire wave, do NOT start dependent waves

**Failure escalation:**
- Mark the failed ticket as `blocked` in wave-status.md with the reason
- Mark all dependent waves as `waiting` (not `blocked` — they can proceed once the blocker is resolved)
- Notify the developer with: which ticket failed, which phase failed, what the error was, and which waves are waiting
- Developer resolves the issue manually, then re-invokes `/arc:implement {ticket-id} --yes` for the failed ticket
- Once the failed ticket's PR is merged → resume dependent waves

### Step 7: Completion

When all waves are complete:
1. Update wave-status.md → all done
2. Invoke `/arc:project skill-up` to analyze the full feature cycle

### Step 8: Output

> **Implement PRD — {feature-name}:**
> Waves: {number}
> Tickets: {total} ({completed} done, {in-progress} in progress, {blocked} blocked)
> Status: `.arcana/{feature}/wave-status.md`

## Example

```
/arc:implement prd:checkout --yes

  1. Build dependency graph → .arcana/checkout/wave-status.md
  2. Wave 1 (parallel — 3 archmage agents):
     /arc:archmage TASK-101 → write → /arc:apprentice gate → PR
     /arc:archmage TASK-102 → write → /arc:apprentice gate → PR
     /arc:archmage TASK-103 → write → /arc:apprentice gate → PR
  3. All Wave 1 PRs merged → start Wave 2:
     /arc:archmage TASK-104 → write → /arc:apprentice gate → PR
  4. Wave 2 merged → start Wave 3:
     /arc:archmage TASK-105 → write → /arc:apprentice gate → PR
  5. All done → /arc:project skill-up
```
