# Content Translation

## Problem and Goal

The interface is fully localized (see `docs/features/i18n/prd.md`), but resident-generated
content — post and issue titles and descriptions, comments — is stored and displayed in the
single language its author wrote it in (predominantly Russian). A Kazakh- or English-speaking
resident reads a localized shell framing untranslated content.

The goal is content that reads in the resident's language. Posts and issues are translated
automatically by an AI model into the other supported languages shortly after publication and
served already localized; comments are translated on demand. Search matches titles in any
supported language. The original text always remains available to the reader.

**Pinned terminology** (used across PRD, AC, and code):

- **source language** — the language a document's text was written in, recorded on the document.
- **target locales** — the supported locales other than the source language.
- **translation** — the AI-produced text for one target locale, stored on the document.
- **show original** — the reader-facing toggle between the translation and the stored original.

Supported locales are the three from the i18n feature: `ru`, `kk`, `en`.

## Users

- **Kazakh-speaking residents** — read feeds, issue threads, and comments in Kazakh.
- **English-speaking residents** (expats, tenants) — read the same content in English.
- **Russian-speaking residents** — read Russian originals and translations of kk/en content.

## Scope

### What's included

- **Automatic translation of posts and issues** — `title` and `description` are translated into
  the two target locales asynchronously after creation and after any edit that changes them.
  Publication and editing are never blocked or slowed by translation; until a translation is
  available, readers see the original.
- **Source-language detection** — each post, issue, and comment records its source language.
  At creation it is assumed to be the author's active locale; the AI model's detection during
  translation is authoritative and corrects the recorded value.
- **Localized delivery** — list and detail queries return `title`/`description` in the
  requester's active locale (`x-locale`). When the requested locale equals the source language,
  or the translation is not yet available, the stored original is returned. A translated
  response is flagged (`isTranslated`, `originalLang`) and carries the original text so the
  client can toggle without another request. Because the locale rides on the request header
  rather than the query key, a within-session change of the viewer's active locale (the profile
  language switcher) invalidates the cached content so posts and issues re-fetch and re-render in
  the newly chosen language rather than serving the previous locale's cached copy.
- **Translation indicator** — post and issue detail screens show a "translated from
  {language}" indicator with a show-original toggle. Feed and list cards show the translated
  text without an indicator.
- **On-demand comment translation** — comments display their original text. A "Translate"
  action appears on a comment whose recorded source language differs from the viewer's locale;
  tapping it shows the translation and a show-original toggle. The result is cached on the
  comment, so every later viewer of that locale gets it instantly. The detection performed
  during translation corrects the comment's recorded source language.
- **Cross-language search** — search keywords are built from the title in every available
  language (original plus translations), so a query in any supported locale matches regardless
  of the source language. Issue-number search is unaffected.
- **Backfill** — a one-off script translates all existing posts and issues at rollout.

### What's NOT included

- **Admin-seeded content** — `events` feed entries and `service-contacts` stay in their stored
  language; their translations, when needed, are supplied at seed time by the seeding scripts.
- **Manual editing or correction of machine translations.**
- **Locales beyond `ru`, `kk`, `en`.**
- **Automatic translation of comments at creation** — comments are translated on demand only.
- **Live update of already-rendered screens when a translation lands** — the translation
  appears on the next data fetch (normal TanStack Query refetch behavior).
- **Translating author names, tags, or status labels** — status and tag labels are static UI
  strings already localized by the i18n feature.

## User Journey

A resident using the app in Kazakh opens the announcements feed. Posts written in Russian
appear with Kazakh titles and descriptions. Opening a post, they see the full text in Kazakh
with a small "translated from Russian" indicator; tapping it reveals the stored original,
tapping again returns to the translation. In an issue thread, a Russian comment shows a
"Translate" action; the resident taps it and reads the comment in Kazakh, with the option to
show the original. They search the feed with a Kazakh word — a Russian-authored post whose
translated title contains that word appears in the results. When they publish their own post in
Kazakh, it appears in the feed immediately; within a minute, Russian- and English-speaking
neighbours see it in their languages.

## Success Metrics

- A resident whose locale differs from a document's source language sees the document's title
  and description in their locale in lists and detail views once translation completes.
- The show-original toggle displays the exact stored original text and toggles back.
- The comment "Translate" action shows the comment in the viewer's locale; the cached result is
  served to subsequent viewers without a new AI call.
- A title search in any supported locale finds the document regardless of its source language.
- Creation and edit latency of posts, issues, and comments is unchanged by this feature.
- A translation failure never blocks or breaks display — the reader sees the original.

## Non-functional Requirements

- **Translation freshness** — a post/issue translation is available within 60 seconds of the
  write under normal operation; an on-demand comment translation responds within 10 seconds.
- **No duplicate work** — each version of a document's source text is translated at most once
  per target locale; an edit that does not change the source text does not retranslate.
- **Privacy** — only the content text (title, description, comment text) is sent to the AI
  provider; author identity (name, phone, apartment) and other metadata are never included.
- **Mobile-only** — no keyboard-accessibility work for the indicator, toggle, or translate
  action (per project scope limits); tap targets follow the styling rules.

## Dependencies

- **i18n feature** — locale selection, the `x-locale` request header, and `ctx.locale` on the
  API (`docs/features/i18n/prd.md`, ADR 009, ADR 011).
- **Anthropic API** — the translation model; the API key is provisioned as a secret of the
  Cloud Functions runtime. Model choice and call shape are recorded in ADR 012.
- **Cloud Functions v2** — Firestore-triggered background processing in `europe-west1`
  alongside the existing `api` function.
- **Existing search infrastructure** — `tokenize`/`searchPrefixes`
  (`packages/shared/src/utilities/tokenize.ts`), the `keywords` field, and the composite
  indexes in `firestore.indexes.json`.
- **ADR 012** — `docs/decisions/012-content-translation-embedded-map-llm.md` records the
  storage shape, translation pipeline, and provider choice.

## Open Questions

None — all architecture decisions are recorded in ADR 012.
