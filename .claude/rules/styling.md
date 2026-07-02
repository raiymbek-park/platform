# Styling Conventions

## Scope

These rules apply to ALL CSS/SCSS in the repository — `apps/web`, `packages/ui`, and any other style files.

## CSS Modules

- Use CSS modules: `import css from './component.module.scss'`
- Reference classes via the `css` object in TS: `<div className={css.container}>`
- Class names in CSS use kebab-case (`primary-button`); reference as camelCase in TS (`css.primaryButton`) — Vite plugin handles the conversion via `localsConvention: 'camelCaseOnly'`
- One module per component, co-located: `component-name.module.scss` next to `component-name.tsx`
- Generated `.module.d.scss.ts` files are gitignored and excluded from biome — never edit them by hand

## Property Ordering

- Sort CSS properties alphabetically within each rule block
- Custom properties in `:root` are also alphabetized

## Class Composition (`pickCss` & `cssVariables`)

Use helpers from `@raiymbek-park/shared` for stateful classes and runtime CSS variables:

```ts
import { cssVariables, pickCss } from '@raiymbek-park/shared'
import css from './button.module.scss'

const buttonCss = pickCss(css, css.button)

<button
  className={buttonCss({ isLoading, state: 'error' }, css.primary)}
  style={cssVariables({ progress: '50%' })}
>
```

Pass the root class **by reference** (`css.button`), not as a string literal (`'button'`).
The member access lets fallow's dead-code analysis see the root class as used; a bare
string is invisible to it. `pickCss` recovers the base key from the value internally to
derive the state classes.

> **Root class names must be single-word** (`button`, `card`, `input`) — never multi-word
> (`icon-button`). fallow matches the raw kebab class name against the camelCase JS access
> and does not apply the `localsConvention: camelCaseOnly` conversion, so a multi-word root
> (`.icon-button` ↔ `css.iconButton`) is falsely reported as unused. Single-word roots are
> identical in both cases. Revisit once fallow honours `localsConvention` (issue pending).

### How `pickCss` builds class names

Given a `rootClass` of `button`:

| Prop value | Generated class | Notes |
|---|---|---|
| `{ isLoading: true }` | `button-is-loading` | Boolean `true` — value NOT appended |
| `{ state: 'error' }` | `button-state-error` | String value appended |
| `{ isLoading: false }` | _(no class)_ | `false` / `undefined` are skipped |
| `{ size: 'lg' }` | `button-size-lg` | String value |

Prop names are converted from camelCase to kebab-case automatically (`isLoading` → `is-loading`).

### SCSS class naming — match the generated pattern exactly

The SCSS module MUST declare classes following the same shape `pickCss` generates. Use SCSS `&` nesting under the root class:

```scss
.button {
  // base styles for the rootClass

  // boolean prop: &-{prop-name}
  &-is-loading { ... }
  &-is-disabled { ... }

  // string-valued prop: &-{prop-name}-{value}
  &-state-error { ... }
  &-state-success { ... }
  &-size-sm { ... }
  &-size-lg { ... }
}
```

The compiled output is `.button-is-loading`, `.button-state-error`, etc. — exactly what `pickCss` produces.

### Composing the consumer's `className`

The function returned by `pickCss(...)` already accepts extra classes after the props object — pass `className` directly, don't wrap it in `joinCss`:

```tsx
// Prefer
className={buttonCss({ isIconOnly, isInline, isLoading, variant }, className)}

// Avoid — redundant wrapper
className={joinCss(buttonCss({ isIconOnly, isInline, isLoading, variant }), className)}
```

`joinCss` stays useful when you're combining two static class strings that don't come from a `pickCss` factory at all (e.g. `joinCss(css.foo, className)`).

### `cssVariables`

- `cssVariables({ progress: '50%' })` → `{ '--progress': '50%' }` for spreading into `style`
- Reference inside SCSS as `var(--progress)`

## Design Tokens

All design tokens live in `src/app/tokens.scss` as CSS custom properties on `:root`. Imported once globally in `src/app/app.tsx` BEFORE `app.scss`.

### Color tokens — semantic names only

NEVER use literal color names (`--yellow`, `--green`, `--gray`). Theme switching (dark/light) re-binds the same token to a different hex; literal names break in another theme.

