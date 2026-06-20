# HTML Semantics

## Scope

These rules apply to all JSX/HTML in the repository — `apps/`, `packages/`, and any component code.

## Core Principle

Prefer semantic HTML5 elements over generic `<div>`/`<span>`. Each semantic tag carries a built-in role, default behavior, and assistive-tech support that ARIA can only approximate. Native elements are also smaller (less markup, less JS) and more correct out of the box.

The rule is **"default to the specific tag, fall back to `<div>` knowingly"** — not "never use `<div>`".

## Decision Matrix

Use the first row that fits before falling back to `<div>`:

| Intent | Tag | Notes |
|--------|-----|-------|
| Page mount point | `<main id="root">` | One per page; lives in `index.html` |
| Screen / route container | `<section>` | One per screen, inside `<main>` |
| Screen header (back, title, step indicator) | `<header>` | Inside `<section>` |
| Screen footer (sticky CTA) | `<footer>` | Inside `<section>` |
| Real navigation (tab bar, breadcrumbs) | `<nav>` | NOT for back buttons or progress indicators |
| Tangential / drawer | `<aside>` | Mobile drawers, contextual help |
| Input flow | `<form>` | Wraps inputs; gets free Enter-to-submit |
| Group of related form controls (radio set, checkbox set, address block) | `<fieldset>` + `<legend>` | NOT `<div role="radiogroup">` |
| Clickable action | `<button type="button">` | NEVER `<div onClick>` |
| Internal/external link | `<a>` (or router `<Link>`) | NEVER `<div onClick>` for navigation |
| Form input | `<input>`, `<select>`, `<textarea>` | Native first; custom is a last resort |
| Modal / popover | `<dialog>` + `.showModal()` | Free backdrop, ESC dismissal, focus trap |
| Collapsible region | `<details>` / `<summary>` | No JS needed for show/hide |
| Image with caption | `<figure>` + `<figcaption>` | |
| Image (responsive / format negotiation) | `<picture>` | AVIF/WebP fallbacks |
| Time / date | `<time datetime="...">` | Machine-readable; AT-friendly |
| Progress | `<progress>` | Indeterminate without `value` |
| Gauge with min/max/optimum | `<meter>` | Distinct from progress |
| Headings | `<h1>` – `<h6>` | Don't substitute styled `<div>`/`<span>` |
| Paragraph text | `<p>` | Block-level prose |
| Computed result of a form | `<output>` | Paired with form inputs |
| Inline text run | `<span>` | Inline only |
| Generic fallback | `<div>` | Only when no semantic tag fits |

## Built-in Elements That Get Re-implemented

These are commonly rebuilt with `<div>` + JS or third-party libraries when the native version IS one element:

- **`<dialog>`** — modal with backdrop pseudo (`::backdrop`), ESC dismissal, focus trap. Open via `.showModal()`. Replaces most modal libraries.
- **`<details>` / `<summary>`** — accordion / disclosure widget with zero JavaScript. Auto-toggles `open` attribute.
- **`<datalist>`** — autocomplete suggestions on a plain `<input list="...">`. No combobox library needed.
- **`<fieldset>` + `<legend>`** — semantic grouping for radio / checkbox sets and related field clusters. Replaces `<div role="radiogroup">`/`<div role="group">` patterns. Bonus: `<fieldset disabled>` cascades to every child input (no per-input `disabled`).
- **`<output for="...">`** — result of a calculation/computation, paired with form inputs.
- **`<progress>` / `<meter>`** — progress bars and gauges with proper ARIA semantics built in.
- **`<picture>`** — responsive images and format negotiation (`<source srcset>` + `<img>` fallback).
- **`<abbr title="...">`** — abbreviation with hover expansion.

Reach for one of these before installing a library or wiring custom JS.

## Anti-patterns

```jsx
// ❌ Wrong role, no implicit a11y, no :focus-visible, no Enter-to-activate
<div onClick={handleClick}>Submit</div>

// ✅ Correct
<button type="button" onClick={handleClick}>Submit</button>
```

