# 001. State boundaries: TanStack Query, Zustand, and the Router

**Date:** 2026-06-20
**Status:** accepted

## Context

A React app juggles three kinds of state that get conflated all the time: data
that belongs to the server, state the UI owns (selection, modals, overlays), and
state that describes location (filters, pagination, the current route). When
these blur together you get the familiar mess — the query cache used as a
scratchpad, full server entities mirrored into a client store, and optimistic
updates done by reaching into paginated cache pages by hand.

We want each kind of state to have one clear owner, and we want optimistic UI
without cache surgery.

## Options Considered

### Option 1: Three owners — Query / Zustand / Router, overlays for optimism (chosen)

- **Server state → TanStack Query**, the single source of truth for anything that
  came from the API. **UI state → Zustand**, holding minimal identifiers, not
  copies of entities. **Navigation state → the Router**, with filters and
  pagination in the URL/search params. Optimistic updates ride on **ID-based
  overlays** (e.g. `selectedIds`, `deletedIds`, `updatedRecords`) that are
  layered over query data at projection time, so the cache stays a stable
  snapshot of server truth.
- **Pros:** No cache fragmentation, safe refetch/invalidation, shareable and
  reload-safe URLs, no duplicated server data to keep in sync.
- **Cons:** Three concepts to keep straight; the discipline has to be held by
  hand; view models are derived on every render.

### Option 2: One global store for everything (Redux-style)

- **Pros:** A single mental model; one place to look.
- **Cons:** You re-implement caching, deduplication, and background refetching
  that Query gives for free, and server data inevitably gets mirrored and goes
  stale. Heaviest boilerplate of the three.

### Option 3: The query cache as the universal store

- **Pros:** Fewer moving parts up front.
- **Cons:** UI flags and selection end up inside cached server data; optimistic
  edits turn into cross-page `setQueryData` surgery that breaks on refetch and
  pagination. This is exactly the failure mode we're avoiding.

## Decision

Split state by ownership: **TanStack Query** for server truth, **Zustand** for
client-owned UI state (minimal IDs, never entity copies), the **Router** for
navigation state (filters/pagination in search params). Displayed data is always
**derived** — `query data → projection → overlay → UI` — and optimistic behaviour
is implemented as ID-based overlays cleaned up in `onSettled`, never as manual
cache mutation. `setQueryData` is allowed only for a single, predictable cache
key (a detail page, a mutation that returns the full entity).

## Consequences

### Positive
- The cache stays structurally stable, so refetch and invalidation are safe.
- No duplicated server state to drift out of sync.
- URLs are shareable and survive reloads (filters/pagination live in the URL).
- Optimistic updates can't fragment paginated/infinite queries.

### Negative
- Three owners is more to learn than "put it all in one store," and the
  boundaries are convention, not something the compiler enforces.
- Projections (filter/sort/group + overlay) are recomputed per render and have to
  be kept pure.
- Overlay cleanup is manual — forget it in `onSettled` and stale IDs accumulate.

### Neutral
- Deriving the view model is more code than reading a value straight from a
  store, traded for correctness under refetch.
