# Design System — Happy Path

## Scenario 1: Color tokens match the design source

  Given: `apps/web/src/app/tokens.scss` and `design/design-system.lib.pen`
  When:  each color token is compared to the library `variables` entry of the same role
  Then:  every color token's value equals the library value
         (`--brand` `#76bf54`, `--danger` `#e85d48`, `--warning` `#b88a00`,
          `--info` `#4e88e6`, `--action-strong` `#3e84be`, `--text-muted` `#787b80`,
          `--text-secondary` `#494c52`, `--foreground` `#181b1f`, `--border` `#e0e3e6`,
          `--brand-text` `#65a348`, `--shadow` `#181c2114`, `--scrim` `#181c2180`,
          `--disabled-surface` `#e3e5e8`)
         `--muted-surface` `#d4d8dd` and `--warning-accent` `#ebb23f` exist
         no token from the removed set remains (`--success`, `--link`, `--outline`,
          `--scrim-soft`, `--action-foreground`, `--disabled-foreground`)

## Scenario 2: Sizing is literal, not tokenized

  Given: `tokens.scss` after reconciliation
  When:  the `:root` block is inspected
  Then:  it declares color tokens only — no numeric token
         no `--spacing-*`, `--font-size-*`, `--radius-*`, `--icon-*`, or `--avatar-*`
          token is declared
         component SCSS modules declare every dimension (including the 16px base spacing)
          as literal `px` values

## Scenario 3: No hard-coded colors in components

  Given: every `*.module.scss` in `packages/ui` and `apps/web/src`
  When:  color properties (`color`, `background`, `fill`, `stroke`, `border` color) are scanned
  Then:  each references a semantic color token, not a literal hex
         no reference to a removed token name resolves to nothing

## Scenario 4: Primitives render their design states

  Given: the refreshed `packages/ui` primitives
  When:  a primitive that the library defines with multiple states is rendered
  Then:  `button` shows primary / secondary / danger / icon variants with
          default / pressed / disabled states
         `input` shows default / active / focus / disabled and error & success variants
         `nav-item` shows default and active states
         `block-card` shows default / selected / disabled
         `select-option`, `contact-card`, `action-card`, `info-callout` show the
          states their library counterparts define

## Scenario 5: Developed screens render on the refreshed foundation

  Given: the app running locally
  When:  the `onboarding` welcome, registration, OTP, and account-locked screens and the
          `home` screen (hero, welcome feed, services, contacts, bottom nav) are opened
  Then:  each renders with the refreshed palette and spacing
         each composes only from `packages/ui` primitives (no forked inline layout)
         layout matches the corresponding `.pen` screen composition

## Scenario 6: Styling rule matches the code

  Given: `.claude/rules/styling.md`
  When:  the sizing-token section is read
  Then:  it states that tokens are colors only and all sizing is literal
         it no longer mandates `--font-size-*`, `--radius-*`, `--icon-*`, `--avatar-*`,
          or non-base `--spacing-*` scales
