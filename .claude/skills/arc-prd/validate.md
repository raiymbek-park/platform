# PRD Validate

Pure validator — checks PRD quality and reports. Does not fix.

PRD validation runs at the feature level, not the ticket level — a PRD is a single document shared across all tickets in the feature. Output paths drop `{ticket-id}` accordingly.

## Steps

### Step 1: Locate PRD

1. Read `.arcana/project-context.md` to find feature directory locations and project conventions
2. Find PRD file for `feature-name` (`{features-directory}/{feature-name}/prd.md`)
3. If no PRD found → error: "No PRD found for `{feature-name}`. Use `/arc:prd create {feature-name}` first." and stop

### Step 2: Apply Validation Criteria

For the PRD as a whole, apply the six quality criteria from [references/prd-validation-criteria.md](references/prd-validation-criteria.md):

1. **Source-of-truth boundary** — PRD says what/why; AC says how to verify. User Journey and Scope stay high-level; concrete behavioral assertions belong in AC.
2. **Implementation-free at PRD level** — no "no white flash", "no layout shift", "fades smoothly" — animation outcomes belong in NFR-as-measurable or AC.
3. **Concrete parameters** — every numeric, format, or threshold value is a concrete value, not a placeholder ("minimum allowed", "after several").
4. **Open Questions are blockers** — anything in `## Open Questions` cannot be referenced from AC.
5. **Scope and Unknowns are separate** — `What's NOT included` ≠ `Open Questions`.
6. **Current-state, not narrative-in-time** — describe the target state in present tense; no "previously X, now Y" / "until now it was…" / before-after framing. Change history lives in `git log`, not the PRD body.

Walk every section (Problem and Goal, Users, Definitions, Scope, Validation Contract, etc., User Journey, Success Metrics, NFR, Dependencies, Open Questions) and mark each criterion result.

For Criterion 4, also scan AC files (if they exist) for any text matching `documented in plan.md`, `(see PRD)` referencing an unresolved item, `TBD`, or scenarios whose required behavior depends on a section listed under `## Open Questions`. Each match is a failure.

For Criterion 7-style traceability between PRD numeric values and AC numeric values, use `/arc:ac validate` separately — that lives in arc:ac. PRD validate only checks the PRD itself.

### Step 3: Write Report

Write validation report to `.arcana/{feature-name}/prd-validate-report.md`.

Report format:

```markdown
# PRD Validation Report — {feature-name}

**Status:** PASS | FAIL
**Date:** {date}
**PRD validated:** {path}

## Per-Criterion Results

### Criterion 1: Source-of-truth boundary
- Result: PASS | FAIL
- Findings: {specific section + line if FAIL, e.g., "User Journey paragraph 2: 'After 3 seconds (or on tap to skip) it fades into SelectLanguage' restates AC happy-path Scenario 1 in prose"}

### Criterion 2: Implementation-free at PRD level
- Result: PASS | FAIL
- Findings: {specific phrases, e.g., "Scope > What's included: 'no white flash', 'no layout shift'"}

### Criterion 3: Concrete parameters
- Result: PASS | FAIL
- Findings: {specific placeholders, e.g., "Identity formats: 'phone shorter than allowed minimum' — no minimum length defined"}

### Criterion 4: Open Questions are blockers
- Result: PASS | FAIL
- Findings: {specific AC references, e.g., "edge-cases.md Scenario 17 says 'documented in plan.md' for an unresolved timer-expiry behavior"}

### Criterion 5: Scope and Unknowns are separate
- Result: PASS | FAIL
- Findings: {misplaced items, e.g., "What's NOT included contains 'home destination route name is undecided' — this is an open question, not an exclusion"}

## Summary

{number} criteria evaluated, {number} passed, {number} failed.
{If FAIL: list of section-by-section issues to fix.}

## Recommendations

{If FAIL: concrete next step — typically "Run `/arc:prd update {feature-name}` and apply the fixes listed above, then re-run `/arc:prd validate`".}
{If PASS: "PRD is ready for AC writing or ticket implementation."}
```

**Confirmation gate:** If `-y` → write report and output summary. Otherwise → show report and ask: "PRD validation complete. Write report to `.arcana/{feature-name}/prd-validate-report.md`?" Wait for confirmation.

### Step 4: Output

> **PRD Validation — {feature-name}:** {PASS|FAIL}
> {number} criteria: {passed} passed, {failed} failed
> Report: `.arcana/{feature-name}/prd-validate-report.md`
>
> {If FAIL:} Next: `/arc:prd update {feature-name}` to fix, then re-run validation.
> {If PASS:} PRD is ready. Next: `/arc:ac validate {ticket-id}` once AC has been written, or `/arc:code {ticket-id}` if implementation begins.
