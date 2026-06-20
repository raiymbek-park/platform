# /app fallow-report

Turn a fallow SARIF report into a grouped, readable Markdown report.

This repo is private on a personal GitHub account, so GitHub Code Scanning (`upload-sarif`) is unavailable — there is no Security tab to view SARIF in. This subcommand is the workaround: get the SARIF (locally, from a CI artifact, or a file) and render it to Markdown that opens cleanly in any editor.

All generated files go under `.fallow/` — already gitignored (fallow's own cache dir), so nothing clutters `git status`.

`command` (`fallow-report`) was already parsed by the dispatcher — start at Step 1.

| Argument | Format | Default | Effect |
|----------|--------|---------|--------|
| `source` | `local` \| `ci` \| `path.sarif` | `local` | Where the SARIF comes from |
| `pr` | number (only with `ci`) | current branch | Which PR's artifact to pull |
| `-o`, `--out` | path | `.fallow/report.md` | Markdown output path |
| `-y`, `--yes` | flag | `false` | Skip confirmation gates |

## Instructions

### Step 1: Parse arguments

From the tokens after `fallow-report`, determine:
- `source` — first non-flag token. If it ends in `.sarif` or contains a path separator, treat it as a **file path**. If it is `ci`, use **ci mode**. Otherwise (including empty) use **local mode**.
- `pr` — a bare number following `ci` (e.g. `ci 20`).
- `out` — value after `-o`/`--out`, else `.fallow/report.md`.
- `skip_confirmations` — `true` if `-y`/`--yes` present.

Run all commands from the repo root (`C:\_projects\web`). Keep every generated file under `.fallow/` (gitignored). Create it first so redirects don't fail on a fresh clone:
```bash
mkdir -p .fallow
```

### Step 2: Acquire the SARIF

**local mode** — generate fresh:
```bash
npx fallow --format sarif > .fallow/results.sarif
```
`npx fallow` exits non-zero when findings exist, but it still writes the SARIF — do not abort on a non-zero exit; check the file is non-empty instead. The SARIF path is `.fallow/results.sarif`.

**ci mode** — download the `fallow-sarif` artifact via `gh`:
1. Resolve the branch:
   - With a PR number: `gh pr view <pr> --json headRefName -q .headRefName`
   - Otherwise: `git branch --show-current`
2. Find the latest **completed, successful** run id for that branch (the most recent run may still be in progress — skip non-`completed` ones):
   ```bash
   gh run list --branch <branch> --workflow fallow.yml -L 5 \
     --json databaseId,status,conclusion \
     -q 'map(select(.status=="completed" and .conclusion=="success"))[0].databaseId'
   ```
3. Download the artifact into `.fallow/`, then locate the `.sarif` inside it:
   ```bash
   gh run download <run-id> --name fallow-sarif --dir .fallow/artifact
   ```
   The SARIF is `.fallow/artifact/fallow-results.sarif`. If the artifact is missing, the workflow has not been updated to upload it — see Troubleshooting.

**file mode** — use the provided path directly; do not regenerate.

### Step 3: Convert to Markdown

Run the bundled converter (Node built-ins only, no install):
```bash
node .claude/skills/app/scripts/sarif-to-md.mjs <sarif-path> --out <out>
```
The script prints `Wrote <out> (<n> findings)`. It exits non-zero with a clear message on empty or invalid SARIF.

### Step 4: Output

Read the generated `<out>` and summarize for the developer:

> **`<out>`** — `<n>` findings (`<e>` error · `<w>` warning · `<note>` note)
> Top rules: `<ruleId>` (`<count>`), `<ruleId>` (`<count>`)
>
> Open in your editor, or drag the raw `.sarif` into a SARIF viewer.

Note: `ci` mode is scoped to the PR diff, so a clean PR yields 0 findings. Use `local` mode for a whole-repo scan.

**Confirmation gate:** If `skip_confirmations` → proceed. Otherwise, before overwriting an existing `<out>` that the developer did not name explicitly, ask "Overwrite `<out>`?" and wait.

## Examples

### Example 1: Quick local report
User says: `/app fallow-report`
Actions:
1. `mkdir -p .fallow`
2. `npx fallow --format sarif > .fallow/results.sarif`
3. `node .claude/skills/app/scripts/sarif-to-md.mjs .fallow/results.sarif --out .fallow/report.md`
4. Summarize counts.
Result: `.fallow/report.md` with findings grouped by rule and severity.

### Example 2: Read a PR's CI findings
User says: `/app fallow-report ci 20`
Actions:
1. `gh pr view 20 --json headRefName -q .headRefName` → branch
2. Pick the latest completed+successful run id (see Step 2)
3. `gh run download <id> --name fallow-sarif --dir .fallow/artifact`
4. Convert `.fallow/artifact/fallow-results.sarif` → `.fallow/report.md`.
Result: Markdown report from exactly what CI analyzed on PR #20 (PR-scoped).

### Example 3: Convert an existing file
User says: `/app fallow-report ./reports/scan.sarif -o .fallow/scan.md`
Actions:
1. Convert `./reports/scan.sarif` → `.fallow/scan.md` directly (no fetch).
Result: `.fallow/scan.md`.

## Troubleshooting

### Artifact `fallow-sarif` not found (ci mode)
Cause: the CI workflow does not upload the SARIF as an artifact (it may still use the unavailable `upload-sarif` code-scanning step).
Solution: in `.github/workflows/fallow.yml`, ensure a step uploads the SARIF, e.g. `actions/upload-artifact@v4` with `name: fallow-sarif` and `path: fallow-results.sarif`. Then re-run CI before retrying.

### `npx fallow` exits non-zero but report is fine
Cause: fallow returns a non-zero code when findings exist; the SARIF is still written.
Solution: ignore the exit code in local mode — verify `.fallow/results.sarif` is non-empty and proceed.

### Empty or invalid SARIF
Cause: a failed analysis or an interrupted download produced an empty/corrupt file.
Solution: the converter exits with `Empty SARIF file` / `Invalid SARIF JSON`. Re-acquire the SARIF (re-run fallow or re-download the artifact).

### `gh` not authenticated (ci mode)
Cause: `gh auth status` shows logged out.
Solution: run `gh auth login`, then retry.
