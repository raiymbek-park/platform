# Code Validate

Validate code against the project's coding rules. Project-agnostic — rules are discovered at runtime from `.arcana/project-context.md` or `.claude/rules/`.

## Steps

### Step 1: Parse Arguments

1. Tokens that look like file or directory paths → `scope_paths`
2. `-y` / `--yes` → `skip_confirmations = true`
3. `--report-only` → `report_only = true` (overrides `-y` for safety)

### Step 2: Discover Rules

1. Read `.arcana/project-context.md` if present. Look for a "Conventions" or "Project Rules" section that enumerates rule files (paths or links). If present → load those files.
   - **Skip the "Tool-enforced" subsection** (if present). Entries there — `biome.json`, `.editorconfig`, `tsconfig.json`, etc. — are machine config, not human-readable natural-language rule files; parsing them as prose produces bogus findings. They are enforced at build time by their respective tools.
2. Otherwise → glob `.claude/rules/*.md` from the repo root.
3. If still empty → error: "No project rules found. Expected `.arcana/project-context.md` to enumerate them or `.claude/rules/*.md` to exist." and stop.

For each rule file, extract testable rules:
- Statements with "must", "must not", "always", "never", "prefer", "avoid"
- Marked anti-patterns (❌, "Forbidden", "Avoid" code blocks)
- Numbered or bulleted prescriptive items

Each rule gets a stable id of the form `<file-stem>:<heading-slug>` for report cross-reference.

**Don't rely on keyword triggers alone.** Some real rules are phrased without "must/never" and need semantic judgment to check — e.g. "No comments unless they explain a workaround or non-obvious logic", "Avoid over-engineering / premature abstraction", "Use descriptive naming instead of comments". These are exactly the rules biome/tsc can't enforce and that slip through unnoticed. Load them too, and audit them in the mandatory judgment pass (Step 4a) — never skip a rule just because it isn't keyword-matchable.

### Step 3: Determine Scope

1. If `scope_paths` non-empty → expand each entry:
   - **File** → keep as-is.
   - **Directory** → expand recursively via Glob (e.g. `<dir>/**/*`) to a flat file list. The audit step reads files, not directories — unexpanded directories cause read errors or silently skip contents.
2. Otherwise → scope = the diff between the current branch and the integration branch:
   - Detect integration branch: try `gh repo view --json defaultBranchRef -q .defaultBranchRef.name` (the `defaultBranch` field does not exist on the Repository type), fall back to `git symbolic-ref --short refs/remotes/origin/HEAD`, fall back to `main`.
   - `git diff --name-only {default}...HEAD` for the file list.
   - **Constrain to project root**: filter the result to paths under the current working directory (the project root the skill runs in). In a monorepo, the diff includes sibling workspaces — auditing them with this project's rules produces wrong findings. Use repo-relative paths like `apps/web/...` (computed from `git rev-parse --show-prefix`) as a prefix filter.
3. Filter to text files the rules apply to (skip binaries, lockfiles, generated files matching `*.gen.*`, `*.d.ts`, `*.d.scss.ts`).
4. If empty → exit: "Nothing to validate."

### Step 4: Audit

For each file in scope:
- Read the file.
- For each rule, scan for violations. Record `<file>:<line> — <rule-id> — <description>` with the offending snippet (`old`) and the rule's preferred form (`new`).

Classify each finding:
- **mechanical** — the rule maps to a single-pass transform (e.g., strip `async () => { sync }` wrapper, swap `../../` for `@/`, add `type="button"` to a bare `<button>`).
- **review** — requires judgment (architectural intent, naming choice, scope of abstraction, etc.).

### Step 4a: Judgment-rule checklist (mandatory)

The keyword scan in Step 4 reliably catches mechanical/syntactic rules but routinely misses judgment rules. For **every** validate run, walk this checklist explicitly and state a verdict (pass / finding) on each — even when the scan surfaced nothing. Silence is not a pass; a checklist item with no stated verdict is a skipped audit.

