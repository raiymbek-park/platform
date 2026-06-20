# 007. Monorepo tooling: npm workspaces + Turborepo

**Date:** 2026-06-20
**Status:** accepted

## Context

Everything lives in one monorepo: two apps (`apps/web`, `apps/api`) and two
shared packages (`packages/ui`, `packages/shared`) that pass types and
design-system primitives between them. We need a package manager and a task
runner.

What matters here:

- **The project is small** — two apps, two packages, a single product for one
  residential complex, built by a small team in its early days.
- **A lean toolchain is a deliberate goal** — fewer tools to install, pin, and
  learn means quicker onboarding and fewer moving parts in CI.
- The dependency tree is modest, so install speed and disk usage aren't pain
  points yet.

## Options Considered

### Option 1: npm workspaces + Turborepo (chosen)

- **Pros:** npm ships with Node, so there's nothing extra to install and no
  Corepack or version pinning to manage — no "install the package manager first"
  step for a new contributor or for CI. `npm ci` is the well-worn CI path on top
  of an npm-native lockfile. Turborepo adds caching and task orchestration over
  the top and doesn't care which package manager sits underneath.
- **Cons:** Without a content-addressable store, `node_modules` is bigger and
  cold installs are slower than pnpm. npm is also looser about phantom
  dependencies — a package can import an undeclared transitive dep and npm won't
  complain.

### Option 2: pnpm + Turborepo / Nx

- **Pros:** A content-addressable store (disk dedup), faster cold installs, and
  strict peer/phantom-dependency resolution.
- **Cons:** One more tool to install and pin. Its real wins — disk and speed at
  scale, strictness across many packages and contributors — barely register at
  this size, and the strictness adds friction early on.

### Option 3: Yarn

- **Pros:** Mature workspaces.
- **Cons:** Same "extra tool" cost as pnpm without pnpm's disk and strictness
  payoff; Berry's PnP brings its own compatibility headaches. No real edge here.

## Decision

Use **npm workspaces** — built into Node, nothing extra to install — for
dependencies and workspaces, and **Turborepo** for task caching and the build
pipeline (`build`, `typecheck`, `dev`).

At this scale npm isn't meaningfully behind pnpm, and keeping the toolchain
lean — no second package manager to install, pin, or teach — outweighs pnpm's
disk and cold-install gains, which only start to pay off with a much larger
dependency graph and a bigger team. Turborepo gives us the caching and fan-out we
actually need without tying us to a particular package manager.

## Consequences

### Positive
- Nothing extra to install: anyone with Node can run the repo right away.
- A standard, npm-native lockfile and plain `npm ci` in CI.
- Turborepo caches `typecheck`/`build` and runs tasks across workspaces.
- One fewer tool to pin, document, and keep current.

### Negative
- Bigger `node_modules` and slower cold installs than pnpm — no dedup store.
- npm won't flag phantom/undeclared-transitive imports, so a package can lean on
  a dependency it never declared.

### Neutral
- Turborepo is package-manager agnostic, so moving to pnpm later is a contained
  change — swap the manager, regenerate the lockfile — if scale ever calls for
  it.
