# Arcana Audit

Check that everything is in place. Skills installed? Project context current? Nothing broken?

## Steps

### Step 1: Read Project Context

1. Read `.arcana/project-context.md`
2. If not found → error: "No project context. Run `/arc:project init` first." and stop

### Step 2: Verify Skills

Check each skill in the "Required Skills" checklist:
- Is it still installed?
- Is it accessible and functional?
- Has it been updated since last audit?

### Step 3: Verify Project Context Freshness

Compare project-context against current codebase:
- Has the stack changed? (new framework, version bump)
- Has the project structure changed? (new directories, renamed modules)
- Has the test configuration changed? (new test runner, new E2E setup)
- Have CI pipelines changed?

Flag anything that looks outdated.

### Step 4: Verify File Structure

Check that expected directories and files exist:
- `.arcana/project-context.md` — exists and readable
- `.arcana/.gitignore` — exists
- PRD/AC directory — exists (if features have been created)
- Decisions directory — exists (if ADRs have been created)

### Step 5: Verify PRD Quality

For every feature directory containing a `prd.md`, run `/arc:prd validate {feature-name}` (silent — write to `.arcana/{feature-name}/prd-validate-report.md`).

Aggregate the results into the audit report. A failing PRD is a quality issue equivalent to a missing skill: it will produce bad AC and waste implementation cycles. Surface failed PRDs prominently with a one-line summary of which criteria failed.

If any PRD fails → recommend `/arc:prd update {feature-name}` for each.

### Step 6: Output Report

```
Arcana Audit Report
───────────────────

Skills:
  ✅ git: github — installed, functional
  ✅ tracker: jira — installed, functional
  ❌ code-review: copilot — not installed
  ⚠️ code-analyze: sonarqube — installed but config outdated

Project Context:
  ✅ Stack — current
  ⚠️ Test runner — Vitest config changed, rescan recommended
  ✅ API type — current
  ✅ Project structure — current

File Structure:
  ✅ .arcana/project-context.md
  ✅ .arcana/.gitignore
  ✅ {features-directory}/
  ❌ {decisions-directory}/ — missing

PRD Quality:
  ✅ checkout — PASS (5/5 criteria)
  ⚠️ sign-in — FAIL (Criterion 3: phone min length undefined; Criterion 4: 1 open question referenced from AC)
  ✅ feed — PASS (5/5 criteria)

Recommendations:
  - Install copilot review skill: spm install copilot-review
  - Run /arc:project init --refresh to update test runner config
  - Create decisions directory for ADRs
  - Run /arc:prd update sign-in to resolve the failing criteria
```

## When to Run

```
After /arc:project init      → verify installation
After installing new tools   → verify integration
After major codebase changes → verify context is current
Periodically                 → catch drift
```
