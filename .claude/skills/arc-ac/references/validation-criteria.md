# AC Validation Criteria

Reference material for `/arc:ac validate`. Eight criteria for individual scenarios, plus a completeness checklist for the full AC set.

## Eight Quality Criteria

Each AC scenario must pass ALL eight criteria. If any one fails, the scenario is invalid.

### Criterion 1: Falsifiable

> Can you write code that satisfies the requirement but violates this AC?

- YES → AC is useful (it adds a constraint beyond the requirement)
- NO → AC is a duplicate of the requirement → rewrite

**Examples:**

```
Requirement: User can submit the registration form

❌ FAIL: "Registration form works correctly"
   → Cannot satisfy the requirement while violating this AC — it's a paraphrase, not a constraint

✅ PASS: "After successful submission, user sees 'Check your email'"
   → Can build a form that submits but shows no message — AC is violated, therefore useful

✅ PASS: "Submit button is disabled when email is empty"
   → Can build a form that allows empty email submission — AC adds a real constraint
```

```
Requirement: User can enable dark theme

❌ FAIL: "Dark theme works correctly"
   → Paraphrase, not falsifiable

✅ PASS: "After toggling, data-theme attribute on <html> changes to 'dark'"
✅ PASS: "Theme choice persists after page reload"
✅ PASS: "System theme applies automatically if user hasn't chosen"
```

### Criterion 2: Observable

> Is the result visible to the end user or the developer-consumer?

Two users of any component:
- **End user** — sees DOM, clicks buttons, reads text
- **Developer-consumer** — passes props, receives callbacks

If the AC describes something neither user can see → it tests an implementation detail.

- YES → AC is valid
- NO → AC tests an implementation detail → rewrite

**Examples:**

```
❌ FAIL: "ThemeProvider calls setTheme('dark') when toggled"
   → setTheme is an internal method — no user sees it

✅ PASS: "All text elements use color from CSS variable --text-primary"
   → Observable effect that can be verified

❌ FAIL: "Component calls handleSubmit on click"
   → handleSubmit is an internal handler

✅ PASS: "On click 'Submit', form data is sent to /api/register"
   → HTTP request is an observable effect
```

**What to test vs what not to test:**

```
✅ Test:                    ❌ Don't test:
Props                       Internal state (isOpen, currentIndex)
Rendered output             Method names (handleClick, setOpenIndex)
User events                 CSS class names
HTTP requests               Child component names
```

### Criterion 3: Testable

> Can this be verified in an automated test without subjective judgment?

- YES → AC is valid
- NO → AC is subjective → make it concrete

**Examples:**

```
❌ FAIL: "Dark theme looks nice and is comfortable for the eyes"
   → "Looks nice" cannot be automated

✅ PASS: "Text-on-background contrast meets WCAG AA (4.5:1)"
   → Measurable, automatable

❌ FAIL: "Form error state is user-friendly"
   → "User-friendly" is subjective

✅ PASS: "On validation error, each invalid field shows error text below it"
   → Concrete, verifiable
```

### Criterion 4: Implementation-free

> Does the AC describe behavior in business language without referencing code internals?

No class names, API endpoints, database tables, internal method names, or framework-specific terms.

- YES → AC is valid
- NO → AC is coupled to implementation → rewrite in business language

**Examples:**

```
❌ FAIL: "WHEN a POST request is sent to /api/users"
   → References specific API endpoint

✅ PASS: "WHEN a new user registers"
   → Business language, implementation-agnostic

❌ FAIL: "Redux store updates userSlice.isAuthenticated to true"
   → References internal store structure

✅ PASS: "After login, user sees the dashboard with their name"
   → Describes what the user observes
```

### Criterion 5: Self-contained (no forward references)

> Does the scenario state its required behavior in full, without delegating to other documents or scenarios?

A scenario that says "covered by Scenario 8", "documented in plan.md", "see PRD", or "TBD" is not a scenario — it's a placeholder or a comment. Each scenario must stand alone and be testable on its own.

- YES → AC is valid
- NO → either remove (if duplicate), inline the referenced behavior, or escalate the unresolved question to PRD before writing this AC

**Examples:**

```
❌ FAIL: "reopening the app routes the user directly to /welcome (covered by Scenario 8)"
   → It's a comment about another scenario, not a scenario itself

❌ FAIL: "the chosen behavior is documented in plan.md"
   → Escalates an unresolved PRD question downstream — close it in PRD first

✅ PASS: "reopening the app routes the user directly to /welcome without showing onboarding"
   → States its own behavior; whether another scenario also covers it is a deduplication concern (Criterion 6)
```