```jsx
// ❌ Re-implementing what <button> gives for free
<div role="button" tabIndex={0} onKeyDown={onEnter}>Click</div>

// ✅
<button type="button" onClick={handleClick}>Click</button>
```

```jsx
// ❌ Inside a <form>, button defaults to type="submit" and submits on Enter
<button onClick={handleClose}>Close</button>

// ✅ Always set type explicitly unless you mean to submit
<button type="button" onClick={handleClose}>Close</button>
```

```jsx
// ❌ Input without label — no AT name, no label-tap to focus
<input value={name} onChange={onChange} />

// ✅
<label>
  Name
  <input value={name} onChange={onChange} />
</label>
```

```jsx
// ❌ <span> used for block-level layout (it's inline by default)
<span className={css.row}>{children}</span>

// ✅ <div> for unstyled block, or a semantic block tag
<div className={css.row}>{children}</div>
```

```jsx
// ❌ Heading shaped as styled div
<div className={css.title}>Welcome</div>

// ✅
<h1 className={css.title}>Welcome</h1>
```

```jsx
// ❌ Custom dropdown when <select> covers the use case
<div className={css.dropdown}>{/* tens of lines… */}</div>

// ✅
<select value={lang} onChange={onChange}>
  {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
</select>
```

```jsx
// ❌ ARIA bridging when the native element exists
<div role="radiogroup" aria-label="UI language">
  {options.map(o => <RadioButton key={o.id} ... />)}
</div>

// ✅ Native semantic grouping. If the visible heading lives elsewhere
// (e.g., a Callout above), make the legend visually hidden via .sr-only —
// AT still announces it when a child radio receives focus.
<fieldset>
  <legend className="sr-only">UI language</legend>
  {options.map(o => <RadioButton key={o.id} ... />)}
</fieldset>
```

> Note on styling: `<fieldset>` ships with default `border` and `padding`, and `<legend>` renders a visible label that participates in the border cutout. Override these in your component module: `border: 0; padding: 0` on the fieldset, and use the global `.sr-only` utility (defined in `src/app/app.scss`) on the legend when no visible group label is needed.

## On Keyboard Support

This project does not require keyboard accessibility (mobile-only — see `.arcana/project-context.md` § Platform & Input Model). That rule is about **effort**: don't manually add `tabIndex` / `onKeyDown` / focus-ring styling to non-semantic elements.

It does NOT mean reject semantic tags that include keyboard support for free. Using `<button>`, `<dialog>`, `<details>` is still preferred over `<div onClick>` because the native semantics are correct, simpler, and have nothing to do with extra keyboard work.

## When `<div>` Is the Right Answer

`<div>` is correct when:
- The element has no semantic role — pure styling-only wrapper (e.g., a flex container that groups children but isn't itself a section/article/header/figure).
- A semantic tag would imply structure that doesn't exist — don't wrap two unrelated buttons in `<section>` just to flex-row them.
- The component is a low-level reusable primitive whose semantic role depends on the consumer (use prop spreading or pick the tag at the call site).

If you reach for the third nested `<div>` in a row, ask whether the outermost should be `<section>` / `<article>` / `<figure>` / `<header>` / `<footer>` first.

## Forbidden

- `<div>` / `<span>` with `onClick` for actions → use `<button type="button">`
- `<div>` / `<span>` with `onClick` for navigation → use `<a>` or the router's `<Link>`
- `<button>` inside `<form>` without `type` (defaults to submit) → always set `type="button"` unless submit is intended
- Custom modal libraries when `<dialog>` covers the use case
- Custom dropdowns when `<select>` covers the use case
- `<div role="radiogroup">` / `<div role="group">` when `<fieldset>` + `<legend>` covers the use case
- Headings styled out of `<div>` / `<span>` → use `<h1>`–`<h6>`
- Inputs without an associated `<label>`
- More than 3 nested `<div>` where a semantic tag would replace one
- Multiple `<main>` per page (HTML5 allows only one)
