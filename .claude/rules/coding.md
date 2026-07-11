# Coding Conventions

## Scope

These rules apply to ALL code in the repository — `apps/`, `packages/`, and any other code files.

## General Principles

- Prioritize readability, maintainability, and simplicity
- Prefer concise solutions: less code, fewer elements, minimal CSS
- Favor functional and declarative patterns; avoid classes
- Keep functions under 200 lines; split into smaller units
- Avoid deep nesting in code or markup (3+ levels)
- Avoid over-engineering: unnecessary abstractions, premature generalization, feature flags for simple changes
- Windows compatibility: use forward slashes in glob patterns — `path.join` produces backslashes on Windows which breaks glob libraries. Use `path.join` only for non-glob filesystem paths
- Follow FSD layering and common sense, not a blanket "everything is a widget" rule. Promote a block to its own `widgets/` (or `entities/`) slice only when it is reused across pages or is significant/self-contained on its own. A section used by a single page lives **inside that page's slice** as a child component (`pages/{page}/ui/*` with its data hooks in `pages/{page}/model/*`). A single-reference slice that trips `fsd/insignificant-slice` is the signal to inline it, not to suppress the rule. Pages may own the data-fetching for their own page-specific sections.
- Shared-segment layout (`fsd/no-reserved-folder-names`): a `shared/*` segment holds its files directly (`shared/toast/{use-toast-store.ts, toast-host.tsx, index.ts}`) — never a `model/` or `ui/` subfolder inside it. Reserved folder names apply only to slices in the higher layers.

## JSX Props

- Properties first, then callbacks — sorted alphabetically within each group
- Callbacks are props starting with `on` or whose value is a function

```tsx
// Prefer
<img
  className={css.avatar}
  data-testid='user-avatar'
  src={avatarUrl}
  onClick={handleClick}
  onLoad={handleLoad}
/>

// Avoid
<img
  onClick={handleClick}
  src={avatarUrl}
  className={css.avatar}
  onLoad={handleLoad}
  data-testid='user-avatar'
/>
```

## Rest Props

- Reusable components (`shared/ui`, `entities/ui`) must spread `...restProps` on the root element
- This allows consumers and tests to pass `data-testid` and other attributes without the component listing them explicitly
- Never hardcode `data-testid` inside reusable components

```tsx
type CardProps = {
  title: string
}

export const Card = ({ title, ...restProps }: CardProps) => (
  <article {...restProps}>
    <h2>{title}</h2>
  </article>
)
```

## Imports

- **Never use `../../` parent-relative imports.** Reach two or more levels up via the `@/...` path alias (`@/*` → `./src/*`). Enforced by biome's `noRestrictedImports` with the `../../**` glob.
- Single-level `../sibling` is allowed when the import stays within the same FSD slice.
- `import type` and value `import` are organized into separate groups (types first, then a blank line, then values) — biome's `organizeImports` handles this automatically; don't hand-sort.

```ts
// Prefer
import type { IconGlyph } from '@/shared/ui/icon/types'

import { Icon } from '@/shared/ui/icon'

// Avoid — biome will error
import { Icon } from '../../icon'
import type { IconGlyph } from '../../icon/types'
```

## HTML Semantics

See `.claude/rules/html.md` for the full HTML/JSX conventions — semantic-tag preference (`<main>`/`<section>`/`<header>`/`<footer>`/`<nav>`/`<aside>`), built-in elements (`<dialog>`, `<details>`, `<datalist>`, `<output>`, `<progress>`, `<picture>`, etc.), anti-patterns (`<div onClick>`, custom dropdowns, missing `type` on `<button>`), and when `<div>` is the right answer.

## Styling

See `.claude/rules/styling.md` for the full styling conventions (CSS modules, design tokens, global SCSS scope, class composition, fonts, etc.).

## TypeScript

- Strict mode enabled
- Use `type` over `interface`
- Avoid `any`, type assertions (`as`, `!`), and enums (use objects or maps)
- `unknown` is acceptable only at system boundaries (user input, external APIs)

### Type Safety

**NEVER use type assertions (`as`, `!`)** — they bypass type checking.

When TypeScript complains about types:

1. Don't force it with `as` — the error is telling you something
2. Fix the root cause: use correct types from the source
3. Create typed helpers if needed, but use proper types in the signature

## Code Style

