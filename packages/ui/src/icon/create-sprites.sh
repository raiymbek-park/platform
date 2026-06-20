#!/usr/bin/env bash
#
# Build the icon sprite from packages/ui/src/icon/svg/*.svg into
# apps/web/public/icon-sprites.svg, and regenerate the IconGlyph union
# in packages/ui/src/icon/types.ts.
#
# Run from anywhere — paths are derived from the script's own location.

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SVG_DIR="$SCRIPT_DIR/svg"
TYPES_FILE="$SCRIPT_DIR/types.ts"
REPO_ROOT="$( cd "$SCRIPT_DIR/../../../.." && pwd )"
PUBLIC_DIR="$REPO_ROOT/apps/web/public"
SPRITE_NAME="icon-sprites.svg"

if [ ! -d "$SVG_DIR" ]; then
  echo "Error: SVG directory not found: $SVG_DIR" >&2
  exit 1
fi

shopt -s nullglob
SVG_FILES=("$SVG_DIR"/*.svg)
shopt -u nullglob

if [ ${#SVG_FILES[@]} -eq 0 ]; then
  echo "No SVG files found in $SVG_DIR — nothing to build." >&2
  exit 0
fi

mkdir -p "$PUBLIC_DIR"

# Build the sprite. svg-sprite is fetched on demand via npx; no global install needed.
npx --yes svg-sprite \
  -s \
  --symbol-dest "$PUBLIC_DIR" \
  --symbol-sprite "$SPRITE_NAME" \
  "${SVG_FILES[@]}"

# Regenerate the IconGlyph union from the SVG filenames.
{
  echo "export type IconGlyph ="
  first=1
  for file in "${SVG_FILES[@]}"; do
    name="$(basename "$file" .svg)"
    if [ $first -eq 1 ]; then
      echo "  | '$name'"
      first=0
    else
      echo "  | '$name'"
    fi
  done
} > "$TYPES_FILE"

echo "🧬 Sprite written to $PUBLIC_DIR/$SPRITE_NAME"
echo "📝 Types written to $TYPES_FILE"

# Format the generated types via biome (root config picks up automatically).
if command -v npx >/dev/null 2>&1; then
  ( cd "$REPO_ROOT" && npx --yes biome format "$TYPES_FILE" --write )
  echo "✨ Biome formatting applied to $TYPES_FILE."
else
  echo "⚠️  npx not found — skipped formatting." >&2
fi
