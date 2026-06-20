# Update Issue

Update an existing GitHub issue's title, body, or labels. Used when the shipped scope diverges from the ticket as originally written and the issue should reflect what actually landed (or what is currently planned).

## Steps

### Step 1: Resolve issue number

- If provided as the next positional argument → use it
- If not provided → resolve from current branch (`feature/<n>/...` → `<n>`). See [references/rules.md](./references/rules.md) > Resolving Issue Number
- If not found → prompt user and **wait for response**

### Step 2: Fetch current issue state

```bash
gh issue view <number> --json title,body,labels,state
```

Capture the existing title, body, labels, and open/closed state so the diff is explicit. Do not proceed if the issue is closed unless the developer explicitly confirms a closed-issue update.

### Step 3: Ask what to change

If the invocation didn't specify, ask the developer which fields to update:

> Issue #<n> — what should change? Options: title / body / labels (one or more).

Wait for the developer's response. If they provide content inline (e.g., paste a new body), capture it. If they ask you to draft an updated body, generate one from the branch state — `git log main..HEAD --oneline`, `git diff main..HEAD --stat`, and any reports under `.arcana/{feature}/{ticket-id}/` (e.g., `verify-report.md`, `task.md` "Shipped scope" section).

### Step 4: Generate updated content

**Rewrite in place — do NOT append "Shipped scope" / "Update — YYYY-MM-DD" / "Deviations" sections.** When the developer corrects scope mid-implementation, the issue body must read as if the corrected plan was always the plan. The body is the live source of truth for "what is shipping"; the git history and PR carry the audit trail for "what changed".

Concretely:

- Rewrite the affected sections (Description, primitive list, "What's NOT in this task", AC scenario references) in place
- Preserve sections that did not change verbatim (links, epic ref, AC paths, scenarios list when behaviour-stable)
- Do not introduce a `---` divider followed by an addendum
- Do not annotate diffs ("renamed from X", "was previously Y") — the issue should read clean to a first-time reader

If you previously appended an addendum and the developer now asks for cleanup, treat that addendum as scope to remove: the rewrite collapses it back into the main body, and the issue reverts to a single coherent description.

For label changes, list adds and removes explicitly (`add: bug`, `remove: feature`).

### Step 5: Confirm and update

**Confirmation gate:** Show the new title (if changed), a diff of the body (or full new body if it's small), and the label deltas. If `-y` → proceed. Otherwise → ask "Update issue #<n>?" and wait.

Run only the fields that changed:

```bash
gh issue edit <number> --title "<title>"
gh issue edit <number> --body-file <path-to-temp-file>
gh issue edit <number> --add-label "<label>"
gh issue edit <number> --remove-label "<label>"
```

For multi-line bodies, write the new body to a temp file and pass `--body-file` rather than `--body` — avoids shell quoting issues and CRLF mangling on Windows. Clean the temp file up afterwards.

### Step 6: Output

Show the issue URL returned by `gh issue view <number> --json url -q .url`, plus a one-line summary of what changed:

> Updated issue #<n>: <https://github.com/org/repo/issues/n>
> Changed: title | body | labels added: [x, y] | labels removed: [z]