Default checklist (extend from the project's loaded rules):
- **Comments** — is every comment justified by the project rule (workaround / non-obvious logic only)? Flag comments that restate the code, narrate steps, or duplicate a test name. In test files, AC/scenario references belong in the test *name*, not a `// scenario N` comment.
- **Descriptive naming** — are names doing the work a comment would? Flag comment-as-crutch.
- **Over-engineering / premature abstraction** — unnecessary indirection, options nobody uses, abstractions with a single caller.
- **Any project rule that biome/tsc cannot enforce** — if a loaded rule is not machine-checkable, it MUST appear here with a verdict.
- **Merge-set / update mutations with a preserve-existing-value guard** — when an update endpoint conditionally keeps the currently-stored value for a field instead of writing the input (commonly to protect an elevated/exceptional state — a role, permission tier, plan — from being clobbered by an ordinary edit), verify the guard is scoped to the exact protected values, not a catch-all negation of the input's known enum. A catch-all ("stored value isn't one of these N normal values → preserve it") also silently preserves defaults, legacy data, and invalid values, which blocks the common case from ever writing a real change. State explicitly which values are preserved and why (found in PR #61: `resident.update` initially preserved any non-`owner`/`tenant` stored role, which also trapped the default `resident` role and legacy/invalid values — narrowed to preserve only `manager`/`administration`).

These are usually `review`-class findings (judgment, not a single-pass transform), so report them; don't auto-apply.

### Step 5: Report

Print findings grouped by file:

```
<file>:<line>
  ⛔ <rule-id> — <description>
  old: <snippet>
  new: <preferred form>
  fix: mechanical | review
```

Summary line:
`N findings (M mechanical, K review-only) across F files.`

### Step 6: Fix Gate

- `report_only` → stop here.
- 0 mechanical fixes → stop here.
- `skip_confirmations` → apply all mechanical fixes.
- Otherwise → list the mechanical fixes and ask: `Apply N mechanical fixes? [Y/n]`. Wait. No → stop.

### Step 7: Apply Fixes

For each mechanical fix:
- Apply via `Edit` (exact `old` → `new` substitution; refuse if `old` is non-unique in the file — surface as a review-only finding instead).
- After all fixes, re-run the audit on the same scope.
- If new violations appear, or original violations weren't resolved → print the diff, stop, do not commit.

The skill does NOT commit. Committing is the developer's call (use the `/git` skill).

### Step 8: Output

> **Validate — {scope-summary}:**
> Rules loaded: {N}
> Findings: {total} ({mechanical} mechanical, {review} review-only)
> Fixes applied: {applied} | Remaining: {remaining}
>
> Next: address review-only findings manually, then re-run `/arc:code validate` or commit via `/git commit`.

## Examples

### Branch diff, pair mode

User says: `/arc:code validate`
Actions:
1. Discover rules from `.arcana/project-context.md` or `.claude/rules/*.md`.
2. Diff current branch against detected default branch.
3. Audit changed files, classify findings, print report.
4. Ask before applying mechanical fixes.
Result: report on screen, mechanical fixes applied after confirmation, working tree dirty for developer to review and commit.

### Branch diff, autopilot

User says: `/arc:code validate -y`
Actions: same as above but mechanical fixes apply without asking.

### Single file

User says: `/arc:code validate src/foo.tsx`
Actions: skip diff; scope is just the one file.

### Report-only

User says: `/arc:code validate --report-only`
Actions: print findings and stop. Never modify anything.

## Troubleshooting

### Error: No project rules found
Cause: Neither `.arcana/project-context.md` enumerates rules nor `.claude/rules/*.md` exists.
Solution: Add rule files or document them in `project-context.md`. Run `/arc:project init` if the project hasn't been onboarded.

### Default branch detection fails
Cause: No remote configured, or `gh` not authenticated.
Solution: Pass paths explicitly (`/arc:code validate src/...`) or set the default ref via `git remote set-head origin --auto`.

### Mechanical fix introduces a new violation
Cause: Two rules collide — the fix for rule A produces output that rule B rejects.
Solution: Skill stops without committing and prints the trace. Resolve manually, or refine the rules to disambiguate priority.

### Non-mechanical findings dominate
Cause: The rule set is mostly judgment-based (architecture, naming intent). `validate` can only auto-fix syntactic / mechanical patterns.
Solution: Expect a higher review-only rate. Use the report as a checklist; address findings in normal code edits.
