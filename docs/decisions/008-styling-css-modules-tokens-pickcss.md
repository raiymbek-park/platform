# 008. Styling: CSS Modules + design tokens + `pickCss`

**Date:** 2026-06-20
**Status:** accepted

## Context

The web app and the `packages/ui` design system need a styling approach that
keeps a single source of truth for design decisions (colour, spacing, type) and
supports theming, while staying readable and cheap to maintain. State-driven
class names (loading, variant, size) and a few runtime-dynamic values (progress,
positions) also need a tidy pattern.

## Options Considered

### Option 1: CSS Modules (SCSS) + tokens + `pickCss`/`cssVariables` (chosen)

- **Pros:** Styles are co-located and locally scoped, so no global-namespace
  collisions. All design decisions live as CSS custom properties in
  `tokens.scss`; semantic colour tokens make theme switching a matter of
  rebinding a token, and one-off hex/spacing values become a visible code smell.
  `pickCss` turns props into BEM-ish state classes deterministically, and
  `cssVariables` passes runtime values through CSS variables instead of inline
  style sprawl.
- **Cons:** `pickCss` is a custom abstraction the team has to learn and maintain,
  and the SCSS class names must mirror the pattern it generates — a coupling
  that's implicit and easy to desync. No atomic-CSS purging, and it's wordier
  than a utility framework for quick one-offs.

### Option 2: Tailwind / atomic CSS

- **Pros:** Fast to write, design constraints baked into utilities, strong
  purging.
- **Cons:** Design tokens get expressed through config and utility soup rather
  than plain CSS custom properties; theming and semantic naming are less direct;
  markup fills with long class strings. A different model from the token-first
  one we want.

### Option 3: CSS-in-JS (runtime)

- **Pros:** Co-location, dynamic styling from props in one place.
- **Cons:** Runtime cost and SSR/tooling friction; styling decisions leak into
  the JS bundle instead of staying as cacheable CSS and tokens.

## Decision

Use **CSS Modules in SCSS**, with all design decisions as **CSS custom-property
tokens** (`app/tokens.scss`, semantic colour names, literal sizing scales), and
compose stateful classes with **`pickCss`** and runtime values with
**`cssVariables`** (both from `@raiymbek-park/shared`). Global SCSS is limited to
resets/tokens; element-specific styling lives in component modules. Colour is
tokenized semantically and font-weight is tokenized through the `--weight-*`
scale — the single non-colour token scale — while every other sizing value
(spacing, font size, radius, icon and avatar size) stays a literal `px` in the
component module.

## Consequences

### Positive
- Locally scoped styles, no global collisions.
- One source of truth for design; theming is a token rebind, off-token values
  stand out in review.
- Deterministic, readable state classes; runtime values via CSS variables, not
  inline-style sprawl.

### Negative
- `pickCss` is a bespoke helper to learn and maintain.
- The SCSS class names and the `pickCss` output are coupled by an implicit naming
  contract — rename one side and the style silently stops applying.
- No atomic purging; more verbose than utilities for quick styling.

### Neutral
- The approach leans on the team holding the token discipline; only convention,
  not tooling, stops a stray literal colour or spacing value.
