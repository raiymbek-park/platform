# 012. Content translation: embedded translations map, async Firestore trigger, LLM provider

**Date:** 2026-07-10
**Status:** accepted

## Context

Resident-generated content (post/issue `title` + `description`, comment `text`) is stored as
single-language free text; the UI is localized (`ru`/`kk`/`en`, ADR 009/011) and the API already
knows each request's locale via `ctx.locale`. The content-translation feature
(`docs/features/content-translation/prd.md`) requires automatic translation of posts and
issues, on-demand translation of comments, cross-language title search, and a show-original
toggle.

Constraints shaping the decision:

- **Firestore Native** behind a tRPC API; feed pages read 20 documents per request, so any
  per-document extra read multiplies directly into page latency and cost.
- **Texts are small** (titles ≤ ~100 chars, descriptions/comments ≤ a few KB) and there are
  exactly three locales — far below the 1 MB document limit even with all translations embedded.
- **Kazakh is a low-resource language** for classical NMT; the platform's domain vocabulary is
  residential-complex specific (КСК, паркинг, мусоропровод), which benefits from prompt-level
  glossary control.
- **Search** is a prefix-keyword `array-contains-any` scheme built from titles
  (`packages/shared/src/utilities/tokenize.ts`); the issues keyword builder already accepts
  multiple titles (`buildKeywords({number, titles})`).
- Cloud Functions v2 already hosts the API in `europe-west1`; Firestore triggers are available
  in the same codebase.

Three questions need deciding: **where translations live**, **when and how they are produced**,
and **which provider translates**.

## Options Considered

### Storage

#### Option 1: Per-locale field maps (`title: {ru, kk, en}`)

- **Pros:** Uniform shape; no "original vs translation" asymmetry.
- **Cons:** Breaking migration of every document, every reader, keyword builders, and seed
  scripts; loses the notion of an authored original (the show-original toggle needs it);
  zod schemas and optimistic overlays all change shape.

#### Option 2: `translations/{locale}` subcollection

- **Pros:** Unbounded growth headroom; per-locale writes never touch the parent document.
- **Cons:** +20 reads per feed page per locale (or a fan-in join in the API); translations
  arrive in a separate snapshot so list projection becomes async and racy; overkill for
  three locales of small text.

#### Option 3 (chosen): Embedded `translations` map + `lang` + `translatedRev`

```ts
type Post = {
  title: string                    // original as authored
  description: string
  lang: 'ru' | 'kk' | 'en'         // source language (detected)
  translations?: {
    [locale]: { title: string; description: string }
  }
  translatedRev?: string           // hash of the source text the translations were made from
}
```

- **Pros:** Non-breaking — existing documents stay valid, old readers keep working; the whole
  localized document arrives in **one read**; original remains the source of truth;
  `translatedRev` makes staleness detection and trigger-loop prevention trivial.
- **Cons:** Document writes for translations rewrite the parent doc (acceptable at this write
  volume); adding many locales later would bloat documents (not planned).

### Pipeline

#### Option 1: Synchronous translation inside the create/update mutation

- **Pros:** No extra infrastructure; translation atomically consistent with the write.
- **Cons:** Adds seconds of LLM latency to every publish; couples publish availability to the
  AI provider; retries block the user.

#### Option 2: Cloud Tasks queue

- **Pros:** Explicit retry policy, rate control.
- **Cons:** A new piece of infrastructure (queue, handler endpoint, IAM) for a volume that a
  trigger handles; no consumer-visible benefit at this scale.

#### Option 3 (chosen): Firestore `onDocumentWritten` trigger + hash guard

A Cloud Functions v2 trigger on `posts/{id}` and `issues/{id}` compares the hash of the current
source fields with `translatedRev`; on mismatch it calls the provider, writes
`translations` + `lang` + `translatedRev`, and rebuilds `keywords` from all titles. The hash
equality on the trigger's own write prevents self-trigger loops and duplicate translation of
unchanged text.

- **Pros:** Publish latency untouched; covers every write path (mutations, seeds, backfill,
  future admin tools) without per-endpoint wiring; Functions' built-in retry covers transient
  provider failures.
- **Cons:** A window (seconds) where other-locale readers see the original — accepted by the
  PRD; local development needs the Firestore emulator to exercise the trigger.

**Comments are translated lazily instead** — via a `comments.translate` tRPC mutation that
translates on first request per locale and caches the result in the comment's `translations`
map (same storage shape). Rationale: comments are a long tail that is mostly never read in
another locale; eager translation would spend most calls on text nobody requests. The mutation
also corrects the comment's `lang` from the model's detection.

### Provider

#### Option 1: Google Cloud Translation API

- **Pros:** Purpose-built NMT, per-character pricing, same GCP project.
- **Cons:** Noticeably weaker on Kazakh (low-resource for NMT); glossary support exists but is
  rigid; no language-detection + multi-target + JSON in a single call.

#### Option 2: DeepL

- **Pros:** Best-in-class quality for its supported pairs.
- **Cons:** **No Kazakh support** — disqualifying.

#### Option 3 (chosen): LLM — Claude Haiku 4.5 (`claude-haiku-4-5`)

One structured-output call per document returns the detected source language plus both target
translations as validated JSON. The prompt pins the domain glossary (residential-complex
terminology in all three languages) and tone. Pricing $1/$5 per MTok makes a typical post
(~1 KB) cost fractions of a cent; at current UGC volume the monthly spend is negligible. The
backfill script uses the Batch API (50% discount, latency-insensitive).

- **Pros:** Strong Kazakh quality (LLMs outperform NMT on low-resource pairs); glossary and
  register control in the prompt; detection + both targets in one call; one vendor secret.
- **Cons:** LLM latency (seconds) — irrelevant off the write path; occasional hallucinated
  phrasing — mitigated by the show-original toggle being always available.

## Decision

Store translations as an **embedded `translations` map** on posts, issues, and comments, with
`lang` (detected source language) and `translatedRev` (source-text hash). Produce post/issue
translations **asynchronously in a Firestore `onDocumentWritten` trigger** guarded by the hash;
translate comments **on demand** via `comments.translate` with caching. Translate with
**Claude Haiku 4.5** through a single structured-output call that also detects the source
language. Serve localized content through a server-side projection that substitutes the
requested locale's translation and flags `isTranslated`/`originalLang` alongside the original
text; rebuild `keywords` from all available titles so search works across languages.

## Consequences

### Positive

- No data migration; every existing document and reader keeps working from day one.
- Localized feeds cost exactly the same reads as today — one document per item.
- Search matches titles in any supported locale regardless of authoring language.
- Publish/edit latency is unchanged; provider outages degrade to "original shown", never to
  failed writes.
- `translatedRev` gives idempotency: each source-text version is translated at most once per
  target locale.

### Negative

- A brief original-language window after create/edit (bounded by the PRD's 60-second NFR).
- Display text now has two sources (original fields + `translations` map) reconciled only by
  the server-side projection — clients must never read the raw map directly.
- Content text leaves GCP for the AI provider (author identity and metadata are excluded —
  PRD privacy NFR); a new secret (Anthropic API key) lives in the Functions runtime.
- Local development of the trigger requires the Firestore emulator (Java 21+, as with the
  existing emulator setup).

### Neutral

- Comment threads stay language-mixed until a reader taps "Translate" — consistent with
  social-app conventions.
- Admin-seeded `events`/`service-contacts` are out of scope; their translations, when needed,
  are written by the seed scripts using the same embedded-map shape.
- Relationship to ADR 001 (state boundaries): translations are server truth delivered through
  the query layer; the show-original toggle is ephemeral UI state and never duplicates the
  texts into a store.
