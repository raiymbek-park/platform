# Posts — Community Feed, Private Ads, and Comments

## Problem and Goal

Residents of Raiymbek Park and the people who run the complex share news, notices, and
neighbour-to-neighbour listings in a general chat where content scrolls away and nothing can be
tracked or discussed in place. `Posts` is the app's single home for this member-generated content —
the overwhelming majority of it authored by residents — spanning two kinds under one feed: official
**announcements** from the management company, the complex, and the city, and private **offers**
(sell, rent, services, giveaways, wanted) from residents. Every post can be reacted to and discussed
in a threaded **comment** conversation.

This feature delivers the `/posts` feed and the full post lifecycle (author, edit, delete), reactions,
and a reusable comment thread wired to **both posts and issues**. It renames the placeholder
`announcements` route to the `posts` entity and refactors the issue card into a shared card system so
posts and issues are built from the same primitives.

`Post` is the canonical code identifier for this universal content entity; the Russian display label
for the section stays "Объявления" (the same relationship issues has between the code identifier
`issue` and the display label "Заявка").

Requirements:

- A `/posts` feed composed from the design system and wired to live data, with three filter tabs
  (All, Announcements, Private ads), text search, and infinite-scroll pagination — mirroring the
  issues feed.
- One `post` entity with a `kind` discriminator (`announcement` or `offer`); each kind has its own
  category set and its own create form.
- Post authoring, editing, and deletion, gated by role and ownership and enforced on the server.
- Like/dislike reactions on any post, applied optimistically.
- A threaded **comment** conversation on any post — and, through the same reusable thread, on any
  issue — with per-message author, media, and edit/delete of one's own message.
- A shared card system in `packages/ui/content-card`: presentational primitives composed by both
  `IssueCard` and a new `PostCard`.
- The bottom-nav "Объявления" tab and the home service cards target `/posts`.

## Users

Signed-in members of the community, holding a valid session (the existing `ensureResidentSession`
guard gates every `/posts` route, redirecting to `/onboarding` without one — onboarding then routes
to language selection or the welcome screen). Members act under
the five-role model already defined for issues:

- **Residents** — the default role for everyone. Read the feed, publish private offers, react, and
  comment.
- **Owners** — identical to Residents for this feature.
- **Managers** — additionally publish official announcements.
- **Administration** — publish announcements and moderate: edit or delete any post and any comment.
- **Viewers** — accounts downgraded from Resident; they read the feed and open comment threads but
  cannot create, react, or comment.

One member equals one profile (name, block, apartment, phone, role) derived from their session; an
absent or unrecognised role resolves to Resident.

## Roles and Permissions

Five roles. Permissions are enforced **on the server** for every action, not merely hidden in the
interface. Announcement authorship is reserved for staff; offer authorship is open to residents.

| Capability | Viewer | Resident | Owner | Manager | Administration |
|---|:--:|:--:|:--:|:--:|:--:|
| View the feed, expand a post, open its comments | ✓ | ✓ | ✓ | ✓ | ✓ |
| Publish a private **offer** | — | ✓ | ✓ | — | ✓ |
| Publish an official **announcement** | — | — | — | ✓ | ✓ |
| Edit or delete a post **you authored** | — | ✓ | ✓ | ✓ | ✓ |
| Edit or delete **any** post *(moderation)* | — | — | — | — | ✓ |
| Like / dislike any post | — | ✓ | ✓ | ✓ | ✓ |
| Write a comment on any post | — | ✓ | ✓ | ✓ | ✓ |
| Edit or delete a comment **you wrote** | — | ✓ | ✓ | ✓ | ✓ |
| Delete **any** comment *(moderation)* | — | — | — | — | ✓ |

A post has no status workflow, so — unlike an issue — its author may edit or delete it at any time; a
Manager who can publish announcements is an author for their own announcements only. Administration may
edit or delete any post and delete any comment as moderation.

The onboarding owner/tenant choice is stored only as a label and grants no elevated role; everyone is a
Resident until Administration assigns a higher role outside the app.

## Post Model

- **Kind** — `announcement` or `offer`. Fixed at creation; a post never changes kind.
- **Category** — exactly one, drawn from the kind's category set (see Content Kinds and Categories).
- **Title** (plain text) and **body** — the description, authored and stored as Markdown.
- **Media** — optional photos and/or videos.
- **Author** — name, block, apartment, and phone, taken from the signed-in profile at creation.
  Announcements additionally carry the authoring **source label** shown in place of a person
  (ЖК Raiymbek Park / Управляющая компания / Городское управление), derived from the category.
