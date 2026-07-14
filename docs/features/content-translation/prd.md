# Content Translation

## Problem and Goal

The interface is fully localized (see `docs/features/i18n/prd.md`), but resident-generated
content — post and issue titles and descriptions, comments — is stored and displayed in the
single language its author wrote it in (predominantly Russian). A Kazakh- or English-speaking
resident reads a localized shell framing untranslated content.

The goal is content that reads in the resident's language. Posts, issues, and comments are
translated automatically by an AI model into the other supported languages shortly after they
are written and served already localized. Search matches titles in any supported language. The
original text always remains available to the reader.

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
- **Translation indicator** — post and issue detail screens show a single inline show-original
  toggle ("Показать оригинальный текст" ↔ "Показать перевод"). It does not name the source
  language. Feed and list cards show the translated text without an indicator.
- **Automatic comment translation** — a comment's `text` is translated into the two target
  locales asynchronously after creation and after any edit that changes it, exactly like posts
  and issues (including the status-change comments managers leave on issues). A viewer whose
  locale differs from the comment's source language sees the translated text by default, with
  the same show-original toggle posts and issues use; the toggle swaps between the stored
  translation and the stored original without any request. Until a translation is available,
  the original is shown with no toggle. The detection performed during translation corrects
  the comment's recorded source language.
- **Cross-language search** — search keywords are built from the title in every available
  language (original plus translations), so a query in any supported locale matches regardless
  of the source language. Issue-number search is unaffected.
- **Backfill** — a one-off script translates all existing posts, issues, and comments at
  rollout. A comment written before automatic comment translation shipped is translated by the
  rollout backfill; any comment that somehow misses it still shows its original text until its
  next edit triggers a translation.

### What's NOT included

- **Admin-seeded content** — `service-contacts` stay in their stored language; their translations,
  when needed, are supplied at seed time by the seeding scripts. This does not cover the Home feed's
  events: an event about a new announcement or offer carries that post's own title, and an event
  about a newly opened issue carries that issue's own title — both are translated content and are
  read through this feature's projection like anywhere else (see
  `docs/features/push-notifications/prd.md` and `docs/features/home/prd.md`). An event about issue
  activity carries no title — only the issue's number and its new status — so nothing there is
  translated.
- **Manual editing or correction of machine translations.**
- **Locales beyond `ru`, `kk`, `en`.**
- **Live update of already-rendered screens when a translation lands** — the translation
  appears on the next data fetch (normal TanStack Query refetch behavior).
- **Translating author names, tags, or status labels** — status and tag labels are static UI
  strings already localized by the i18n feature.

## User Journey

A resident using the app in Kazakh opens the announcements feed. Posts written in Russian
appear with Kazakh titles and descriptions. Opening a post, they see the full text in Kazakh
with an inline "Показать оригинальный текст" toggle; tapping it reveals the stored original,
tapping again returns to the translation. In an issue thread, a comment written in Russian
reads in Kazakh with the same show-original toggle on the message, so the resident can check
the original wording at any time. They search the feed with a Kazakh word — a Russian-authored post whose
translated title contains that word appears in the results. When they publish their own post in
Kazakh, it appears in the feed immediately; within a minute, Russian- and English-speaking
neighbours see it in their languages.

## Success Metrics

- A resident whose locale differs from a document's source language sees the document's title
  and description in their locale in lists and detail views once translation completes.
- The show-original toggle displays the exact stored original text and toggles back.
- A comment whose source language differs from the viewer's locale reads in the viewer's locale
  once translation completes, with a working show-original toggle; the stored translation is
  served to every viewer without further AI calls.
- A title search in any supported locale finds the document regardless of its source language.
- Creation and edit latency of posts, issues, and comments is unchanged by this feature.
- A translation failure never blocks or breaks display — the reader sees the original.

## Non-functional Requirements

- **Translation freshness** — a post, issue, or comment translation is available within
  60 seconds of the write under normal operation.
- **No duplicate work** — each version of a document's source text is translated at most once
  per target locale; an edit that does not change the source text does not retranslate.
- **Privacy** — only the content text (title, description, comment text) is sent to the AI
  provider; author identity (name, phone, apartment) and other metadata are never included.
- **Mobile-only** — no keyboard-accessibility work for the indicator or toggle (per project
  scope limits); tap targets follow the styling rules.

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
