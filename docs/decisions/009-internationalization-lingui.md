# 009. Internationalization: Lingui with client-detected locale and `x-locale` transport

**Date:** 2026-07-02
**Status:** accepted

## Context

The application must support three languages — Russian (`ru`), Kazakh (`kk`), and English (`en`) — with `ru` as the fallback. Static UI copy needs translation now; server-supplied content (events, announcements) is out of scope for this iteration, but the server must already be locale-aware so error messages are localized and content localization is a later increment.

Constraints shaping the decision:

- **Stack:** React with Vite and `@vitejs/plugin-react` (Babel path), TypeScript strict (no `as`/`!`), tRPC over `httpBatchLink`.
- **Deployment:** web on GitHub Pages, API on Cloud Run (`run.app`) — cross-origin, so any custom request header must be CORS-allowed. A Tauri desktop shell exists today and Tauri mobile (Android) is a plausible future target, so the frontend runs inside webviews.
- **Project ethos:** fewer dependencies, minimal config, no build-magic without payoff.
- No external translators and no PO-based translation-vendor workflow — developers author the catalogs.

Two questions need deciding: **which translation layer**, and **how the locale is detected, persisted, and transported to the API**.

## Options Considered

### Option 1: Lightweight custom `useTranslation` hook

- **Pros:** Zero dependencies; fully typed keys; no build plugin.
- **Cons:** Re-implements pluralization, interpolation, catalog compilation, and lazy loading by hand; grows into a bespoke i18n library the team must maintain.

### Option 2: FormatJS / react-intl

- **Pros:** Industry standard, huge ecosystem, no build plugin required (runtime library); full ICU.
- **Cons:** Verbose call sites (`<FormattedMessage id defaultMessage values>`); ICU parsed at runtime (larger runtime weight); message merge is manual.

### Option 3: Lingui (chosen)

- **Pros:** Concise macro API (`<Trans>текст</Trans>`, `` t`Hello ${name}` `` via `useLingui`); catalogs **compiled to JS functions** (smaller bundle, no runtime ICU parser); CLI does extract + merge + compile + `--strict` validation (CI gate); official `@lingui/vite-plugin`.
- **Cons:** Requires a macro plugin at build time (`@lingui/babel-plugin-lingui-macro`). Mitigated because `@vitejs/plugin-react` already runs Babel — the macro is one plugin added to an existing pipeline, not a new toolchain.

## Decision

Adopt **Lingui** as the translation layer. The Babel-macro cost — the only real objection — is nullified by the existing `@vitejs/plugin-react` Babel path, leaving Lingui's concise DX, compiled catalogs, and built-in extract/compile/validate tooling as net wins over both a hand-rolled hook and react-intl.

The surrounding locale architecture:

- **Source of truth is the client.** On first launch, `navigator.language` is mapped to a supported code (fallback `ru`) and persisted in `localStorage`; thereafter `localStorage` wins. The locale is **not** stored on the resident profile — it needs no server round-trip and works before authentication (onboarding).
- **No switcher UI** this iteration — the locale is auto-detected.
- **Catalogs are lazy** — only the active locale's compiled catalog loads; non-active locales are code-split out of the initial chunk.
- **Transport via a custom `x-locale` header** on every tRPC request (merged into the existing `httpBatchLink` `headers`). Chosen over `Accept-Language` because `Accept-Language` is a [forbidden header name](https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name) — webview/browser `fetch` cannot set it, so it could never carry an app-selected locale that differs from the system one (critical once a switcher returns, and for Tauri/Android webviews). `x-locale` also carries an exact `ru`/`kk`/`en` value with no `q`-weight parsing. It is added to the API's CORS `Access-Control-Allow-Headers` alongside the existing `authorization`.
- **Server locale-awareness:** `createContext` reads `x-locale` into `ctx.locale` (fallback `ru`); user-facing error messages are resolved through a **server-side message map keyed by locale** (mirrors the client catalog approach; keeps the i18n runtime off the API).

## Consequences

### Positive

- Concise, readable call sites; compiled catalogs keep the runtime and bundle small.
- `lingui compile --strict` gives a CI gate against missing/empty translations.
- Client-owned locale needs no API persistence and works pre-auth.
- `x-locale` is portable across web, Tauri desktop, and Tauri/Android webviews, and survives a future switcher; the server is already locale-aware for content localization later.

### Negative

- A Babel macro plugin is now part of the web build (low cost given Babel is already present).
- Locale correctness depends on the client sending `x-locale`; a client that omits it gets `ru` regardless of intent.
- Two parallel message stores (Lingui catalogs on the client, a small message map on the API) must be kept coherent for shared error strings.

### Neutral

- `kk` is the internal / `Intl` code; "KZ" is display-only (unused this iteration, no switcher).
- Server content (events, announcements) stays in its stored language until a future increment consumes `ctx.locale`.
- Superset relationship with ADR 001 (state boundaries): locale is client UI state in `localStorage`, consistent with the Zustand / UI-state boundary rather than server or navigation state.