- **Reactions** — like and dislike counts, and the caller's own reaction.
- **Comment count** — the number of comments on the post.
- **Creation timestamp**.

A post has no sequential number (unlike an issue) and no status. The feed carries no tag filter — the
only feed axis is the kind tab.

**Author contact visibility.** An offer exists to be answered, so the author's contact — name, block,
apartment, and **phone** — is shown on the expanded offer card to every signed-in viewer. The offer
create/edit form carries a notice that the phone will be visible to everyone. An announcement shows
only its source label and the staff author's name; no personal phone is exposed for announcements. The
server includes the phone in the payload only for the audiences entitled to see it.

An author whose phone is **unverified** is the exception: their phone is never disclosed to another
resident, so their offer card carries name, block, and apartment and no phone, and the form tells them
their number will not be shown. See the `onboarding` PRD, Phone Provenance and Disclosure.

## Content Kinds and Categories

Each kind has a fixed category set. The category selects the card's leading icon and colour, and — for
offers — the coloured tag rendered on the card.

**Announcement categories** (kind `announcement`):

| Category id | Label | Source label on card | Icon / tone |
|---|---|---|---|
| `complex` | ЖК Raiymbek Park | ЖК Raiymbek Park | `building-2` / brand |
| `management` | Управляющая компания | Управляющая компания | `briefcase` / info |
| `city` | Городское управление | Городское управление | `landmark` / accent |
| `other` | Прочее | (author name) | `megaphone` / warning |

**Offer categories** (kind `offer`), each with a card tag:

| Category id | Label | Card tag | Icon / tone |
|---|---|---|---|
| `sell` | Продам | ПРОДАМ | `banknote` / info |
| `rent` | Сдам | СДАМ | `key-round` / accent |
| `services` | Услуги | УСЛУГИ | `handshake` / brand |
| `free` | Даром | ДАРОМ | `gift` / warning |
| `wanted` | Требуется | ТРЕБУЕТСЯ | `search` / accent |
| `other` | Прочее | ПРОЧЕЕ | `coffee` / warning |

## Feed, Filters, Search, Loading

Mirrors the issues feed mechanics.

- **Filter tabs** — **Все** (all posts), **Уведомления** (announcements only), **Частные объявления**
  (offers only). **Все** is active by default. The active tab lives in the URL search parameter
  `tab` (`all` | `announcements` | `offers`); components subscribe to it, never inventing parallel
  state.
- **Cards** — a post renders as a card composed from the shared card system: leading category icon,
  title, "date · author" line, body with expand/collapse, an offer's category tag, a reaction bar
  (like, dislike, comment count), and — when expanded — the author contact block and, for the author or
  Administration, edit/delete actions. A post carrying media shows its first photo as a collapsed
  preview that expands to full height (a gallery when there are several) when the card is expanded.
- **Search** — a text field over the feed. A query matches a post's **title** (any word beginning with
  the query), case-insensitively and ignoring surrounding whitespace. Narrowing begins at **two**
  characters — the shared `SEARCH_MIN_CHARS`, lowered to 2, which the issues search shares; a shorter or
  empty query applies no narrowing. Search resolves on the server across the whole active tab, and a
  matching post must satisfy both the active tab and the query. While the server result loads, the list
  narrows instantly by projecting the query over the posts already on screen, then the authoritative
  result replaces it; while that request is in flight and no loaded post matches, loading placeholders
  are shown rather than the empty state.
- **Loading** — while the feed request is pending, skeleton cards stand in for the list. The empty
  state appears only once the request resolves with no matching posts.
- **Pagination** — the feed loads in pages of **20**, ordered by creation time newest first, and
  extends automatically as the member scrolls to the end, with a loading placeholder while the next
  page arrives.

## Creating and Editing a Post

- A **create** entry (the feed's floating action button) offers the kinds the member is allowed to
  publish. A Resident or Owner reaches the **offer** form; a Manager reaches the **announcement** form;
  Administration may pick either.
- The **offer** form collects category (Продам / Сдам / Услуги / Даром / Требуется / Прочее), title,
  description, and optional photos, shows the phone-visibility notice, and saves the offer.
- The **announcement** form collects category (ЖК Raiymbek Park / Управляющая компания / Городское
  управление / Прочее), title, description, and optional photos, and saves the announcement.
- **Editing** reopens the same kind-specific form pre-filled; the author edits any field except the
  kind. A post may be edited at any time by its author (or, as moderation, by Administration).
- **Deleting** a post is confirmed through a bottom-drawer confirmation ("Удалить объявление?") before
  the post is removed. Deletion is available to the author at any time, and to Administration as
  moderation.

## Comments

A **comment** is one message in a post's threaded conversation. The same thread is reusable on an
**issue**, so the feature wires comments into both `/posts/{postId}/comments` and
`/issues/{issueId}/comments`.

- **Thread screen** — opening a post's (or issue's) comment count shows the conversation, its own
  messages aligned right and others' aligned left with the author's avatar (their photo, falling back
  to initials), name, and time; message text renders as Markdown and a message may carry images. New
  messages appear at the end.