### Criterion 6: Non-derivative

> Does this scenario test behavior that no other scenario already covers?

A scenario must add a constraint that no other scenario in the AC set already implies. State-restoration covered by `edge-cases.md` already implies that any per-screen indicator restored along with the screen is also restored — no separate scenario needed.

- YES → AC is valid
- NO → remove the derivative scenario or merge it into the one that subsumes it

**Examples:**

```
❌ FAIL: "Step indicator position is stable across reload"
   → Already implied by "user reopens app at step N → returns to step N" — derivative

✅ PASS: "Step indicator hidden on AppIntro"
   → Adds a constraint no other scenario covers (visibility, not position)
```

### Criterion 7: PRD-traceable

> Does every numeric, format, or threshold value in the scenario trace back to a concrete value in PRD?

AC cannot define new contract values — that is the PRD's job. If the PRD does not specify the threshold, the AC must not assume one. Stop, escalate to PRD, then write the AC.

- YES → AC is valid
- NO → the PRD has a missing value; do not write AC until PRD is fixed

**Examples:**

```
❌ FAIL: "phone shorter than allowed minimum" — PRD defines no minimum
   → AC invents a contract that doesn't exist; readers/agents will guess

✅ PASS: "phone shorter than 8 digits" — PRD: "international phone (`+` followed by 8–15 digits)"
   → Trace back to a concrete PRD value
```

### Criterion 8: Atomic Then clauses

> Does each Then clause address a single observable concern?

Multiple Then clauses are allowed and encouraged for related observables of the same action. But if a Then clause sneaks in a behavior that belongs to a different concern, it is invisible to readers searching for that concern's AC.

- YES → AC is valid
- NO → split the buried concern into its own scenario

**Examples:**

```
❌ FAIL:
  Scenario: Wrong code shows inline error
    Then: inline error appears
          the entered code is cleared
          timer continues counting down       ← buries a separate testable contract
   → Reader looking for "what does the timer do on wrong code?" won't find this scenario

✅ PASS:
  Scenario: Wrong code shows inline error and clears the input
    Then: inline error appears
          the entered code is cleared

  Scenario: Timer continues running after a wrong code
    Then: countdown does not pause or reset
```

## Completeness Checklist

After validating individual scenarios, check the AC set as a whole. For any feature with async operations or data loading, ALL of these states must be covered:

```
Success state  — data loaded, action completed successfully
Loading state  — data loading, action in progress
Error state    — request failed, action could not complete
Empty state    — no data, list is empty, no results
```

**Example — "Transaction History" feature:**

```
✅ Success: Transaction list with date, amount, and status
✅ Loading: Skeleton of 5 rows while data loads
✅ Error:   "Could not load history" + "Retry" button
✅ Empty:   "No transactions yet" + link to add funds

If any state is missing → AC set is incomplete.
```

**When completeness check applies:**
- Features that fetch data from API → all four states
- Features with form submission → success + error (loading and empty may be N/A)
- Pure UI features with no async → completeness check is N/A

## Extended Completeness — Beyond Async States

The success/loading/error/empty checklist is necessary but not sufficient. Apply the following extended checks when the relevant feature shape is present:

### Latency vs failure

A request that takes longer than expected but eventually succeeds is a different scenario than a request that fails. If the UI shows a loading state, it must define what happens when loading exceeds expected duration:

- Success-fast (typical case)
- Success-slow (loading visible longer than expected; UI must remain stable)
- Hard-fail (request errored)

Hard-fail alone is incomplete coverage of Question 1 (external).

### Form mode-switches

If a form has multiple input modes that share a single field (e.g. email-or-phone identity, currency picker, format toggle), each mode-switch is a distinct testable scenario:

- Mode A → Mode B: what happens to the previously-entered value?
- Mode B → Mode A: is the original value restored, cleared, or kept as-is?

Without this coverage, "switch and switch back" behavior is ambient and undefined.

### Intermediate back-navigation

For multi-step flows, "no back from first step" and "no back from last step" are not enough. Each intermediate step has its own back-navigation contract:

- From step N back to step N-1: are inputs on step N-1 preserved? Is the indicator updated?
- Back from a success state: is the success irreversible, or recoverable?

### Free-text length boundaries

Any free-text input has an implicit lower and upper bound. Both must be explicit:

- Single-character input — accepted or rejected?
- Maximum-length input — truncated, rejected with error, or hard-capped at the field?
- Above-maximum input — what specifically happens?

If PRD does not define the limits, escalate (Criterion 7 — PRD-traceable).