- Use `const` and immutability; avoid `let`
- Always use arrow functions — avoid `function` declarations
- Use implicit return (no `return` keyword) when the body is a single expression
- Arrow functions (`const`) don't hoist — declare before use
- Avoid `for`/`for...of` loops — prefer chaining array methods (`.map`, `.filter`, `.reduce`, `Object.fromEntries`, etc.)
- Minimize `if-else` and `switch`; prefer early returns
- Don't wrap a single-await body in `async () => { await x() }` — return the promise directly with `() => x()`. The `async` keyword only earns its keep when the callback has multiple awaits, conditional control flow, or side-effects between awaits
- Don't add comments. The only justified comment explains a genuine hack or workaround — code forced to do something out of the ordinary by a bug, a third-party quirk, or an environment constraint — where the *why* isn't recoverable from the code itself.
- A comment explaining ordinary code is a smell: it signals the code isn't clear enough. Rewrite it instead — better names, smaller functions, early returns — until it reads on its own, rather than narrating it with a comment.
- Use descriptive naming instead of comments
- Concrete comment noise to never write (production code, and especially tests): section-divider banners (`// ---- otp.send ----`), JSDoc/line comments restating a well-named symbol (`// Seed the store` over `seedStore`), narration of mock setup or of what the next assertions demonstrate, `// Kill: <mutant>` notes in tests (the test name already states the behavior), and magic-number decoders (`86_399_000 // ~24h`) — write self-documenting arithmetic instead (`(24 * 60 * 60 - 1) * 1000`). Before adding any comment, first try to rename/restructure so it becomes unnecessary.

## Naming Conventions

- **Files/folders**: kebab-case (`user-profile.tsx`)
- **Components**: PascalCase (`UserProfile`)
- **Variables**: descriptive with auxiliary verbs (`isLoaded`, `hasError`)
- **Exports**: favor named exports
- Avoid redundant naming: `user.id` not `user.userId`

### Hooks

| Type | Pattern | Example | File name |
|------|---------|---------|-----------|
| Zustand store | `use{Entity}Store` | `useCartStore` | `use-cart-store.ts` |
| Query (data) | `use{Entity}Data` | `useDonutsData` | `use-donuts-data.ts` |
| Mutation (create) | `useCreate{Entity}` | `useCreateOrder` | `use-create-order.ts` |
| Mutation (update) | `useUpdate{Entity}` | `useUpdateDonutLike` | `use-update-donut-like.ts` |
| Mutation (delete) | `useDelete{Entity}` | `useDeleteOrder` | `use-delete-order.ts` |

File names mirror the hook name in kebab-case (e.g., `useCartStore` → `use-cart-store.ts`).

### Query Keys

Centralize query keys via a factory object named `{entity}Keys`:

```ts
const donutKeys = {
  all: ['donuts'] as const,
  detail: (id: string) => [...donutKeys.all, id] as const,
  list: () => [...donutKeys.all, 'list'] as const,
}
```

- Factory name: `{entity}Keys` (camelCase, plural entity: `donutKeys`, `orderKeys`)
- `all` — base key for the entity, used for broad invalidation
- `list()` — extends `all`, used for list queries
- `detail(id)` — extends `all`, used for single-entity queries
- All keys use `as const` for type safety
- Keys build on `all` via spread — changing `all` propagates to all derived keys
- When touching existing query files that use hardcoded arrays, migrate them to this spread-based pattern


## Examples

### Arrow Functions

```tsx
// Prefer
const RootComponent = () => <Outlet />

const getUser = (id: string) => users.find(u => u.id === id)

// Avoid
function RootComponent() {
  return <Outlet />
}

const getUser = (id: string) => {
  return users.find(u => u.id === id)
}
```

### Conditional Syntax

```ts
// Prefer
if (['.', ','].includes(e.key))

// Avoid
if (e.key === '.' || e.key === ',')
```

### Object Properties

```ts
// Prefer
const user = { id: 12, name: "Homer" }

// Avoid
const user = { userId: 12, userName: "Homer" }
```

### Async callback wrappers

```ts
// Prefer — let the caller await the returned promise
await act(() => vi.advanceTimersByTimeAsync(600))

// Avoid — async wrapper is a no-op when the body is a single await
await act(async () => {
  await vi.advanceTimersByTimeAsync(600)
})
```

## React Imports

```ts
// Prefer
import { StrictMode, useEffect } from 'react'

<StrictMode>
  useEffect(() => {
    console.log('Hello')
  }, [])
</StrictMode>

// Avoid
import React from 'react'

<React.StrictMode>
  React.useEffect(() => {
    console.log('Hello')
  }, [])
</React.StrictMode>