- **Writing a comment** — an input bar at the foot of the thread lets a Resident or higher role send a
  comment with text, an image, or both. The post's (or issue's) comment count reflects the new comment.
- **Editing a comment** — the author taps their own message to open an actions menu and edit it in
  place; the input bar enters edit mode and saves the change.
- **Deleting a comment** — the author deletes their own message behind a confirmation; Administration
  may delete any message as moderation. The comment count reflects the removal.
- **Status-change reasons on issues** — when a Manager or Administration changes an issue's status
  and leaves a comment, that comment is a regular message in the issue's thread: residents read it
  there and reply in the same conversation. The comment count includes it.
- **Translation** — a comment is translated automatically after it is written, exactly like post
  and issue text (see `docs/features/content-translation/prd.md`). A viewer whose locale differs
  from the comment's source language reads the translation by default; the message carries the
  show-original / show-translation toggle, which swaps the stored texts without any request.
- A Viewer reads the thread but cannot write, edit, or delete.

## Content Formatting

A post's **body** and every **comment** are authored and stored as Markdown and rendered through one
shared renderer, reused across posts, issues, and their comment threads. Rendering is a **safe GFM
subset**: paragraphs, headings, bold and italic, ordered and unordered lists, **task lists**
(`- [ ]` / `- [x]`, rendered as **read-only** checkboxes — never interactive), links, inline code and
code blocks, and blockquotes. Raw HTML and scripts are never rendered; links open safely
(`rel="noopener noreferrer"`, new tab). Titles stay plain text. The character limits apply to the raw
Markdown source. Automatic translation applies to the raw Markdown source, and the translated text
renders through the same renderer.

## Card System

The issue card and the new post card are two compositions of one shared set of presentational
primitives, all living together in **`packages/ui/content-card`**:

- The shared **primitives** — card shell, header (category icon chip + title + meta line), body with
  expand/collapse clamp, media gallery, tag row, contact block, and footer (reaction slot +
  read-more toggle) — are extracted from the current `IssueCard` so both cards compose them.
- **`IssueCard`** moves into this folder as a composition of those primitives (no change to how the
  issues feature consumes it).
- **`PostCard`** is a new composition of the same primitives.
- The primitives stay presentational and prop-driven (data and callbacks passed in as props / slots);
  each feature slice supplies its own data adapter and action handlers, as `issue-card-item` does
  today.
- The like/dislike **reaction** pill is reused as-is. The **comment-count** pill becomes an interactive
  control that opens the comment thread (the display-only comment-count badge issues shows today).
- The card **body** primitive renders its content through the shared Markdown renderer, so both post
  and issue descriptions display Markdown once the shared primitive is adopted.
- New design-system primitives the feature requires — a **Markdown** renderer (safe GFM subset), an
  **avatar**, chat **message bubbles** (incoming / outgoing / image), and the feed's **create**
  floating action button — are added to `packages/ui`.

## Field Rules

- **Kind** — required; `announcement` or `offer`; fixed after creation.
- **Category** — required; exactly one from the kind's set.
- **Title** — required; trimmed length 3–80 characters.
- **Description** — required; Markdown source, trimmed length 10–1000 characters for an offer and
  10–3000 for an announcement.
- **Media** — optional; up to 10 photos and/or videos combined, total size at most 200 MB.
- **Comment message** — Markdown source, trimmed text up to 1000 characters, plus optional media (up to
  10 items, 200 MB combined); at least one of text or media must be present.
- **Search** — narrowing applies from two characters (shared `SEARCH_MIN_CHARS` = 2).

## User Journey

