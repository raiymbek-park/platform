---
name: pencil
description: Work with this project's Pencil .pen design files — the design-system library (design/design-system.lib.pen) and consumer screen files (design/*-screen.pen) linked via Pencil library imports. Use this skill whenever a task reads, authors, edits, or refines .pen files — adding or changing screens, reusable components, design tokens/variables, or cross-file refs. .pen files are plain JSON edited directly via jq; the Pencil app is not required and there is no Figma step.
user-invocable: true
argument-hint: "refine TARGET | (no arg → load the .pen working rules)"
allowed-tools: "Read Write Edit Glob Grep Bash mcp__pencil__get_editor_state mcp__pencil__get_screenshot mcp__pencil__get_variables mcp__pencil__snapshot_layout mcp__pencil__batch_get mcp__pencil__export_nodes mcp__pencil__export_html"
metadata:
  author: sultan99
  version: 4.1.0
  category: workflow
  tags: [pencil, design, design-system, pen]
---

# /pencil [SUBCOMMAND]

Workflow and conventions for this project's `.pen` design files. Load and apply this
skill whenever a task touches `.pen` files — whether editing the JSON directly via
`jq` or running a subcommand.

## Usage

```
/pencil refine <target>   Refine an existing component/element, preserving consumer overrides
/pencil                   Load the .pen working rules, then proceed with the requested task
```

## Files

- `design/design-system.lib.pen` — the library: `variables` + reusable components.
- `design/*-screen.pen` (e.g. `home-screen.pen`) — consumer files that compose
  screens from library components via `"imports": { "ds": "design-system.lib.pen" }`.

## Rules (read first)

Before any `.pen` read or edit, follow [references/rules.md](references/rules.md) —
file architecture, cross-file refs, naming, component grouping, variables, and the
gotchas (`icon_font` dimensions, flex `x`/`y`, single-segment descendants, slot
replacement). For jq queries, edits, ID generation, and the post-write validation
suite, see [references/pen-jq.md](references/pen-jq.md).

`.pen` files are plain JSON — **edit** them with `jq` (never MCP mutations /
`batch_design`); the Pencil MCP **read/render** tools (screenshot, export, inspect)
are allowed for design comparison. See the project's root `CLAUDE.md`.

## Subcommands

| Subcommand | Effect |
|------------|--------|
| `refine <target>` | Modify the shape of an existing component/element while preserving consumer overrides → [refine.md](refine.md) |

## Instructions

Parse the first argument after `/pencil`:

- `refine` → read [refine.md](refine.md) and follow all steps, passing `<target>`.
- **no argument (or any other phrasing)** → treat it as "load the working rules":
  read [references/rules.md](references/rules.md) and [references/pen-jq.md](references/pen-jq.md),
  then carry out the user's `.pen` task (authoring a new screen, editing a component,
  adjusting tokens, etc.) following those conventions and validating after every write.
