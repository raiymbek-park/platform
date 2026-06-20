# Editing .pen Files with jq

`.pen` files are plain JSON (including `.lib.pen` — same format). Read with `jq`, write back atomically via a temp file. Never use the Pencil MCP for mutations.

## File Layout

- **`design/design-system.lib.pen`** — library. `variables` + a single wrapper frame `"Design System"` containing sub-groups.
- **`design/*-screen.pen`** (e.g. `home-screen.pen`) — consumer files. Each has `"imports": { "ds": "design-system.lib.pen" }` and a single wrapper frame holding screens.

```bash
# Discover .pen files
find design -maxdepth 2 -name "*.pen"
```

## Cross-File Reference Syntax

Inside consumer files, every reference to library content carries the `ds:` prefix. Inside the library file itself, internal refs and variables stay bare (`"ref": "92JZc"`, `"fill": "$primary-black"`).

```jsonc
{ "type": "ref", "ref": "ds:92JZc", "descendants": { "ds:title": { "content": "Hi" } } }
{ "fill": "$ds:primary-black", "gap": "$ds:spacing-base" }
```

### Slot Replacement (cross-file-safe child injection)

Multi-segment descendant paths (`"ds:outer/inner"`) are stripped by Pencil across files. Workaround: replace the intermediate slot node wholesale via a descendant value. The replacement **must** have `"type"` and `"id"`, plus either a `"children"` array or nested `"descendants"`.

```jsonc
// Inject custom content into a content slot (fresh frame)
"ds:65959": {
  "type": "frame", "id": "myContent", "name": "content",
  "width": "fill_container", "layout": "vertical",
  "children": [ /* whatever you want inside */ ]
}

// Customize a ref's inner state cross-file (slot-replace with a ref + nested descendants)
"ds:vtBar": {
  "type": "ref", "ref": "ds:oGmxq", "id": "pd33Br",
  "descendants": { "ds:oNCL1": { "width": 214, "fill": "$ds:primary" } }
}
```

| Requirement | Why |
|-------------|-----|
| `"type"` field | Pencil hard-errors `Node '<id>' has no type` and refuses to open the file |
| `"id"` field | Auto-generated ids can fail downstream validation |
| `"children"` **or** nested `"descendants"` | Both work — `children` for a fresh frame, `descendants` to customize a replacement `ref` |

## Reading Structure

```bash
# Top-level wrapper (single frame per file) and its direct children
jq '.children[0] | {id, name}' design/<name>-screen.pen
jq '.children[0].children | map({id, name})' design/<name>-screen.pen

# All reusable components in the library
jq '[.. | objects | select(.reusable == true) | {id, name}]' design/design-system.lib.pen

# Inspect a component by id
jq --arg id "PostCard" '.. | objects | select(.id == $id)' design/design-system.lib.pen

# Variables (colors, sizes)
jq '.variables' design/design-system.lib.pen

# A component's children + descendant ids (for override planning)
jq --arg id "PostCard" '.. | objects | select(.id == $id) | {id, name, children: [.children[]? | {id, name, type}]}' design/design-system.lib.pen
```

## Writing / Appending

**Always write atomically** via a temp file: `jq '<filter>' file.pen > file.pen.tmp && mv file.pen.tmp file.pen`.

**Append a screen to a consumer's wrapper.** Consumer files have a single top-level wrapper frame; append to `.children[0].children`.

**The `--slurpfile` gotcha:** if the temp file is a JSON **array** `[{...}]`, `--slurpfile` wraps it again, giving `[[{...}]]`; `+= $screen` then nests an array inside `.children`, which Pencil rejects with `Node '<id>' has no type`. Match the pattern to the temp-file shape:

```bash
# Temp file is an OBJECT { "id": ..., "type": "frame", ... } — recommended:
jq --slurpfile s /tmp/new-screen.json '.children[0].children += [$s[0]]' \
  design/<name>-screen.pen > design/<name>-screen.pen.tmp && mv design/<name>-screen.pen.tmp design/<name>-screen.pen

# Temp file is an ARRAY [ { ... } ]:
jq --slurpfile s /tmp/new-screen.json '.children[0].children += $s[0]' \
  design/<name>-screen.pen > design/<name>-screen.pen.tmp && mv design/<name>-screen.pen.tmp design/<name>-screen.pen
```

**Append a reusable to a library sub-group:**
```bash
jq --slurpfile r /tmp/new-reusable.json '(.. | objects | select(.id? == "liGr") | .children) += $r' \
  design/design-system.lib.pen > design/design-system.lib.pen.tmp && mv design/design-system.lib.pen.tmp design/design-system.lib.pen
```

**Update one property on a node by id:**
```bash
jq --arg id "MyScreen" '(.. | objects | select(.id? == $id)) |= (.placeholder = false)' \
  file.pen > file.pen.tmp && mv file.pen.tmp file.pen
```