A signed-in member opens the Объявления tab and lands on the `/posts` feed with **Все** active; while
it loads, skeleton cards stand in, then posts appear newest first — official announcements from the
management company, the complex, and the city alongside residents' private offers. They switch to
**Уведомления** or **Частные объявления** to narrow the feed, or type in the search field to find a
post by title. Tapping a card expands it to the full body, the author's contact block, and — on their
own post — edit and delete actions; tapping the comment count opens the conversation, where they read
neighbours' messages and add their own with text or a photo. To publish, they tap the create button: a
resident fills the offer form (category, title, description, photos, and a notice that their phone will
be visible to all) and posts it; a manager fills the announcement form instead. The author can reopen
their post to edit it or delete it behind a confirmation at any time. Residents and higher roles leave a
like or dislike as quick feedback. Administration can edit, delete, or moderate any post or comment to
keep the feed clean. A Viewer browses and reads everything but cannot act. Without a valid session the
member never reaches the feed — the guard redirects to welcome.

## Success Metrics

- A resident publishes an offer from start to finish, sees it in the feed and under **Частные
  объявления**, and can edit or delete it afterward; a manager publishes an announcement that appears
  under **Уведомления**.
- The feed filters correctly by tab and search, paginates newest-first, and shows independent loading,
  empty, and error states without a single failing block blanking the screen.
- Any member opens a post's comments, reads the thread, and — as a Resident or higher — adds, edits, and
  deletes their own comment, with the post's comment count reflecting each change.
- The same comment thread opens from an issue and behaves identically.
- The server rejects unauthorised actions: a Viewer cannot create, react, or comment; a Resident cannot
  publish an announcement or touch another member's post; only Administration moderates others' content.
- `IssueCard` and `PostCard` render from the shared `packages/ui/content-card` primitives, and the
  issues feature is unchanged by the refactor.

## Non-functional Requirements

- Mobile-only; a single interface language (Russian) this iteration; no manual keyboard accessibility,
  but prefer semantic elements (`<section>` / `<header>` / `<nav>` / `<button type>` / `<dialog>`).
- Permissions are enforced on the server, never only in the interface. An offer author's phone is
  omitted from the payload for audiences not entitled to it.
- Markdown is rendered as a safe GFM subset — raw HTML and scripts are never rendered, and links carry
  `rel="noopener noreferrer"`. Task-list checkboxes are read-only.
- State boundaries: server data through TanStack Query (tRPC); the active feed tab in a URL search
  parameter; transient interface state (optimistic reactions, expand state, form input) in Zustand
  overlays. Reactions use ID-based optimistic overlays, not cache surgery.
- Reuse the design system — compose the feed and cards from the shared `content-card` primitives and
  the design-system components (filter tabs, select options, tags, inputs, image form, message bubbles,
  avatar, popup menu, bottom nav, create FAB) rather than forking layout.
- Media is uploaded to storage before the post or comment is created or updated, as issues media is
  today.

## Dependencies

- The existing Firebase authentication and resident profile (id, name, phone, block, apartment, role)
  and the `ensureResidentSession` route guard.
- The issues feature as the architectural template — file-based routes, page slices, the tRPC router
  and Firestore access pattern, cursor pagination, keyword search, and the optimistic-reaction overlay
  are copied and adapted for posts.
- A new `posts` tRPC router and Firestore `posts` collection, with a `comments` subcollection on posts
  and on issues; reactions stored as a map on the post document.
- The design system (`design/design-system.lib.pen` + `design/posts-screen.pen`) — the card, tag,
  reaction, comment, message, avatar, filter-tab, select-option, input, image-form, popup-menu, and FAB
  components.
- A Markdown renderer with sanitization (e.g. `react-markdown` + `remark-gfm`, no raw HTML), added as a
  shared `packages/ui` primitive.
- The existing `/announcements` placeholder route, the bottom-nav "Объявления" tab, and the home
  service cards, all repointed to `/posts`.
- Image assets referenced by the create forms (`images/create-ad.png`, `images/residential-complex.png`).

## Terminology

Canonical names used in code, routes, and stored data. Display labels are Russian; these identifiers
are not. Do not introduce synonyms (announcement-only, ad, listing, review) in code — the content
entity is a **post** and a thread message is a **comment**.

- **Entity / route** — `post`; the feed route is `/posts`.
- **Kinds** — `announcement`, `offer`.
- **Feed tabs** — `all`, `announcements`, `offers`.
- **Announcement categories** — `complex`, `management`, `city`, `other`.
- **Offer categories** — `sell`, `rent`, `services`, `free`, `wanted`, `other`.
- **Comment** — one message in a post's or issue's thread; the collection is `comments`.
- **Roles** — `viewer`, `resident`, `owner`, `manager`, `administration` (shared with issues).

## Open Questions

None.
</content>
