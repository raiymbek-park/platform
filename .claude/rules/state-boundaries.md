# State & Data Management

## Core Philosophy

Clear separation of responsibilities between server state, UI state, and navigation state. The goal is predictable behavior, scalable architecture, and smooth UX without unnecessary cache manipulation.

**Key Principle:**

> **Update != Cache Surgery**

The query cache represents a snapshot of server truth and must remain structurally stable. It is not a general-purpose state store.

## Responsibility Boundaries

### 1. Server State -> TanStack Query

Single source of truth for all server-derived data: API responses, entities, lists, records, remote metadata.

Responsible for: fetching, caching, deduplication, background refetching, stale management, mutations lifecycle.

**Rules:**

- Query cache must not be used as a UI state container
- Query cache must not be manually normalized unless strictly required
- Avoid structural mutations across paginated/infinite queries
- Centralize query keys via a factory object (e.g., `userKeys.all`, `userKeys.list(filters)`, `userKeys.detail(id)`)

### 2. Navigation State -> Router

Source of truth for location-driven state: URL parameters, search params (filters, pagination, sorting), route lifecycle.

Responsible for: orchestrating data loading, defining screen lifecycle, managing transitions, prefetching.

**Rules:**

- Filters, pagination, and sorting live in URL/search params
- Components must not invent parallel navigation state
- Router loads data via `ensureQueryData` in loaders — components subscribe via `useQuery`

### 3. UI State -> Zustand

Client-owned, interaction-driven state: selection, modals, local interaction flags, temporary overlays, optimistic UI layers, view model state.

**Rules:**

- UI state must not duplicate server data
- Store minimal identifiers, not full entity copies
- Prefer derived projections over stored datasets
- Zustand stores must be explicitly typed: `create<StoreState>()()`

## Optimistic UI Strategy

Optimistic behavior is implemented via **overlay layers**, not cache mutation.

### Store Only Minimal Overlays

```ts
selectedIds: Set<string>
deletedIds: Set<string>
updatedRecords: Map<string, Partial<Entity>>
```

**Rationale:**

- Prevent cache fragmentation issues
- Avoid pagination/infinite query inconsistencies
- Ensure safe refetch & invalidation

### Store the resulting state, not the gesture

An overlay holds the value the UI should show **after** the change — the resolved end
state — not the user's action or a delta to be re-derived later. If the overlay stores an
intent (e.g. "toggle X") and the projection recomputes the outcome against server truth on
every render, rapid or repeated interactions desync: each one re-derives from a base that
has not caught up yet, so the second interaction in a burst lands on the wrong result.
Store the target state; let a newer interaction overwrite it. Projection then only renders
the overlay, it never re-decides the outcome.

## Projection Strategy (View Model Layer)

Displayed UI data is always **derived**, never duplicated.

```
Query Data -> Projection -> Optimistic Overlay -> UI
```

Projection may include: client-side filtering, sorting, grouping, visibility rules.

**Rules:**

- Never store derived datasets in Zustand
- Always compute projections from Query data
- Treat projections as pure functions
- Compose the whole `Query -> Projection -> Overlay -> UI` chain in **one** place — the
  query/view-model hook that owns the data — and return ready-to-render values. Components
  consume the merged result; they must not subscribe to the query and the overlay
  separately and merge inside the view. Two independent subscriptions update in separate
  renders, so the view momentarily paints one source against a stale copy of the other (a
  visible flash on settle).

## Mutation Lifecycle

Mutations interact with overlays, not cache structures.

**Preferred pattern:**

1. Apply optimistic overlay (`onMutate`)
2. Execute mutation
3. Rollback on error (`onError`)
4. Clean up overlay and invalidate queries (`onSettled`)

- Use `mutationKey` to group/identify related mutations and query mutation state (e.g., via `useIsMutating`)
- Always clean up overlays in `onSettled` — don't rely on invalidation alone, stale IDs accumulate

**Avoid:** deep cache traversal, page-level manual updates, cross-query structural surgery.

## Data Update & Refetch Behavior

Refetching is a normal and expected operation. Overlays remain stable because they are ID-based.

**Rules:**

- Do not attempt manual cache reconciliation
- Allow Query to resolve server truth
- Overlays adapt automatically
- Invalidation refetches **active** queries only by default; inactive cached variants of
  the same data (other filters, tabs, or pages) stay stale until they are observed again.
  An overlay keyed by entity id spans those variants, so clear it only once every variant
  the user can reach is fresh — refetch all affected variants before cleanup (in TanStack,
  invalidate with `refetchType: 'all'`, since the default `'active'` skips inactive
  variants), or gate the overlay's removal on the freshness of the query being viewed.
  Otherwise switching to a still-stale variant flashes pre-mutation data. Order the cleanup
  after the refetch resolves: while it is in flight the overlay must stay, so it keeps
  covering every variant until truth lands.

## Forbidden Patterns

- Using query cache as UI store (storing selection/UI flags inside query data)
- Duplicating server data in Zustand (full entity arrays, mirrored datasets)
- Cache surgery for routine UI updates (manual page traversal, complex `setQueryData` normalization)
- Mixing responsibility domains (UI logic in Query layer, server data in UI store)

## When `setQueryData` Is Valid

`setQueryData` is acceptable when the update targets a **single, predictable cache key**:

- Single-entity detail pages (one cache key, no traversal)
- Mutations that return the full updated entity (avoids redundant refetch)
- Known, stable cache keys with no pagination or filter variants

If it requires traversing pages, filters, or multiple query keys — use overlays instead.

## Preferred Patterns

- **Derived UI state** — compute UI representation from Query data, apply overlays dynamically
- **Overlay-based optimistic updates** — use ID-based flags, avoid structural cache mutations
- **URL-driven navigation state** — filters & pagination in search params
- **Clear separation of truth sources** — server truth via Query, client truth via Zustand, navigation truth via Router
