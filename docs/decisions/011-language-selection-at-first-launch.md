# 011. Language selection at first launch with a browser-derived default

**Date:** 2026-07-07
**Status:** accepted (supersedes the "no switcher UI" decision of ADR 009)

## Context

ADR 009 established the i18n stack (Lingui, `x-locale` transport, per-device persistence) and, as a
deliberate first-iteration simplification, chose to **auto-detect** the locale from
`navigator.language` with **no switcher UI** — the resident never picked a language.

Product now requires the resident to **choose** their language explicitly on first launch. A
resident's browser/system language is not always the language they want to read the app in (shared
devices, expats, mixed Kazakh/Russian households), so the app must ask once, offering the detected
browser language as the pre-selected default to keep it a single tap for the common case. This
reverses only the "no switcher" stance of ADR 009; everything else in ADR 009 (Lingui, compiled
catalogs, lazy loading, `x-locale`, server locale-awareness, per-device persistence) stands.

The `onboarding` design (`design/onboarding-screen.pen`) carries a "Select Language" screen as the
first onboarding step, ahead of the registration form.

## Decision

Add a **language-selection screen** as the first onboarding step, shown once until a choice is made.

The bootstrap and routing model:

- **Bootstrap no longer persists on detection.** On launch the app reads the persisted **choice**
  from `localStorage`. If a choice exists, it is activated and used. If none exists, the browser
  language is resolved to a supported locale (fallback `ru`) and **activated for immediate rendering**
  — so the selection screen itself is already localized — but is **not persisted**.
- **The selection screen is shown only when no choice is persisted.** It pre-selects the
  browser-derived locale. The resident confirms it or picks another of the three languages and taps
  "Далее"; that activates the chosen locale, **persists it** (same `localStorage` key), and continues
  to the registration form.
- **Later launches** read the persisted choice, skip the selection screen, and render in it.

Persistence stays **per-device** (unchanged from ADR 009). The transport (`x-locale`) and the Lingui
runtime are unchanged. The screen lives in the onboarding flow but the capability belongs to the i18n
feature.

## Consequences

### Positive

- The resident controls the interface language; the browser default keeps it one tap for the common
  case.
- No new persistence layer — the existing `localStorage` locale key now records a *choice* rather than
  a *detection*.
- The selection screen renders already-localized because the detected locale is activated before it
  paints (preserves ADR 009's "no flash of untranslated content").

### Negative

- Bootstrap behavior changes subtly: detection no longer writes to `localStorage`, so "a locale is
  stored" now means "the resident has chosen", not "the app has detected". Any code that inferred a
  choice from the mere presence of the stored key must account for this.
- One extra step on first launch before registration.

### Neutral

- A post-onboarding / profile language switcher remains **out of scope** (deferred) — the choice is
  made once at first launch.
- ADR 009's remaining decisions (Lingui, `x-locale`, server locale-awareness, per-device persistence,
  `kk` internal code / "KZ" display) are unaffected.
