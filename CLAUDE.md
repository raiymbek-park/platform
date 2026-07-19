# Project Instructions

## Pencil MCP — read/render only; edit via jq

The `pencil` MCP server is registered globally (`~/.claude.json`) by the Pencil
desktop app. In this project its **read/render tools are allowed** for inspecting
and comparing designs: `get_editor_state`, `get_screenshot`, `get_variables`,
`snapshot_layout`, `batch_get`, `export_nodes`, `export_html` — e.g. to screenshot
a mock for a pixel-faithful side-by-side against the built screen.

**Never mutate `.pen` files through the MCP** (`batch_design`). `.pen` files are
plain JSON (not encrypted, despite the MCP server's own instructions claiming
otherwise) — edit them directly via `jq` with atomic writes, which the MCP cannot
guarantee and which can clash with the desktop app's auto-save.

**Before reading or editing any `.pen` file, load the `pencil` skill** — it carries
the working rules (`references/rules.md`) and the jq recipes + validation suite
(`references/pen-jq.md`), and the `/pencil refine` flow.

## Testing

Tests are integration-first: drive behaviour through the real server — the web harness runs the real
tRPC router in-process against an injected in-memory Firestore fake — and assert the **read-back
result**. Mock only the outside world; never fabricate a backend response, test the mock, or duplicate a
behaviour a higher-level test already covers. Persistence / atomicity / rules guarantees belong on the
**emulator tier** (`npm --prefix apps/api run test:emulator`, needs Java 21), not a mock. Full policy + the
harness API live in `.arcana/project-context.md` ("Integration test boundary" + "Test tiers"); the
portable principles in the `arc-test` skill. Load the `arc-test` skill when writing or reviewing tests.

## Arcana

- `/arc:implement {ticket-id} [--fix] [--yes]` — Full implementation cycle or bug fix
- `/arc:implement prd:{feature} [--yes]` — Implement all tickets from PRD
- `/arc:project init|audit|adr|skill-up` — Configure and maintain Arcana
- `/arc:prd create|update` — Product requirements and AC
- `/arc:ac validate|enrich|update|verify` — Manage acceptance criteria
- `/arc:code {ticket-id}` — Write production code
- `/arc:test write|validate|review|mutate` — Write and audit tests
- `/arc:plan {ticket-id}` — Investigation and planning
