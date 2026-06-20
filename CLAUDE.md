# Project Instructions

## Pencil MCP — do not use from the terminal

The `pencil` MCP server is registered globally (`~/.claude.json`) by the Pencil
desktop app for its own VS Code integration. **In this project, never call the
`mcp__pencil__*` tools.** They are reserved for the Pencil app — not for the
Claude Code CLI.

`.pen` files are plain JSON (not encrypted, despite the MCP server's own
instructions claiming otherwise) — edit them directly via `jq` with atomic writes.
**Before reading or editing any `.pen` file, load the `pencil` skill** — it carries
the working rules (`references/rules.md`) and the jq recipes + validation suite
(`references/pen-jq.md`), and the `/pencil refine` flow.

If a task seems to need a Pencil MCP tool, stop and surface it instead of
calling the tool.

## Arcana

- `/arc:implement {ticket-id} [--fix] [--yes]` — Full implementation cycle or bug fix
- `/arc:implement prd:{feature} [--yes]` — Implement all tickets from PRD
- `/arc:project init|audit|adr|skill-up` — Configure and maintain Arcana
- `/arc:prd create|update` — Product requirements and AC
- `/arc:ac validate|enrich|update|verify` — Manage acceptance criteria
- `/arc:code {ticket-id}` — Write production code
- `/arc:test write|validate|review|mutate` — Write and audit tests
- `/arc:plan {ticket-id}` — Investigation and planning
