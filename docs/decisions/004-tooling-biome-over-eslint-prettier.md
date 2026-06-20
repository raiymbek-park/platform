# 004. Linting and formatting: Biome over ESLint + Prettier

**Date:** 2026-06-20
**Status:** accepted

## Context

The repo needs linting, formatting, and import organization across every
workspace. The default in the ecosystem is ESLint plus Prettier — two tools, two
configs, and the well-known friction of keeping their rules from fighting each
other.

## Options Considered

### Option 1: Biome (chosen)

- **Pros:** One tool does linting, formatting, and import sorting, from a single
  `biome.json`. It's fast (Rust), there's no lint/format rule conflict to
  referee, and it covers what we lean on — `noRestrictedImports` for the
  `../../` ban, `organizeImports`, and a recommended rule set. `biome check` is
  the one command for both CI and local.
- **Cons:** A smaller, younger rule ecosystem than ESLint. It can't tap the vast
  ESLint plugin universe, so a niche or framework-specific rule may simply not
  exist yet, and the tool still churns.

### Option 2: ESLint + Prettier

- **Pros:** The largest rule and plugin ecosystem; almost any rule you want
  already exists; battle-tested integrations everywhere.
- **Cons:** Two tools and two configs to wire together and keep from conflicting;
  noticeably slower; more moving parts — which cuts against the project's
  lean-toolchain goal (see ADR 007).

### Option 3: oxlint + Prettier

- **Pros:** Very fast linting.
- **Cons:** Still pairs a linter with a separate formatter, so it doesn't deliver
  the one-tool simplicity; younger and narrower than even Biome on rules.

## Decision

Use **Biome 2.5** as the single linter + formatter + import organizer. One fast
tool with one config matches the lean-toolchain goal and removes the
ESLint/Prettier coordination overhead, and it already enforces the rules we
actually rely on.

## Consequences

### Positive
- One tool, one config, one command (`biome check`) for lint + format + imports.
- Fast, with no lint-vs-format conflict to manage.
- Enforces the `../../` import ban and import organization out of the box.

### Negative
- Smaller rule/plugin ecosystem than ESLint; a needed niche rule may not exist.
- No access to the ESLint plugin universe; younger tool, so some churn.

### Neutral
- ESLint can be reintroduced later only for a specific rule Biome lacks, without
  giving up Biome as the formatter — though running both reopens the coordination
  cost this decision set out to avoid.
