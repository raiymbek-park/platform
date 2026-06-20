---
name: arc:prd
description: >
  Create, validate, and update Product Requirements Documents with Acceptance Criteria.
  PRD lives in the repository as source of truth. AC written in Given/When/Then format.
  Use when starting a new feature, creating requirements, validating PRD quality, writing
  AC scenarios, or updating existing requirements. Triggers on "arc:prd create",
  "arc:prd validate", "arc:prd update", "create PRD", "validate PRD", "check PRD",
  "new feature", "write requirements", "update PRD", "requirements changed".
user-invocable: true
argument-hint: "create|validate|update {feature-name} [-y]"
license: MIT
metadata:
  author: supa-magic
  version: 1.1.0
  category: workflow
  tags: [prd, requirements, acceptance-criteria, bdd, feature-planning, validation]
---

# /arc:prd $ARGUMENTS

Create, validate, and update Product Requirements Documents with Acceptance Criteria.

## Usage

```
/arc:prd create checkout           Interactive PRD creation for "checkout" feature
/arc:prd validate checkout         Validate PRD quality against the five criteria
/arc:prd validate checkout -y      Validate, skip confirmations
/arc:prd update checkout           Cascade update when requirements change
/arc:prd update checkout -y        Update, skip confirmations
```

| Argument | Format | Default | Effect |
|----------|--------|---------|--------|
| `create` \| `validate` \| `update` | Subcommand (first token) | — | Determines workflow (required) |
| `feature-name` | Positional | — | Feature identifier — used for directory and file naming |
| `-y`, `--yes` | Flag | `false` | Skip confirmation gates (NOT available for `create` — always pair mode) |

## Instructions

### Step 1: Parse Arguments

1. First non-flag token → `subcommand` (`create`, `validate`, or `update`). If missing or not one of these → error: "Subcommand required. Usage: `/arc:prd create|validate|update {feature-name}`" and stop.
2. Next non-flag token(s) → `feature-name`. If missing → error: "Feature name required. Usage: `/arc:prd {subcommand} {feature-name}`" and stop.
3. `-y` or `--yes` anywhere → `skip_confirmations = true`
4. If `subcommand = create` and `skip_confirmations = true` → ignore the flag. `/arc:prd create` is always pair mode — requirements need human input.

### Step 2: Route to Subcommand

Read the corresponding sub-instruction file and follow all steps:

| Subcommand | File | Purpose |
|------------|------|---------|
| `create` | [create.md](create.md) | Interactive PRD + AC creation (always pair mode) |
| `validate` | [validate.md](validate.md) | Check PRD quality — pure validator, does not fix |
| `update` | [update.md](update.md) | Cascade update of PRD + AC + ticket marking, then re-validate |

## Shared Context

**Project context:** `.arcana/project-context.md` — read first for project structure, conventions, and external skill configuration (tracker, git).

**PRD and AC structure** (actual paths from project-context). See [references/prd-structure.md](references/prd-structure.md) for templates and conventions, and [references/prd-validation-criteria.md](references/prd-validation-criteria.md) for the five quality criteria the PRD must pass before AC is written:
```
{features-directory}/{feature}/
  prd.md                ← PRD (permanent, in git)
  ac/
    happy-path.md       ← main scenarios
    validation.md       ← input validation
    error-states.md     ← external failures
    edge-cases.md       ← boundary conditions
```

**External skill dependencies:**
- **Tracker skill** (Jira, GitHub Issues, Linear) — for creating Epic + tickets. Delegated via external skill configured in project-context.
- If tracker skill not installed → warn and skip ticket creation. PRD + AC still written to repo.

## Examples

### Example 1: New feature kickoff

User says: `/arc:prd create checkout`
Actions:
1. Check for existing `checkout/` PRD → none → proceed
2. Interactive Q&A: problem, users, scope, NFR, dependencies
3. Draft PRD, validate against 5 quality criteria, loop until PASS
4. Write AC scenarios (happy-path, validation, error-states, edge-cases as needed)
5. Slice tasks (vertical, happy-path first), create tickets via tracker skill
Result: `docs/features/checkout/prd.md` + `ac/*.md` written, Epic + tickets created.

### Example 2: Requirements change mid-feature

User says: `/arc:prd update checkout` (after PM clarifies that "Apple Pay" is in scope)
Actions:
1. Read existing PRD + AC
2. Ask what changed
3. Edit affected PRD sections in place (no history table — git tracks the diff)
4. Update / add / delete AC scenarios; commented-out scenarios are not kept
5. Add comment to affected tickets via tracker skill
6. Re-validate PRD against the 5 criteria
Result: PRD + AC reflect new truth; ticket trail of cascade impact.

### Example 3: Quality check before AC writing

User says: `/arc:prd validate checkout -y`
Actions:
1. Locate PRD
2. Walk every section against the 5 criteria
3. Write report to `.arcana/checkout/prd-validate-report.md` (`-y` skips confirmation)
Result: PASS/FAIL verdict with per-criterion findings; if FAIL, points to `/arc:prd update`.

## Troubleshooting

### Error: Tracker skill not configured
Cause: No tracker skill installed or configured in `.arcana/project-context.md`.
Solution: Run `/arc:project init` to install and configure a tracker skill. PRD and AC can still be created without a tracker — tickets are skipped.

### Error: Feature already exists (create mode)
Cause: PRD directory for this feature already exists.
Solution: Use `/arc:prd update {feature-name}` instead, or choose a different feature name.
