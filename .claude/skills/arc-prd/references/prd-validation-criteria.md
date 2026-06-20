# PRD Validation Criteria

Reference material for `/arc:prd` validation. Five criteria for the PRD as a whole, applied between drafting the PRD and writing AC.

## Five Quality Criteria

A PRD must pass ALL five criteria before any AC scenario is written. Failures cascade — a vague PRD produces interpretive AC.

### Criterion 1: Source-of-truth boundary

> PRD describes *what and why*. AC describes *how to verify*.

User Journey and Scope stay high-level — which screens, in what order, what unblocks the next step. Concrete behavioral assertions ("after 3 seconds it fades into X") belong in AC, not PRD prose. When the two diverge, the AC wins by definition — but divergence is a quality bug.

- **FAIL:** "After 3 seconds (or on tap to skip) it fades into SelectLanguage" → restates an AC scenario in prose
- **PASS:** "AppIntro splash precedes language selection" → high-level, AC fills the detail

### Criterion 2: Implementation-free at PRD level

> No observable-but-internal hints. No "how" disguised as "what".

Animation behavior is *what the user sees* and may live in AC. "No white flash", "no layout shift", "fades smoothly" describe an implementation outcome and belong either in `Non-functional Requirements` as a measurable NFR or in plan.md.

- **FAIL:** "no white flash on launch", "no layout shift between screens", "smooth fade-in transitions" listed as scope items
- **PASS:** "Splash visible within {budget}ms of launch" (measurable NFR)
- **PASS:** "AppIntro transitions into SelectLanguage" (high-level, AC asserts the observable)

### Criterion 3: Concrete parameters

> Every numeric, format, or threshold value must be a concrete value, not a placeholder.

If the PRD references a "minimum length", a "maximum cooldown", or a "rate limit", it must give the number. Phrases like "the minimum allowed", "after several resends", "long inputs" leave AC to invent values.

- **FAIL:** "international phone (`+` followed by digits)" → no length bound
- **PASS:** "international phone (`+` followed by 8–15 digits)"
- **FAIL:** "after several resends, button locks"
- **PASS:** "after the 5th consumed resend, button locks for 480 seconds"

Also: every term used in AC with a specific meaning must be defined once in PRD. "5 resends consumed" requires a clear definition of what counts (a successful RESEND click? a visit to the resend screen?).

### Criterion 4: Open Questions are blockers

> Anything in `## Open Questions` cannot be referenced from AC.

AC-writing is gated until either:
- (a) the question is closed in PRD with a concrete answer, or
- (b) the topic is moved to `What's NOT included` (out of scope for this feature).

If an AC scenario reads "the chosen behavior is documented in plan.md" or "TBD", it has escalated an unresolved PRD question downstream. Reject, fix the PRD, then write the AC.

### Criterion 5: Scope and Unknowns are separate

> `What's NOT included` is for explicit exclusions. Unknowns belong in `Open Questions`.

Mixing them confuses developers and agents — "this feature does X" and "we haven't decided X" look identical in a bullet list.

- **FAIL:** Listing "home route name is undecided" under What's NOT included
- **PASS:** Same item under Open Questions, blocking AC that references home routing

## How to Apply

Run after the PRD draft is approved by the developer (informally) and before writing any AC. Walk every paragraph and bullet and mark each with a criterion result. Any FAIL → rewrite that section, do not write AC yet.

A PRD that passes all five criteria can support falsifiable, traceable AC. A PRD that fails any one of them will produce AC with the same defect.
