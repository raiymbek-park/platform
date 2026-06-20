---
name: app
description: App tooling commands. `fallow-report` fetches a fallow SARIF report and converts it into a readable Markdown report. Use when the developer says "/app fallow-report", "fallow report", "view fallow findings", "sarif to markdown", "download fallow sarif".
user-invocable: true
argument-hint: "fallow-report [local|ci|path.sarif] [pr#] [-o out.md] [-y]"
license: MIT
compatibility: "Node 18+, gh CLI, npx fallow."
metadata:
  version: 2.0.0
  category: devops
  tags: [fallow, sarif, code-quality]
---

# /app $ARGUMENTS

App tooling commands.

## Usage

```
/app
    fallow-report [local|ci|path] [pr#]       Fetch a fallow SARIF report and render it to Markdown

    -o, --out <file>                          (fallow-report) Markdown output path (default: .fallow/report.md)
    -y, --yes                                 Skip confirmation gates
```

| Argument | Format | Default | Effect |
|----------|--------|---------|--------|
| `command` | Positional (1st token) | — | Subcommand: `fallow-report` |
| (rest) | Positional / flags | — | Passed to the subcommand — see its file |
| `-y`, `--yes` | Flag | `false` | Skip confirmation gates |

## Instructions

### Step 1: Parse command and route

Extract the first non-flag token from `$ARGUMENTS` → `command`.

- `fallow-report` → read [fallow-report.md](./fallow-report.md) and follow all steps.
- missing or unrecognized → show:

  > Unknown command. Available: `/app fallow-report [local|ci|path] [pr#]`.

  Stop.

Pass the remaining tokens (and `-y`/`--yes`) through to the routed subcommand.
