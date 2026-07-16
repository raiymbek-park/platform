# Test Mutate

AI-driven mutation testing. Audits test quality — does not write tests, only identifies gaps.

Mutation testing intentionally breaks code (changes `>` to `>=`, `&&` to `||`, removes lines) and checks whether tests catch the breakage. If tests stay green after a mutation — the test doesn't actually verify that behavior.

**No contradiction with requirements-driven testing.** Mutation testing is not a tool for writing tests. It is an auditor of tests already written from requirements.

A surviving mutant is a **pointer, not a verdict** — most of them are not defects at all. Triage every
one before acting (Step 5); the common outcome is "the AC states this rule, but no test asserts it",
not "the AC is missing".

```
Tests from AC → mutation tool mutates business logic
                      ↓
              Surviving mutant → triage (Step 5)
                      ↓
   missing test → /arc:test write   ·   missing AC → /arc:ac update → /arc:test write
   equivalent / noise / defensive → record why, change nothing
   other feature's AC → report it, do not widen this ticket
```

## Steps

### Step 1: Locate AC, Code, and Tests

1. Read `.arcana/project-context.md` for AC file locations, test runner, framework, and active example references
2. Find AC files for `ticket-id`
3. Find production code and test files relevant to the feature

### Step 2: Identify Mutation Targets

Read AC to determine which files contain critical business logic. Only mutate business logic — NOT UI components, NOT config files, NOT formatting utilities.

```
✅ Mutate:  Business logic, access control, calculations, state machines, validators
❌ Skip:    UI components, utility formatting, config files, type definitions
```

### Step 3: Configure Mutation Tool

Check `.arcana/project-context.md` for the configured mutation testing tool and its scope. If example references exist → load the relevant example file for configuration patterns.

The project's config already carries the performance settings (run only the tests related to each mutation, mutate only what changed). Your job is the **scope of this run**, not the config.

### Step 4: Run Mutation Testing

**Pass the ticket's files explicitly — never run the tool bare.** An unscoped sweep mutates the whole codebase, takes hours, and gets killed before it reports anything; a run scoped to the 2-3 files identified in Step 2 takes minutes.

```
npx stryker run --mutate '<fileA>,<fileB>'    ✅ scoped to the ticket — comma-separated
npx stryker run --mutate 'a' --mutate 'b'     ❌ the second flag overrides the first
npm run mutate                                ❌ full sweep — will not finish
```

**Mutate the rule, not its adapter.** Follow the AC's rule to the file that actually implements it, even across workspace boundaries. In a monorepo the slice a feature lives in often only re-exports logic that lives in a shared package — mutating the re-export tests nothing.

Monitor for completion. **Do not abort on duration** — a correctly scoped run over a ticket's files has
measured anywhere from ~1 minute (one small package) to ~17 minutes (four files reaching into the web
suite), and a "this is taking too long" rule has already killed correct runs twice. Abort only when the
tool reports it is mutating far more files than you named, which means the scope did not apply.

Add `--reporters json,html` (or configure `jsonReporter`) if the run does not emit a machine-readable
list: Step 5 needs to read survivors, and `mutation.html` embeds its data un-greppably. Failing that,
`reports/stryker-incremental.json` carries the same mutant list.

### Step 5: Triage Survivors

**Most survivors are not defects.** Expect roughly one genuine finding in four. Classify every
survivor before recommending anything — a recommendation on an unkillable mutant sends the loop
chasing a test that cannot exist, until it exhausts its retries.

| Class | How to recognize it | Route to |
|---|---|---|
| **Missing test** | The rule is stated in the AC and the code runs under test, but nothing asserts the mutated value | `/arc:test write` — **this is the common case** |
| **Missing AC** | No scenario describes this behavior at all | `/arc:ac update` → then `/arc:test write` |
| **Equivalent** | The mutant cannot change observable behavior (e.g. a guard whose branch yields the same result anyway) | Nothing — record why, never "fix" it |
| **Noise** | Error-message text, a zod `path`, a log string — asserted at a level this run did not execute, or not worth pinning | Nothing — record why |
| **Other feature's AC** | The rule belongs to a different feature | Report it under that feature; **do not widen this ticket** and do not add the scenario to this feature's AC |
| **Defensive / unreachable** | A guard, fallback, or `??`/`?.` that nothing currently reaches, but that protects a real contract (a type, an exported helper's signature, a call site) | Leave it; record why. A guard is not dead just because a tool cannot reach it |
| **Dead code** | Genuinely nothing needs it — removing it changes no type, no signature, no call site | Propose deleting the code |

**If the only way to kill a mutant is a change the project's rules forbid, it is not a fix.** Deleting a
`??` fallback that keeps a return type non-nullable forces `!` at the call sites — banned by
`.claude/rules/coding.md`. Classify that mutant defensive and move on; never trade a rule for a score.

**A recorded verdict is a claim, not a fact.** When you resume from an existing `mutate-report.md`,
re-derive the verdict of every survivor you intend to act on. Reports are written confidently and are
wrong often enough that trusting one is the natural failure mode — check the AC and `git log -S` for
the line before you accept "genuine, in scope".

Only the first two classes are work. For each, name the AC scenario and the assertion that should
exist:

```
Surviving mutant: `isPhoneVisible: false` → `true`
File: apps/api/src/resident/router.ts:62
Class: missing test — AC states the phone is hidden from other residents;
       registration runs this line under test but no test asserts the stored value.
Route: /arc:test write — assert the persisted resident carries isPhoneVisible: false
```

**Never weaken production code to kill a mutant.** If a mutant seems unkillable without changing
behavior, it is equivalent — say so.

**Read the survivor list, not the score.** The score counts timeouts as kills, and timeout
classification shifts with machine load — the same code scored 83.78% and 88.51% on two runs.
The list is stable; the percentage is not. Do not report the score as a quality measure or gate on it.

### Step 6: Write Report

Write mutation report to `.arcana/{feature}/{ticket-id}/mutate-report.md`. **Overwrite it on a
re-run** — including a verification re-run after the survivor loop, so the file always reflects the
latest run rather than the state that triggered the fixes. Every survivor carries its Step 5 class as
an explicit `Class:` field; a report without verdicts forces the next reader to invent a taxonomy.

Report format:

```markdown
# Mutation Testing Report — {ticket-id}

**Mutation Score:** {score}%
**Date:** {date}
**Files mutated:** {list}

## Surviving Mutants

### Mutant 1
- File: {path}:{line}
- Mutation: `{original}` → `{mutated}`
- Gap: {what AC scenario is missing}
- Recommendation: {which AC file to update and what to add}

### ...

## Summary

{total} mutants, {killed} killed, {survived} survived.
{Recommendations for AC updates.}
```

**Confirmation gate:** If `-y` → write report. Otherwise → show report and ask: "Write mutation report to `.arcana/{feature}/{ticket-id}/mutate-report.md`?" Wait for confirmation.

### Step 7: Output

> **Mutation Testing — {ticket-id}:** {score}% mutation score
> {killed} killed, {survived} survived out of {total} mutants
> Report: `.arcana/{feature}/{ticket-id}/mutate-report.md`

**On surviving mutants:** orchestrator routes to `/arc:ac update` to add missing scenarios → `/arc:test write` to generate tests → `/arc:test mutate` again to verify.

## When to Use

```
✅ During test writing — locally, as AC quality validation
✅ Before major release — audit critical modules
✅ On schedule — once a week, not on every push
❌ On entire codebase — too slow and noisy
```
