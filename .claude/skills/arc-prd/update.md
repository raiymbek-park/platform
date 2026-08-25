# PRD Update

Cascade update when requirements change. Modifies PRD → updates affected AC → marks tickets that need review.

## Contract

- **PRD body** = canonical current-state requirements. The PRD always reflects the latest truth — no "previously X, now Y" prose in section bodies, no in-document history table.
- **AC files** = canonical current scenarios. Removed scenarios are deleted, not commented out.
- **Change history** lives in `git log docs/features/{feature-name}/`, not in the documents.

## Non-goals

- This skill does **not** maintain a changelog inside the PRD or AC files.
- This skill does **not** append rows to any history table.
- This skill does **not** keep removed AC scenarios as commented-out blocks — they are deleted outright.
- This skill does **not** produce git commits or prepare commit messages — committing changes is the developer's responsibility.

## Steps

### Step 1: Locate Existing PRD

1. Read `.arcana/project-context.md` for project structure
2. Find PRD directory for `feature-name`
3. If not found → error: "No PRD found for `{feature-name}`. Use `/arc:prd create {feature-name}` first." and stop
4. Read existing PRD and all AC files

### Step 2: Gather Changes

Ask the developer what changed:

> What changed in **{feature-name}**? Describe the requirement changes — I'll cascade updates through PRD, AC, and tickets.

Wait for response. If changes are unclear → ask follow-up questions.

### Step 3: Update PRD

Apply changes to `prd.md`:
- Update affected sections in place — section bodies must reflect only the current state
- Do not rewrite unchanged sections
- Do not add a change-history entry, do not create a history section, do not leave "previously X" notes in section bodies

**Confirmation gate:** If `-y` → proceed. Otherwise → show the PRD diff and ask: "Apply these changes to the PRD?" Wait for confirmation.

### Step 4: Update Affected AC

Determine which AC scenarios are affected by the PRD changes:
- Modified requirements → update corresponding scenarios in place
- New requirements → add new scenarios to the appropriate AC file
- Removed requirements → delete the scenarios outright. Do not comment them out.

**Confirmation gate:** If `-y` → proceed. Otherwise → show AC changes and ask: "Apply these AC changes?" Wait for confirmation.

### Step 5: Mark Affected Tickets

If a tracker skill is configured:
1. Identify which tickets are affected by the AC changes
2. Add a comment to each affected ticket via the tracker skill explaining what changed
3. If new tasks needed → create new tickets

If no tracker skill → list affected tasks in the output for the developer to update manually.

### Step 6: Proofread

Apply the same text-pattern scan as `create.md` Step 4 — placeholders and unresolved values,
narrative-in-time framing, version/wiring detail, Open Questions that Scope now depends on,
unknowns filed as exclusions. Cascade updates reintroduce exactly these: stale numbers left over
from before the change, "previously X, now Y" prose describing the update itself.

If anything is hit:
- Surface it in the output
- Do not block — the developer may have intentionally introduced a temporary inconsistency
  mid-update — but flag clearly so it cannot be silently shipped
- Recommend `/arc:prd update {feature-name}` again or a targeted manual fix

The full seven-criterion audit is not run here, for the same reason as at create time: this agent
just wrote the changes and would be grading its own work. It runs with fresh context via
`/arc:prd validate {feature-name}`, and again at the top of any `/arc:implement` run.

### Step 7: Output

> **PRD Updated — {feature-name}:**
> - PRD: updated {number} sections
> - AC: {number} scenarios modified, {number} added, {number} removed
> - Tickets affected: {list of ticket IDs or "no tracker configured — manual update needed"}
> - Change: {brief description of what changed}
> - Proofread: {clean | flagged — list what was hit}
>
> {If flagged:} Next: `/arc:prd update {feature-name}` to fix, or run `/arc:prd validate {feature-name}` for the full independent audit.
