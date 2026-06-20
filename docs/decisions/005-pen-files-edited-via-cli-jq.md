# 005. Author designs in Pencil, edit `.pen` files from the CLI with jq

**Date:** 2026-06-20
**Status:** accepted

## Context

Our design mockups live in `.pen` files created with the Pencil desktop app.
Pencil also registers a global MCP server (`mcp__pencil__*`) for its own VS Code
integration. Two things drive this decision:

- A `.pen` file is **plain JSON** — not encrypted, even though the MCP server's
  own instructions claim otherwise.
- Much of our day-to-day design work isn't drawing new screens; it's
  **reshaping existing ones** — finding every node of a certain kind, pulling
  repeated elements out into a single reusable component, repointing tokens
  across screens, renaming. That's a search-and-transform job over a tree.

So we need a way to make AI-driven edits from the Claude Code CLI that is exact,
fast, and cheap on tokens.

## Options Considered

### Option 1: Draw in Pencil, edit and refactor with jq from the CLI (chosen)

- **Pros:** Drawing — laying out screens, building mockups — stays in the Pencil
  app, which is what it's good at. And because a `.pen` file is just JSON, every
  structural edit collapses into a deterministic jq query. An agent driving jq
  pinpoints and rewrites nodes far more precisely, and far more cheaply, than the
  same work routed through the MCP. Edits are scriptable, show up in diffs, and
  land as atomic writes. The split is clean: the app authors, the CLI transforms.
- **Cons:** jq edits skip Pencil's own validation, so a bad write can slip
  through; you also have to know the `.pen` schema and run a validation pass.

### Option 2: Route everything through the Pencil MCP server from the CLI

- **Pros:** Goes through Pencil's own API and is, in principle, schema-aware.
- **Cons:** The protocol overhead makes every read and write slower and heavier
  on tokens than plain jq, and it's a blunt instrument for the bulk operations —
  find-all, hoist, repoint — that jq expresses exactly. The MCP exists for
  Pencil's VS Code integration, not for the CLI.

### Option 3: Hand-edit the `.pen` JSON with no tooling

- **Pros:** Nothing to set up.
- **Cons:** Error-prone, no repeatable queries, no validation — strictly worse
  than jq backed by the skill's recipes and validation suite.

## Decision

**Draw in the Pencil app; do every programmatic read, edit, and refactor on
`.pen` files with jq and atomic writes from the CLI; never call
`mcp__pencil__*` from the Claude Code CLI in this project.** The Pencil MCP is
left to the desktop app's own integration.

Take the common case — lifting duplicated elements into one shared component.
jq's exact, tree-aware search over the JSON, driven by an agent in the CLI, is
both more accurate and noticeably faster and cheaper than the equivalent MCP
round-trip. The working rules, jq recipes, and validation suite live in the
`pencil` skill, which has to be loaded before anyone touches a `.pen` file.

## Consequences

### Positive
- Exact, scriptable, repeatable edits across the design tree.
- Cheaper and faster than MCP round-trips — no protocol overhead.
- Changes are atomic and show up cleanly in diffs.
- A clean split of duties: Pencil for authoring, CLI and jq for transforms.

### Negative
- jq writes bypass Pencil's validation, so the `pencil` skill's validation suite
  has to run to keep a `.pen` from going malformed.
- Editing means knowing the `.pen` schema (the skill carries it).

### Neutral
- This rests on `.pen` staying plain JSON. If Pencil ever encrypts the format,
  jq editing stops working and the MCP path comes back into play.
