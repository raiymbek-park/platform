# /pencil refine [TARGET]

Refine an existing component (in `design/design-system.lib.pen`) or design element (in any consumer `.pen` file) **without breaking the references that point at it**.

Before starting, read [references/rules.md](references/rules.md) — file architecture, naming, variable, and tool policies apply throughout. For jq recipes and the validation suite, see [references/pen-jq.md](references/pen-jq.md).

## Critical rule: shape changes, content stays

Refinement modifies the **shape** of a component — typography, spacing, layout, colors, structure — but preserves its **content surface** so every existing instance keeps its overridden text, icons, and images.

Two preservation invariants:

1. **Descendant IDs are preserved.** Every node ID any consumer targets via `"descendants": { "ds:<id>": ... }` must continue to exist in the refined component, in a semantically equivalent role. Overrides resolve by ID — rename or remove an overridden ID and the consumer's override silently disappears.
2. **Default content values stay.** Default `value` on text nodes, `iconFontName` on icons, and image refs are NOT rewritten. These flow through to every un-overridden instance — changing the library default silently rewords copy or swaps icons across the whole app.

These apply when refining a **reusable** (`"reusable": true`). When refining a non-reusable element (a one-off frame inside a consumer screen, a section wrapper in the library), there is no override surface — edit freely; the only constraint is the standard validation suite.

A refinement that genuinely requires renaming or removing an overridden ID is a **breaking change** — list the affected consumer files, confirm with the user, and migrate library + consumers in the same operation.

### Quick reference: safe vs. breaking

| Change | Classification | Reason |
|---|---|---|
| Adjust spacing, padding, gap, radius | Safe | Shape props, no IDs or content touched |
| Swap color tokens (`$ds:primary` → `$ds:accent`) | Safe | Tokens are shape, not content |
| Reorder children | Safe | IDs preserved in place |
| Add a new child node (fresh `id`) | Safe | Existing IDs untouched |
| Restructure layout (wrap children in a new frame) | Safe — IF every overridden `id` still resolves | Container shape changes; descendant IDs stay |
| Rename a descendant `id` (`label-text` → `caption`) | **Breaking** | Consumer override `ds:label-text` no longer resolves |
| Remove an overridden descendant | **Breaking** | Override target gone |
| Change default text `value` (`"Submit"` → `"Send"`) | **Breaking** | Un-overridden instances inherit the new value |
| Change default `iconFontName` | **Breaking** | Un-overridden instances render the new icon |

## Arguments

| Position | Name | Format | Example |
|----------|------|--------|---------|
| 1 | `TARGET` | Component name (PascalCase) **or** path to a `.pen` file | `ButtonPrimary` or `design/<name>-screen.pen` |

If no target is given, ask the user what to refine before continuing.

## Instructions

### Step 1: Resolve the target

```bash
LIB="design/design-system.lib.pen"
[ -f "$LIB" ] || { echo "Library not found: $LIB"; exit 1; }
```

Decide the mode:

- **Component mode** — `TARGET` matches one or more `reusable: true` nodes in `$LIB`. Continue at Step 2.
- **Element mode** — `TARGET` is a path to a `.pen` file. Ask which screen or node to refine, then jump to Step 6 (no override surface to preserve unless that node is itself reusable).

Look up by name in the library:

```bash
jq --arg n "$TARGET" '[.. | objects | select(.name? == $n and .reusable == true) | {id, name}]' "$LIB"
```

- 0 matches → ask the user; the name may be wrong or the target lives in a consumer file.
- 1 match → set `LIB_ID` to its `id` and continue.
- 2+ matches → list `{id, name}` for each, ask which one.

### Step 2: Inspect the current component

```bash
jq --arg id "$LIB_ID" '.. | objects | select(.id? == $id)' "$LIB"                       # full subtree
jq --arg id "$LIB_ID" '.. | objects | select(.id? == $id) | [.. | objects | select(has("id")) | .id] | unique' "$LIB" > /tmp/component-ids.json
```

### Step 3: Collect the live override surface

Scan every consumer file beside the library for which descendant IDs are actually overridden:

```bash
DIR="$(dirname "$LIB")"
for f in "$DIR"/*.pen; do
  [ "$f" = "$LIB" ] && continue
  jq --arg lid "$LIB_ID" --arg file "$f" '
    [.. | objects | select(.ref? == "ds:\($lid)") |
      { file: $file, instanceId: .id, keys: ((.descendants? // {}) | keys | map(sub("^ds:"; ""))) }]
  ' "$f"
done | jq -s 'add // []' > /tmp/usages.json

jq '[.[] | .keys[]] | unique' /tmp/usages.json > /tmp/overridden-ids.json
```

`/tmp/usages.json` = per-file usages with overridden keys; `/tmp/overridden-ids.json` = the flat ID set you must preserve. If it's `[]`, the component has no live override surface — refinement is unconstrained on IDs (you still must not rewrite default content values; see Step 5).

### Step 4: Engage the user

Present a scannable report, then ask what should change:

> **Component:** `<name>` (`<id>`)
>
> **Current structure** (top-level descendants): `<id>` (`<type>`) — `<name>`, …
>
> **Override surface (must preserve):** `ds:<id>` — overridden by `<consumer-file>`, instance `<id>` → keys: `<list>`, …
>
> **Default content (do not silently rewrite):** `<id>` (`text`) value `"…"`; `<id>` (`icon_font`) iconFontName `"…"`
>
> What shape changes would you like? (typography, spacing, layout, color tokens, structure)

