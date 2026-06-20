# AC Validate

Pure validator — checks AC quality and reports. Does not fix.

## Steps

### Step 1: Locate AC Files

1. Read `.arcana/project-context.md` to find AC file locations and project conventions
2. Find the feature directory associated with `ticket-id`
3. Collect all AC files for the feature
4. If no AC files found → error and stop

### Step 2: Validate Each Scenario

For every scenario in the AC files, apply the eight quality criteria from [references/validation-criteria.md](references/validation-criteria.md):

1. **Falsifiable** — can code satisfy the requirement but violate this AC?
2. **Observable** — is the result visible to end user or developer-consumer?
3. **Testable** — can it be verified automatically without subjective judgment?
4. **Implementation-free** — described in business language, no code internals?
5. **Self-contained** — no forward references ("covered by Scenario X", "documented in plan.md", "TBD")
6. **Non-derivative** — adds a constraint no other scenario already implies
7. **PRD-traceable** — every numeric/format/threshold value traces back to a concrete PRD value
8. **Atomic Then clauses** — each Then addresses a single observable concern, no buried contracts

Mark each scenario: **pass** (all eight criteria met) or **fail** (with explanation of which criteria failed and why).

### Step 3: Check Completeness

For features with async operations or data loading, verify the AC set covers all required states. See completeness checklist in [references/validation-criteria.md](references/validation-criteria.md).

Mark completeness: **complete** or **incomplete** (listing missing states).

### Step 4: Write Report

Write validation report to `.arcana/{feature}/{ticket-id}/validate-report.md`.

Report format:

```markdown
# AC Validation Report — {ticket-id}

**Status:** PASS | FAIL
**Date:** {date}
**AC files validated:** {list of files}

## Per-Scenario Results

### {ac-file}: {scenario-name}
- Falsifiable: PASS | FAIL — {explanation if fail}
- Observable: PASS | FAIL — {explanation if fail}
- Testable: PASS | FAIL — {explanation if fail}
- Implementation-free: PASS | FAIL — {explanation if fail}
- Self-contained: PASS | FAIL — {explanation if fail}
- Non-derivative: PASS | FAIL — {explanation if fail}
- PRD-traceable: PASS | FAIL — {explanation if fail}
- Atomic Then clauses: PASS | FAIL — {explanation if fail}

### ...

## Completeness

- Success state: COVERED | MISSING
- Loading state: COVERED | MISSING | N/A
- Error state: COVERED | MISSING
- Empty state: COVERED | MISSING | N/A

## Summary

{number} scenarios validated, {number} passed, {number} failed.
{Completeness status.}
```

**Confirmation gate:** If `-y` → write report and output summary. Otherwise → show report and ask: "AC validation complete. Write report to `.arcana/{feature}/{ticket-id}/validate-report.md`?" Wait for confirmation.

### Step 5: Output

> **AC Validation — {ticket-id}:** {PASS|FAIL}
> {number} scenarios: {passed} passed, {failed} failed
> Completeness: {complete|incomplete}
> Report: `.arcana/{feature}/{ticket-id}/validate-report.md`

## Troubleshooting

### Many scenarios fail Criterion 7 (PRD-traceable) at once

Cause: the PRD itself is missing the values that AC needs to trace back to. The defect is upstream in the PRD, not in the AC.

Solution: stop the AC update loop. Run `/arc:prd validate {feature-name}` to confirm. If PRD validation fails on Criterion 3 (Concrete parameters), fix the PRD first via `/arc:prd update {feature-name}`, then re-run AC validation. AC-update loops cannot recover from a PRD that does not define the values they need.

### Many scenarios contain "documented in plan.md" or similar

Cause: the PRD has unresolved Open Questions that AC has been forced to defer. AC is not the right place to resolve a PRD question.

Solution: run `/arc:prd validate {feature-name}` — Criterion 4 will flag this. Resolve the PRD question via `/arc:prd update {feature-name}`, then rewrite the affected scenarios.
