# 002. API layer: tRPC over REST or GraphQL

**Date:** 2026-06-20
**Status:** accepted

## Context

Both ends of the product are TypeScript and live in the same monorepo: `apps/api`
(a tRPC server on the standalone Node adapter) and `apps/web` (React, consuming
the API through `@trpc/client` and `@trpc/tanstack-react-query`). One small team
owns both sides, and there's no third-party consumer of the API today.

The question is how the client and server agree on a contract.

## Options Considered

### Option 1: tRPC (chosen)

- **Pros:** The contract is the TypeScript types themselves — the client imports
  the server's router type and gets fully typed inputs and outputs with no codegen
  step and no schema kept in a second place. Refactors on the server surface as
  type errors on the client immediately. It pairs natively with TanStack Query.
- **Cons:** It only works when both ends are TypeScript and both speak tRPC.
  There's no language-agnostic contract artifact, and exposing the API to an
  outside consumer later means putting a real boundary (REST/OpenAPI or GraphQL)
  in front of it.

### Option 2: REST + OpenAPI with codegen

- **Pros:** A language-agnostic, standard contract; easy to expose publicly;
  HTTP caching semantics out of the box.
- **Cons:** A schema to author and a codegen step to run and keep in sync; types
  are generated, not inferred, so there's always a regeneration gap between a
  server change and the client seeing it.

### Option 3: GraphQL

- **Pros:** Strong typed schema, flexible querying, great for many heterogeneous
  clients.
- **Cons:** Heavy for a single first-party client — a server framework, schema
  SDL, codegen, and resolver plumbing to maintain. Solves a fan-out problem we
  don't have.

## Decision

Use **tRPC 11**. With one team owning a TypeScript client and a TypeScript server
in the same repo, end-to-end type inference with no schema duplication and no
codegen is the cheapest contract that's also the safest — a server change can't
silently diverge from the client because it won't type-check.

## Consequences

### Positive
- Fully typed client↔server calls with zero codegen and no second schema.
- Server-side refactors show up instantly as client type errors.
- Clean integration with TanStack Query via the official adapter.

### Negative
- Locks both ends to TypeScript and to tRPC — no language-agnostic contract.
- Exposing a public/third-party API later needs a separate REST or GraphQL edge.
- No built-in HTTP-level caching story the way plain REST resources have;
  versioning the API is a manual concern.

### Neutral
- tRPC speaks HTTP underneath, so a REST/OpenAPI facade can be added in front
  later if an external consumer appears — it's an addition, not a rewrite.
