# 003. Web architecture: Feature-Sliced Design

**Date:** 2026-06-20
**Status:** accepted

## Context

`apps/web` needs a structure that scales past a handful of screens and keeps
boundaries from eroding. Left unstructured, a React app drifts into a grab-bag of
`components/`, `hooks/`, and `utils/` where anything can import anything and
feature code leaks across the app.

## Options Considered

### Option 1: Feature-Sliced Design (chosen)

- **Pros:** Explicit layers — `app` / `pages` / `features` / `shared` — with a
  direction to dependencies, so the structure documents itself and boundaries are
  visible. It fits the conventions we already enforce: the `@/` alias with no
  `../../` parent imports (Biome blocks the glob), thin pages that compose
  rather than fetch, and shared primitives in `shared/ui`.
- **Cons:** Ceremony for a young app — more folders and placement decisions than
  the codebase strictly needs yet, and recurring "is this a page or a feature?"
  judgement calls.

### Option 2: Flat, grouped by type (`components/`, `hooks/`, `utils/`)

- **Pros:** Dead simple, nothing to learn.
- **Cons:** No boundaries — every module can reach every other; feature code
  scatters across type folders and gets hard to move or delete as the app grows.

### Option 3: Ad-hoc feature folders, no layer rules

- **Pros:** Lightweight, groups by domain.
- **Cons:** Without a layering convention, "shared" vs "feature" ownership blurs
  and cross-imports creep back in; the discipline isn't anchored to anything.

## Decision

Adopt **Feature-Sliced Design** for `apps/web`: layers `app` / `screens` /
`features` / `shared`, reached through the `@/*` path alias (no `../../`),
single-level `../sibling` only within a slice. Pages stay thin composition
layers; data fetching lives in widgets/child components; reusable primitives sit
in `shared/ui` and spread `...restProps`. The canonical FSD layer name `pages`
is used (not `screens`), so the FSD linter (Steiger) validates the structure
without custom layer aliases.

## Consequences

### Positive
- Boundaries are explicit and enforced (Biome's `noRestrictedImports` for
  parent imports + Steiger's FSD rules via `npm run lint:fsd`).
- Features are easy to locate, move, and delete as cohesive slices.
- Matches the team's existing naming, import, and "thin page" conventions.

### Negative
- More structure than a small app needs today — a degree of up-front ceremony.
- The page/feature line is a recurring judgement call that needs team
  agreement to stay consistent.

### Neutral
- FSD is a convention, not a framework; the import rule and core FSD structure
  are mechanically enforced (Biome + Steiger), the rest rides on review discipline.
