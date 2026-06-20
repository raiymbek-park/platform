# Pencil (.pen) Conventions

Applies to all `.pen` work in this project. The design lives in `design/` at the repo root.

## File Architecture

`.pen` files are split across multiple files, linked via Pencil's library import:

- **`design/design-system.lib.pen`** — the library. Holds `variables` + a single wrapper frame named `"Design System"` containing sub-group section frames (Typography, Buttons, Cards & Items, etc.). The `.lib.pen` suffix is **required** — Pencil's cross-file ref resolver only follows imports into files with that suffix.
- **`design/*-screen.pen`** (e.g., `home-screen.pen`) — consumer files. Each holds one top-level wrapper frame containing screens, and declares `"imports": { "ds": "design-system.lib.pen" }` at the file root.

Top-level JSON key order (Pencil writes them this way): `version`, `children`, `imports`. Consumer files may also carry their own top-level `variables` block.

To pick the right file for an edit:
- Editing/inspecting a reusable component, variable, or DS sub-group → `design-system.lib.pen`
- Adding/editing a screen in an existing flow → that flow's `*-screen.pen`
- A new flow entirely → create a new `design/*-screen.pen` mirroring the structure (single wrapper frame + `imports` block)

## Source of Truth & Reuse-First

**The library file** holds every reusable component, variable, and pattern. Treat it as the component library.

- Always list components from the library first before building anything new.
- If an element has a visual/semantic equivalent in the library, reference it via `ref` — do not rebuild it.
- Only create new primitives when no library component covers the need, and prefer **extending the library** over one-off inline nodes.

### Prefer shells over atom composition

When a screen region matches an existing DS shell/container (e.g., a `ButtonPanel` = back button + primary action; a `PageHeader` = bar + title group), use a `ref` to the shell — don't rebuild the layout by composing atoms. Shell components bake in the correct gaps, widths, and descendant IDs. Rebuilding from atoms forks the layout — future edits to the shell won't reach your screen.

### Reusables use refs, not inlines

A reusable component must **not** inline another reusable in its children tree — always reference it via `{ "type": "ref", "ref": "<id>" }`. A reusable's full definition lives in exactly one place; every consumer reaches it through `ref`. If a reusable-like structure is nested inside another reusable, extract it to its own library entry first, then ref it.

```jsonc
// ❌ reusable inlined inside another reusable
{ "id": "OnboardingHeader", "reusable": true, "children": [
  { "id": "StepIndicator", "reusable": true, "children": [ /* dots */ ] }
]}

// ✅ StepIndicator lives once; OnboardingHeader refs it
{ "id": "OnboardingHeader", "reusable": true, "children": [
  { "type": "ref", "ref": "StepIndicator" }
]}
```

## Cross-File References

When composing screens in consumer files, reference library content with the import alias prefix (`ds:`). Inside the library file itself, internal refs and variables stay bare.

| Target | Inside the library (same file) | From a consumer (cross-file) |
|--------|--------------------------------|------------------------------|
| Component ref | `"ref": "92JZc"` | `"ref": "ds:92JZc"` |
| Variable value | `"fill": "$primary-black"` | `"fill": "$ds:primary-black"` |
| Descendant key | `"descendants": { "title": {...} }` | `"descendants": { "ds:title": {...} }` |

Separator is `:` (colon). Alias `ds` matches the key in the `imports` object.

### Single-segment descendant keys only (cross-file)

Inside one file, multi-segment descendant paths (`"shStp/rdcTs"`) follow internal refs. **Across files, Pencil silently strips them on save** — only single-segment descendant keys survive. To reach past this limit, use **slot replacement**: override the intermediate ref node wholesale.

A slot-replacement override value **must** carry:

| Requirement | Why |
|-------------|-----|
| `"type"` field | Missing → Pencil hard-errors `Node '<id>' has no type` and refuses to open the file |
| `"id"` field | Missing → Pencil auto-generates one that can fail downstream validation |
| `"children"` array **or** nested `"descendants"` | Use `children` for a fresh frame; use nested `descendants` to customize a replacement `ref`'s inner state (the primary cross-file workaround) |

```jsonc
// ✅ slot-replace a ref + nested descendants — cross-file-safe inner customization
"ds:vtBar": {
  "type": "ref",
  "ref": "ds:oGmxq",
  "id": "pd33Br",
  "descendants": { "ds:oNCL1": { "width": 214, "fill": "$ds:primary" } }
}

// ❌ missing type → "Node '<id>' has no type"   |   ❌ missing id → auto-generated id can fail
"ds:slotId": { "id": "x", "children": [...] }    //   "ds:slotId": { "type": "frame", "children": [...] }
```

### Flex children must not carry `x`/`y`

Refs or frames inside a parent with `layout: "vertical"` or default horizontal must **not** include `x`/`y` — Pencil flags them as "invalid data" and may skip the whole node. Keep `x`/`y` only on top-level canvas wrappers and on children of `layout: "none"` frames.

## Variables

Colors and sizes must reference the `.pen` file's `variables` block.

- **Never hardcode** colors (`#101011`, `#FFFFFF`) — always `$primary-black`, `$white`, etc. (or `$ds:`-prefixed in consumers).
- **Never hardcode** paddings/gaps/font sizes/radii when a variable exists (`$spacing-base`, `$font-size-md`, `$radius-sm`).

### Exception: `icon_font` dimensions must be raw numbers

`icon_font` nodes do **not** accept variable strings for `width`/`height`. Pencil silently rewrites `"width": "$ds:icon-lg"` to `"width": 0`, so the icon renders 0×0 (invisible). This is the only width/height context requiring raw numbers — `fill` and other props on the same node still take variables.

