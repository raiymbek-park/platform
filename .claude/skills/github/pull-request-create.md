# Create PR

Create a new pull request with description from GitHub issue.

## Steps

### Step 1: Resolve issue number

See [references/rules.md](./references/rules.md) > Resolving Issue Number.

### Step 2: Fetch GitHub issue

```bash
gh issue view <number>
```

Get issue title, description, and labels.

### Step 3: Run pre-PR gates

Before creating the PR, make sure the branch passes the local CI gates — CI runs the
same checks and will fail the PR otherwise:

```bash
npm --prefix apps/web run i18n:extract   # CI diffs .po catalogs against the code;
                                         # stale line refs after any refactor fail the
                                         # "i18n catalogs extracted" check
npm --prefix apps/web run i18n:compile   # strict compile — fails on untranslated strings
npm run lint && npm run typecheck && npm test
npm --prefix apps/web run lint:fsd
```

If `i18n:extract` changed catalog files, commit them before pushing.

### Step 4: Analyze current branch

!`git log main..HEAD --oneline`
!`git diff main..HEAD --stat`

### Step 5: Generate PR title

See [references/rules.md](./references/rules.md) > PR Title Format.

### Step 6: Generate PR description

If the project has a pull request template (e.g., `.github/pull_request_template.md`), use it as the structure. Otherwise, use this format:

```markdown
## Summary
<1-3 bullet points describing the changes>

Closes #<issue-number>

## Test plan
- [ ] <testing step>
```

Fill in each section based on the GitHub issue and branch analysis.

### Step 7: Confirm and create PR

**Confirmation gate:** Show the PR title, target branch, and commit count. If `-y` → proceed. Otherwise → ask "Push and create PR?" and wait.

```bash
__via_skill__=1 gh pr create --title "<title>" --body "<description>"
```

### Step 8: Output the PR URL

Show the PR URL returned by `gh pr create` to the developer.