Wait for clear instructions. If `/tmp/overridden-ids.json` is `[]`, say so explicitly.

### Step 5: Plan the change

Classify each proposed change:

- **Safe** — typography/spacing/layout/color tokens, adds new descendants, reorders children. Every entry in `/tmp/overridden-ids.json` is retained; every existing text `value` and `iconFontName` is unchanged.
- **Breaking** — removes a descendant in `/tmp/overridden-ids.json`, renames its `id`, or rewrites a default text/icon value consumers may rely on.

If breaking, prepare a migration map (`oldId → newId | removed`, `oldValue → newValue`) and confirm with the user before proceeding. Plan to update affected consumer files in the same pass.

### Step 6: Apply changes

Build the refined subtree as JSON. Reuse existing IDs everywhere they exist today; mint new IDs only for genuinely new nodes (`openssl rand -hex 4`).

Use `jq -n` so `LIB_ID` substitutes cleanly and `$ds:*` strings aren't expanded by the shell:

```bash
jq -n --arg id "$LIB_ID" '{
  id: $id, type: "frame", name: "ButtonPrimary", reusable: true,
  padding: 12, radius: "$ds:radius-sm",
  children: [ /* existing descendants with their original ids */ ]
}' > /tmp/refined.json

jq --arg id "$LIB_ID" --slurpfile new /tmp/refined.json '
  (.. | objects | select(.id? == $id)) |= $new[0]
' "$LIB" > "$LIB.tmp" && mv "$LIB.tmp" "$LIB"
```

If the change was breaking, apply the consumer migrations now (rename descendant keys, update overridden values) with the same `(.. | objects | select(.id? == $instanceId)) |= ...` pattern per affected file.

If Pencil has any of these files open, `jq` writes can be silently overwritten — confirm each landed with `grep -c` (see [pen-jq.md — Common Failures](references/pen-jq.md#common-failures)).

### Step 7: Validate preservation

```bash
jq --arg id "$LIB_ID" '.. | objects | select(.id? == $id) | [.. | objects | select(has("id")) | .id] | unique' "$LIB" > /tmp/post-ids.json

# Missing overridden IDs — expect [] unless this was a planned breaking change
jq --slurpfile o /tmp/overridden-ids.json --slurpfile p /tmp/post-ids.json -n '$o[0] - $p[0]'
```

Any missing ID means a live consumer override no longer resolves. Restore the ID, or — if planned-breaking — confirm the Step 6 migration covered every usage in `/tmp/usages.json`.

### Step 8: Standard validation

Run the validation suite from [references/pen-jq.md — Validation After Writes](references/pen-jq.md#validation-after-writes) against `$LIB` **and** every consumer file touched in Step 6. Pay particular attention to: JSON validity, no duplicate IDs, `icon_font` `width`/`height` raw numbers, no `x`/`y` on flex children, slot-replacement values carry both `type` and `id`.

### Step 9: Report

Summarize: component refined (name + id); shape changes applied (one bullet each); override IDs preserved (count vs. expected from Step 3); breaking changes with the list of consumer files migrated; any follow-up on the React side (new prop surface, removed variant).

## Examples

### Safe shape-only refinement

> `/pencil refine ButtonPrimary` → tighten padding 16 → 12 and use `$ds:radius-sm`.

- Step 3 finds `<name>-screen.pen` references `ds:abc123` and overrides `ds:label-text`, `ds:icon-trailing`.
- Step 5: **Safe** — only `padding` and `radius` change; both overridden IDs retained.
- Step 7: post-edit ID set still contains both; diff is `[]`.
- Report: "Tightened padding (16→12) and radius (md→sm). 2 override IDs preserved. No consumer migration needed."

### Breaking rename with consumer migration

> `/pencil refine MetricSummary` → rename `value-text` to `metric-value`, add `metric-subtitle` below it.

- Step 3: consumer instances override `ds:value-text`.
- Step 5: **Breaking** — `value-text` disappears. Confirm with user. Migration: `ds:value-text` → `ds:metric-value`, override values preserved verbatim.
- Step 6: refactor the library component; in the same pass rewrite each consumer's override key.
- Step 7: diff against the OLD set is non-empty (`["value-text"]`) — expected, because consumers were migrated. Re-run Step 3 and confirm no consumer still carries `ds:value-text`.
- Report: "Renamed `value-text` → `metric-value`, added `metric-subtitle`. Migrated N consumer overrides. No content values changed."

## Troubleshooting

### A consumer instance lost its custom text/icon after refinement
The descendant ID it overrode was renamed or removed. Re-run Step 3 and diff with `/tmp/post-ids.json`. Restore the ID, or migrate the consumer's override key to the new ID.

### Default content changed across the whole app
A text `value` or `iconFontName` library default was rewritten; un-overridden instances inherit it. Revert the default. If the new copy is intentional, consumers wanting the old text must add an explicit override — flag this before shipping.

### Target not found / multiple matches
Name typo, or the same PascalCase name exists in multiple groups. List candidates with `jq '[.. | objects | select(.name? == $n) | {id, name, reusable}]' "$LIB"` and ask which one.

### Refining a non-reusable element
No override surface — edit directly with `jq`, then run the [pen-jq.md validation suite](references/pen-jq.md#validation-after-writes) on the file you touched. Skip Steps 3, 5, and 7.