```jsonc
// ✅
{ "type": "icon_font", "iconFontName": "x", "width": 20, "height": 20, "fill": "$ds:text" }
// ❌ Pencil rewrites width/height to 0
{ "type": "icon_font", "iconFontName": "x", "width": "$ds:icon-lg", "height": "$ds:icon-lg" }
```

Frame/text/ref nodes are unaffected — they accept variable widths/heights.

## Naming

Every `name` field must be a **semantic noun** — describe what the element IS, not how it looks.

| Layer | Convention | Examples |
|-------|------------|----------|
| Slice / Section | Title case, spaces allowed | `Design System`, `Home Screen` |
| Screen frame | PascalCase (like React components) | `UserWelcome`, `SelectLanguage` |
| Group wrapper (folder) | kebab-case | `select-languages`, `tag-filters`, `author-info` |
| Reusable component | PascalCase | `PostCard`, `PageHeader`, `BottomNav` |
| Element / child | kebab-case noun | `avatar`, `title`, `read-more`, `date-row` |

**Forbidden names:** `button-1`, `red-text`, `frame-2`, `wrapper`, `container`, `item`. Always name by purpose (`submit-button`, `error-message`, `post-footer`, `tag-list`).

## Component Grouping

Reusable components are organized into **component groups** — non-reusable section frames whose name matches the corresponding React component. Variants live inside the group.

- Group frame: non-reusable, PascalCase, named after the React component (`Metric`, `Input`, `ButtonRadio`).
- Variants inside: reusable, PascalCase, `<Component><VariantSuffix>` (`MetricValue`, `MetricSummary`).
- No variant shares the bare group name — every variant has a suffix.
- Single-variant components stay flat in the DS slice — grouping only applies with 2+ variants.
- **Group frame must set `width: "fill_container"`** if any reusable variant declares it. Without it, variants collapse to zero width in the preview and text wraps one character per line. Same rule for any intermediate non-reusable wrapper.

```
Design System (slice)
└── Metric (group frame, non-reusable)
    ├── MetricValue   (reusable — value + icon)
    └── MetricSummary (reusable — icon + value)
```

Maps 1:1 to one React component. How the variant is expressed in props (enum, boolean flag, state-derived) is a React-side concern, not prescribed by the DS.

**Variant suffix conventions:**
- Visual/structural: `Value`, `Summary`, `Compact`, `Expanded`
- State: `Default`, `Filled`, `Focused`, `Error`, `Checked`, `Disabled`
- Semantic role: `Primary`, `Danger`, `Neutral`, `Floating`

**Refactoring flat variant families** (e.g., `Input` + `InputFilled` + `InputError`): create a group frame named after the root (`Input`), move all siblings inside, rename any root-named component with an explicit suffix (`Input` → `InputDefault`), and update every `ref` pointing to renamed components.

## Spacing: Parent Owns the Gap

Reusable row/list components (`ListItem*`, card rows, list-of-X patterns) must **not** carry outer vertical padding. The parent list container provides spacing between items via its own `gap`.

```jsonc
// ❌ padding baked into the item
{ "name": "ListItemMetric", "padding": [12, 0], "gap": "$spacing-md" }

// ✅ parent owns spacing
{ "name": "user-list", "layout": "vertical", "gap": "$spacing-md", "padding": "$spacing-base",
  "children": [ { "type": "ref", "ref": "ListItemMetric" }, { "type": "ref", "ref": "ListItemMetric" } ]
}
```

## Refining Existing Components (preserve the override surface)

Refinement modifies the **shape** of a reusable (typography, spacing, layout, colors, structure) but preserves its **content surface** so existing instances keep their overrides. Two invariants:

1. **Descendant IDs are preserved.** Any node ID a consumer targets via `"descendants": { "ds:<id>": ... }` must keep existing in the same role. Overrides resolve by ID — rename/remove an overridden ID and the consumer's override silently disappears.
2. **Default content values stay.** Default text `value`, `iconFontName`, and image refs flow through to every un-overridden instance — changing a library default silently rewords copy or swaps icons across the whole app.

| Change | Class | Reason |
|--------|-------|--------|
| Adjust spacing / padding / gap / radius | Safe | Shape props only |
| Swap color tokens | Safe | Tokens are shape, not content |
| Reorder children / add a new child (fresh id) | Safe | Existing IDs untouched |
| Restructure layout | Safe **if** every overridden id still resolves | Container shape changes; descendant IDs stay |
| Rename an overridden descendant `id` | **Breaking** | Consumer override no longer resolves |
| Remove an overridden descendant | **Breaking** | Override target gone |
| Change default text `value` / `iconFontName` | **Breaking** | Un-overridden instances inherit the new value |

A genuinely breaking change requires listing affected consumer files, confirming with the user, and migrating library + consumers in the same pass. See [refine.md](../refine.md) for the full flow.

## Tool Policy

- **Allowed:** Read, Write, Edit, Glob, Grep, Bash (`jq`, `sed`, `awk`).
- **Forbidden:** `mcp__pencil__*` (not needed when editing JSON directly — and denied at the project level); Python/Node or any other runtime for routine read/search/write.
- Use `jq` for JSON queries and mutations, `Grep` for text search, `Glob` for path search.
- See [pen-jq.md](pen-jq.md) for recipes and the post-write validation suite.

### Library registration (one-time, Pencil UI)

The first time a consumer file imports the library, Pencil may need it registered via Layers panel → Libraries → Add Library. After that, the manual `imports` entry suffices and `jq` edits to the library propagate on consumer reopen. If a freshly authored consumer shows empty/unresolved components after reopen, have the user do the one-time UI registration.
