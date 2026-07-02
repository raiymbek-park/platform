# Internationalization (i18n)

## Problem and Goal

The application renders exclusively in Russian: every user-facing string is fixed in Russian and server error messages are single-language. Kazakh- and English-speaking residents cannot read the interface.

The goal is a multilingual application supporting **Russian**, **Kazakh**, and **English**: every static UI string appears in the resident's language; the language is detected automatically from the browser and remembered per device; and the backend is aware of each request's language so error messages (now) and server-supplied content (later) are returned in that language. Russian is the fallback for any unsupported browser language.

## Users

- **Kazakh-speaking residents** — operate the app in Kazakh.
- **English-speaking residents** (expats, tenants) — operate the app in English.
- **Russian-speaking residents** — the default audience; Russian remains the fallback.

## Scope

### What's included

- Three supported languages — **Russian**, **Kazakh** (displayed "KZ"), **English** — with Russian as the fallback.
- **Automatic language detection** from the browser on first launch, remembered per device thereafter.
- Every static UI string across the app presented in the active language.
- The backend receives the active language of each request and returns user-facing **error messages** in that language.

### What's NOT included

- **Language switcher UI** — the language is auto-detected and not user-selectable this iteration.
- **Translation of server-supplied content** (events, announcements, contacts) — it stays in its stored language; only the backend's awareness of the session language is established now, enabling content localization later.
- **Remembering the language on the resident's account** — it is remembered per device only.
- **Right-to-left layouts** — all three languages are left-to-right.

## User Journey

On first launch the app detects the browser language, resolves it to one of the three supported languages (falling back to Russian), remembers it for the device, and shows the whole interface in that language from the first screen — with no flash of the fallback language. On later launches the remembered language is used. Every request to the backend carries the active language; when the backend rejects a request, the error message is shown in the resident's language.

## Success Metrics

- No static UI string appears in a language other than the active one — a resident on Kazakh or English sees no Russian leakage on any covered screen.
- Every supported language has a complete set of translations — no missing or empty entries.
- A backend-rejected request returns an error message in the active language.

## Non-functional Requirements

- **No flash of untranslated or fallback content** on launch — the active language is ready before the first screen renders.
- Loading a language must not carry the other languages' translations into the initial load.
- **Mobile-only** — no keyboard-accessibility effort for any i18n concern.

## Dependencies

None external — builds on the existing web app and backend.

## Open Questions

None — all resolved during scoping. The library choice and the language-transport and backend-awareness design are recorded in `docs/decisions/009-internationalization-lingui.md`.