**Delete a node by id (anywhere in the tree):**
```bash
jq --arg id "MyScreen" 'walk(if type == "object" and has("children") then .children |= map(select(.id != $id)) else . end)' \
  file.pen > file.pen.tmp && mv file.pen.tmp file.pen
```

## ID Generation

New nodes need unique short IDs (~5 base62 chars, like Pencil generates):

```bash
openssl rand -hex 4 | head -c 8        # or: tr -dc 'A-Za-z0-9' </dev/urandom | head -c 6
```

Verify uniqueness — should return `[]`:
```bash
jq '[.. | objects | .id? // empty] | group_by(.) | map(select(length > 1))' file.pen
```

## Schema Cheatsheet

```jsonc
// Frame with vertical layout (omit layout for horizontal — it's the default)
{ "id": "abc123", "type": "frame", "name": "my-group", "layout": "vertical",
  "width": "fill_container", "gap": "$spacing-base", "padding": "$spacing-base",
  "fill": "$primary-black", "children": [] }

// Text node — always needs fill; use textGrowth if width/height are set
{ "type": "text", "name": "title", "content": "Hello", "fill": "$white",
  "fontFamily": "Open Sans", "fontSize": "$font-size-lg",
  "textGrowth": "fixed-width", "width": "fill_container" }

// Ref to a library component with descendant overrides (from a consumer)
{ "type": "ref", "ref": "ds:PostCard", "name": "post-item",
  "descendants": { "ds:title": { "content": "My title" } } }
// multi-segment paths like "ds:author/avatar" are stripped across files — use slot replacement.

// Icon from a font — width/height MUST be raw numbers
{ "type": "icon_font", "name": "search", "iconFontFamily": "lucide",
  "iconFontName": "search", "width": 22, "height": 22, "fill": "$text" }
```

## Validation After Writes

Run after every edit. All checks should pass before reporting success.

**Any file:**
```bash
jq empty file.pen && echo OK                                                            # valid JSON
jq '[.. | objects | .id? // empty] | group_by(.) | map(select(length>1)) | length' file.pen   # dup ids → 0
# icon_font width/height are raw numbers (→ []) — else icons render 0×0
jq '[.. | objects | select(.type? == "icon_font") | select((.width|type)!="number" or (.height|type)!="number") | {id,name}]' file.pen
# x/y on refs inside flex parents (inspect; strip unless parent is layout:none)
jq '[.. | objects | select((.x? != null or .y? != null) and .type=="ref") | {id,name,ref,x,y}]' file.pen
```

**Library (`design-system.lib.pen`) — every internal ref resolves (→ []):**
```bash
jq '[.. | objects | select(.type=="ref") | .ref] as $refs | [.. | objects | .id? // empty] as $ids | ($refs|unique) - $ids' design/design-system.lib.pen
```

**Consumer file — everything is `ds:`-prefixed and every target exists:**
```bash
# No bare refs / vars / descendant keys (each → 0)
jq '[.. | objects | select(.ref? and (.ref|type=="string") and (.ref|startswith("ds:")|not))] | length' file.pen
jq '[.. | strings | select(startswith("$") and (startswith("$ds:")|not))] | length' file.pen
jq '[.. | objects | select(.descendants?|type=="object") | .descendants | keys[] | select(startswith("ds:")|not)] | length' file.pen

# Every ds: ref target exists in the library (→ [])
jq '[.. | objects | select(.ref?|type=="string") | .ref | sub("^ds:";"")] | unique' file.pen > /tmp/used.json
jq '[.. | objects | .id? // empty] | unique' design/design-system.lib.pen > /tmp/lib.json
jq --slurpfile u /tmp/used.json --slurpfile l /tmp/lib.json -n '$u[0] - $l[0]'

# Wrapper children are all objects (catches the --slurpfile double-array bug → 0)
jq '[.children[0].children[] | select(type != "object")] | length' file.pen
```

## Common Failures

- **"jq write didn't land."** Pencil has the file open and auto-saves over it. `grep -c '"<name>"' file.pen` after each write; if 0, ask the user to close the file in Pencil and retry.
- **`Node '<id>' has no type` on open.** Either a double-wrapped append (run the wrapper-children check above) or a slot-replacement value missing `type`/`id`. The cited `<id>` is generated at load time — don't grep for it.
- **"Some invalid data was skipped."** Usually `x`/`y` on a flex child, a multi-segment cross-file descendant key, or a missing `ds:` prefix. Run the validation checks above.
- **Icons invisible (0×0).** `icon_font` `width`/`height` were variable strings — Pencil rewrote them to 0. Use raw numbers.
- **Consumer renders all defaults / red dashed refs.** Descendant keys not `ds:`-prefixed, or the library isn't registered with the consumer (one-time Pencil UI step — see rules.md).