| Token | Role |
|-------|------|
| `--background` | App background (deepest layer) |
| `--surface` | Raised surface (inputs, cards) |
| `--disabled-surface` | Disabled control surface |
| `--muted-surface` | Muted / inactive surface |
| `--border` | Dividers, subtle borders |
| `--foreground` | High-contrast text/icon |
| `--text-secondary` | Body text (default reading copy) |
| `--text-muted` | Tertiary text/icons (de-emphasized) |
| `--shadow` | Elevation shadow color (translucent — use directly, don't `color-mix`) |
| `--scrim` | Translucent overlay |
| `--action` | Primary action / CTA |
| `--action-strong` | Pressed / active action |
| `--brand` | Brand accent (splash, hero, success) |
| `--brand-soft` | Soft brand surface |
| `--brand-subtle` | Subtle brand surface |
| `--brand-text` | Brand-colored text |
| `--info` | Informational accent |
| `--info-soft` | Soft info surface |
| `--accent` | Secondary accent |
| `--accent-soft` | Soft accent surface |
| `--danger` | Error / destructive state |
| `--danger-soft` | Soft danger surface |
| `--warning` | Warning state |
| `--warning-soft` | Soft warning surface |
| `--warning-accent` | Warning accent |

### Sizing — literal values, not tokens

Sizing does not use tokens at all. The design authors font sizes, radii, icon/avatar
sizes, and all spacing as raw per-component measurements, so the code does the same: write
the literal `px` value in the component SCSS module that needs it.

**There are no numeric tokens.** Every spacing, font size, radius, and icon/avatar size —
including the base 16px rhythm — is a literal.

- **Font sizes** — literal `px` (e.g. `font-size: 15px`). **13px is the floor — never render text below it.**
- **Border radius** — literal `px` (e.g. `border-radius: 18px`).
- **Icon / avatar sizes** — literal `px` on the icon/avatar box.
- **Spacing** — literal `px` (e.g. `padding: 16px`, `gap: 8px`).

There are no `--spacing-*`, `--font-size-*`, `--radius-*`, `--icon-*`, or `--avatar-*`
tokens. Do not reintroduce them.

### Token consumption rules

**Always use tokens for:**
- Colors (background, color, border, fill, stroke) — never literal hex
- Elevation shadows — `var(--shadow)` used directly (the token is already translucent; never `color-mix` it down to a percentage)

Tokens are **colors only** (plus the `--shadow` color).

**Use literal values for:**
- All sizing — spacing, font sizes, border radii, icon/avatar sizes — write the literal `px`.
- Component layout dimensions (`min-height`, `height`, `width` on buttons, inputs, rows, etc.). These describe one component's box, not a shared scale.
- One-off geometry (an offset, a stroke width, a clip rectangle) — write the literal.

If a needed colour isn't a token, propose a new semantic token or derive from existing
tokens. Custom one-off **color** values are a code smell — surface in review. Literal
**sizing** values are expected and fine.

## Global SCSS Scope

`src/app/tokens.scss`:
- ONLY: `:root` block with all CSS custom properties (tokens)
- No selectors, no element styles

`src/app/app.scss`:
- ONLY: html / body / root resets, base font, css resets, and global cross-cutting behavior (e.g., view-transition pseudo-elements)
- NEVER: element-specific styling (no `button`, `input`, `a`, `h1`, etc.) — those belong in component SCSS modules
- NEVER: `prefers-color-scheme` media queries — theme is controlled via a `[data-theme="..."]` attribute on the root element

## Design System Reuse

Before authoring a custom frame or component:
- Audit `shared/ui/` for existing primitives (e.g., `ScreenTopBar`, `Input`, `ButtonPrimary`)
- Extend the DS rather than fork — if a primitive is missing a feature, add it to the primitive
- Don't copy Figma helper primitives wholesale — build only meaningful UI atoms

## Touch Targets

- Tap targets ≥44 px (mobile-shaped UI; runs on Tauri desktop shell with both touch and mouse)
- Default to `min-height: 55px` (literal) for actionable rows, inputs, and primary buttons — comfortable above the 44 px minimum and matches the Pencil design grid. Don't tokenize this value; each component declares its own `min-height` directly.

## Viewport Units

For full-viewport heights, prefer the **dynamic viewport units** over the legacy `vh` / `vw`:

- `100svh` — small viewport height, the safe minimum (URL bar visible). Use this for full-screen layouts that should NEVER overflow on mobile.
- `100dvh` — dynamic viewport height, adjusts as the URL bar shows/hides. Use sparingly — causes layout shift during scroll.
- `100lvh` — large viewport height, equivalent to legacy `100vh` (URL bar hidden).
- `100vh` — **avoid** for full-screen layouts; cuts off content when the mobile URL bar is visible.

Tauri desktop has no URL bar so all variants behave identically there, but `svh` is forward-compatible with Tauri's iOS/Android backends.

Default rule: use `100svh` for splash screens, modals, and full-viewport overlays. Use `100vw` for width unless horizontal scrollbar collisions become an issue (then `100svw`).

## Forbidden

- Hardcoded hex colors in component styles → use semantic color tokens
- Reintroducing any sizing token (`--spacing-*`, `--font-size-*`, `--radius-*`, `--icon-*`, `--avatar-*`) → write the literal `px`; tokens are colors only
- `color-mix(... var(--shadow) N% ...)` → the shadow token is already translucent; use `var(--shadow)` directly
- Literal color names in tokens (`--yellow`, `--green`) → use semantic names
- Catch-all dimension tokens that span unrelated components (`--component-height`, `--input-and-button-height`) → declare the literal `min-height` per component
- Element-level styling in `app.scss` → use component modules
