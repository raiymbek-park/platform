# Design System — Shared Tokens, Primitives & Screen Composition

## Problem and Goal

«Raiymbek Park» renders every developed screen from one shared visual foundation: a
token layer plus a set of reusable UI primitives. The foundation must match the
canonical design source (`design/design-system.lib.pen`) exactly, so the app's colors,
component shapes, and screen layouts are the design as authored — not a drifted copy.

The foundation meets this with two layers kept in lockstep with the `.pen` library:

- A **token layer** (`apps/web/src/app/tokens.scss`) that declares **only** what the
  design treats as shared and theme-bound: semantic **colors** (nothing else). Every
  dimension — spacing, font sizes, radii, icon and avatar sizes — is a literal value in
  each component's SCSS, because the design authors them as raw per-component
  measurements rather than a shared scale.
- A **primitive layer** (`packages/ui`) of reusable components that consume those color
  tokens and literal dimensions, and expose the visual states the design defines
  (default / pressed / disabled / selected / error / success, etc.).

The app's developed screens (`home`, `onboarding`) compose exclusively from these
primitives, so a change to a token or a primitive propagates to every screen without
per-screen edits.

## Users

- **Residents** — see a visually consistent app: the same greens, greys, danger reds,
  and spacing rhythm on every developed screen, matching the design source.
- **The development team** — build screens by composing `packages/ui` primitives and
  referencing color tokens; they never hand-pick hex values or fork a primitive's layout.
  A single token or primitive edit restyles the whole app.

## Scope

### What's included

- **Semantic color tokens** in `apps/web/src/app/tokens.scss`, one CSS custom property
  per role, values matching the `.pen` library `variables` block:
  - Surfaces & structure: `--surface` `#ffffff`, `--background` `#f4f3f8`,
    `--disabled-surface` `#e3e5e8`, `--muted-surface` `#d4d8dd`, `--border` `#e0e3e6`,
    `--shadow` `#181c2114`, `--scrim` `#181c2180`
  - Text: `--foreground` `#181b1f`, `--text-secondary` `#494c52`, `--text-muted` `#787b80`,
    `--inactive` `#a0a4ad` (inactive icons — nav-item default, ServiceCard chevron)
  - Brand: `--brand` `#76bf54`, `--brand-soft` `#eaf3e1`, `--brand-subtle` `#d7eac6`,
    `--brand-text` `#65a348`
  - Action / info: `--action` `#4fa0dc`, `--action-strong` `#3e84be`, `--info` `#4e88e6`,
    `--info-soft` `#d6e8ff`
  - Accent: `--accent` `#9b6fc4`, `--accent-soft` `#ecdcf6`
  - Status: `--danger` `#e85d48`, `--danger-soft` `#fbe3e3`, `--warning` `#b88a00`,
    `--warning-soft` `#ffedc4`, `--warning-accent` `#ebb23f`
- **No numeric tokens.** Every dimension — spacing, font sizes, border radii, icon sizes,
  avatar sizes — is written as a literal `px` value in the component SCSS module that
  needs it, taken from the design.
- **Reusable primitives in `packages/ui`** that already exist in code, restyled to the
  `.pen` library definitions (colors via tokens, dimensions literal, and the states the
  library defines): `button`, `input`, `action-card`, `announce-card`, `block-card`,
  `contact-card`, `content`, `divider`, `hero-card`, `hero-image`, `icon`, `icon-chip`,
  `info-callout`, `location-badge`, `nav-item`, `screen-footer`, `screen-header`,
  `section-header`, `select-option`.
- **Developed screens composed from the primitives**, restyled by the refreshed tokens
  and primitives: the `home` page (`building-hero`, `welcome-feed`, `services-section`,
  `contacts-section`) and the `onboarding` flow (`welcome`, `registration-form`,
  `otp-verification`, `account-locked`) plus the `bottom-nav` widget.
- **The styling rule of record.** `.claude/rules/styling.md` states the token policy the
  code follows: tokens are colors only; all sizing is literal.

### What's NOT included

- **Design-only components with no code counterpart.** The `.pen` library defines
  components for screens that are not built in the app — posts (`PostCard`, `ReactionBar`,
  `Gallery`, `Like*`/`Dislike*`, `Review*`), chat (`Message*`), tasks/statuses
  (`Status*`, `FilterTab*`), tags (`Tag*`), user profile (`Avatar*`, `AvatarUpload*`,
  `ImageForm*`), and misc (`CreateFab`, `PopupMenu`, `AddLink`, `Spacer`). These are not
  implemented here.
- **New screens.** `posts`, `tasks`, and `user-profile` are out of scope; only `home` and
  `onboarding` are reconciled.
- **Dark theme / theme switching.** Tokens are semantic and theme-ready, but only the
  single light palette above is defined.
- **Behavioral change.** Screen behavior, data flow, routing, and auth are owned by their
  own features (`home`, `onboarding`, `infrastructure`); this foundation governs visuals
  only.
- **A component library published outside the monorepo.**

## User Journey

A developer building or adjusting a developed screen imports primitives from
`packages/ui` and composes them; the primitives already carry the correct colors, spacing
rhythm, and literal dimensions from the design. When a color needs to change app-wide,
the developer edits one token in `tokens.scss`; every primitive and screen that references
that role updates. When a primitive's shape changes, the developer edits it once in
`packages/ui`; every screen that composes it reflects the change. A resident opening the
`home` or `onboarding` screens sees the design source rendered faithfully — the same
palette and spacing the design defines.

## Success Metrics

- Every color token in `tokens.scss` equals the value of the corresponding `.pen` library
  variable; no component SCSS declares a literal hex color.
- No numeric token exists (`tokens.scss` holds colors only); no `--spacing-*`,
  `--font-size-*`, `--radius-*`, `--icon-*`, or `--avatar-*` token exists, and component
  SCSS declares every dimension as a literal.
- Each developed primitive renders the states its `.pen` counterpart defines
  (default / pressed / disabled / selected / error / success as applicable).
- The `home` and `onboarding` screens render with the refreshed palette and spacing and
  compose only from `packages/ui` primitives.
- `.claude/rules/styling.md` describes the token policy the code implements — the rule and
  the code agree.

## Non-functional Requirements

- **Consistency** — a single token or primitive edit restyles all consumers; no screen
  hard-codes colors or forks a primitive's layout.
- **Mobile-first** — primitives keep touch targets ≥ 44px and the project's
  `min-height: 55px` default for actionable rows, inputs, and primary buttons.
- **Semantic tokens only** — color properties reference semantic tokens, never literal
  hex, so the palette stays theme-ready.
- **No dead tokens** — retired tokens are removed, not left unused (fallow reports unused
  CSS custom properties).
- **Compatibility** — mobile-shaped web on the Tauri shell; no manual keyboard-a11y work.

## Dependencies

- **`design/design-system.lib.pen`** — the canonical source of tokens, primitive shapes,
  and states.
- **`design/home-screen.pen`, `design/onboarding-screen.pen`** — the composition source
  for the two developed screens.
- **`packages/shared`** — `pickCss` / `cssVariables` / `joinCss` for stateful class
  composition against the primitives' state classes.
- **`apps/web`** — consumes the tokens (imported once in `app/app.tsx`) and the primitives.

## Open Questions

- None.
