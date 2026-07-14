# Home — Resident Main Screen and Service Hub

## Problem and Goal

`/home` is the resident's main screen after onboarding and the root of the app's navigation — the first
tab of a persistent bottom nav and the entry point to every other top-level destination (services,
announcements, settings, emergency contacts, and external request channels).

This feature delivers `/home` as a complete, scrollable, data-driven screen plus the bottom-nav shell
that routes the resident to the other sections. The screen orients a returning resident — their
location (block/apartment) and what is new since their last visit — and routes them onward.

Requirements:

- A scrollable home screen composed from the design system and wired to live data via real client
  queries.
- A "what's new since your last visit" feed derived from real activity — new announcements, new
  private offers, and status changes or new comments on issues the resident follows — dated after the
  resident's recorded last visit, newest first; a friendly greeting when nothing is new.
- A persistent bottom-nav shell linking the four top-level destinations, with the active internal tab
  reflecting the current route.
- Per-block loading and error handling so a single failing query never blanks the screen.

## Users

Signed-in residents — owners and tenants who have completed onboarding and hold a valid session. Home
is reachable **only** with a valid session; without one the resident is sent to `/onboarding/welcome`
(the existing route guard enforces this). One resident equals one profile (name, block, apartment),
derived from their session.

## Scope

### In scope

- **Home screen** (`/home`) — single-column, full-height, scrollable, composed top to bottom:
  - **Header** (`ScreenHeader`) — app logo and the KZ/RU/EN language switcher. The switcher is
    **visible but inert** (Russian only); tapping a chip does nothing.
  - **Building Hero** — full-bleed building photo (`images/building.png`) with a **Location Badge**
    showing the resident's block and apartment (e.g. "Блок 1 · Квартира 142"), from their profile.
  - **Welcome Card** — a "what's new since your last visit" feed, **derived from real activity** in
    the complex rather than a hand-authored list. When new events exist, the card greets the resident
    ("За время вашего отсутствия появились изменения:") and lists the events as change rows
    (icon + text), newest first, up to **10**. The feed contains events dated **after** the resident's
    recorded last visit; a resident with no recorded last visit sees the most recent activity. Each
    event is one of three kinds:
    - **New announcement** — an announcement published since the last visit; shown to every resident
      except its own author.
    - **New private offer** — a private offer published since the last visit; shown to every resident
      except its own author.
    - **Issue activity** — a status change, or a **new comment from someone else**, on an issue the
      resident follows. Authoring an issue or commenting on one subscribes the resident to it, and a
      resident may also follow an issue by hand; activity on issues the resident does not follow never
      appears. **Managers and Administration** are subscribed to every issue by default, so they receive
      status changes and new comments across **all** issues, not only followed ones.
    The feed never notifies a resident about **their own actions** — their own posts, their own
    comments, and the act of creating their own issue are all excluded; only later activity by others
    (others' posts, others' comments, and staff status changes) surfaces.
    The API returns each event as a **semantic type with its references** (kind, ids, the issue's
    number and new status, the announcement/offer category and title) — never a pre-rendered icon,
    colour, or sentence. The screen maps each type to its icon, tone, and Russian text in client code.
    When there are no new events, the card shows a fixed greeting by first name
    ("Привет, {name}! 👋", or "Привет! 👋" when the name is unavailable) plus a "no news" message
    chosen at random from a set of friendly variants.
  - **Services Section** — titled section ("Сервисы") of **five** fixed service items defined in the
    web app (a static catalog, not from the API), each with icon, title, and description:
    **Объявления** and **Создать объявление** (both open the in-app `/announcements` screen, same
    tab), and **Создать заявку**, **Статус заявки**, and **Чат дома в WhatsApp** (each opens its
    external URL — Google Form, Trello board, or WhatsApp group — in a new browser tab).
  - **Contacts Section** — "Аварийные контакты" card listing emergency / service contacts (name, role,
    icon, phone number), divider-separated, from the API. **Tapping a contact opens the phone dialer**
    with that number (native `tel:` call on mobile).
- **Visit recording** — the resident's last-visit timestamp is recorded once per **page load**, only
  **after the feed has loaded** (so the feed is read against the previous last visit before it is
  overwritten). The feed then stays stable while the resident navigates between in-app sections and
  returns to Home — it is served from cache, not re-fetched. Only a **full page reload** re-reads the
  feed against the now-advanced last visit, dropping the events already seen.
- **Bottom navigation** — a persistent `BottomNav` component with **4 tabs**: **Главная** (house, the
  Home screen at `/home`), **Объявления** (megaphone, `/announcements`), **Заявки** (clipboard-list,
  opens an external Trello board in a new browser tab), and **Настройки** (settings, `/settings`). The
  active internal tab is highlighted; the external **Заявки** tab is never marked active. There is no
  internal requests screen.
- **Live data layer** — tRPC procedures on `apps/api` serve the profile, the derived events feed, and
  contacts. The events procedure computes the feed on read from the `posts` and `issues` collections
  and the resident's issue follows, scoped by their last visit — there is no stored events collection
  and no UI text or icon is persisted. The web side queries them via TanStack Query with caching,
  loading, and error handling.
- **Data states** — each API-backed block renders its loading and error state independently; a failure
  in one block does not blank the screen.

### What's NOT included

- In-app request flows — the service items for requests hand off to external Google Forms, a Trello
  board, and a WhatsApp group rather than native screens.
- An internal requests screen — the **Заявки** nav tab and the "Статус заявки" service item both open
  the external Trello board.
- The full Announcements and Settings features — the nav tabs route to those screens, but their
  behavior is owned by separate features.
- Functional language switching / localization — switcher visible but inert; Russian only (consistent
  with onboarding).
- Authentication / session logic — delivered by onboarding; home only consumes the existing session
  guard.
- Pull-to-refresh and real-time updates.
- Push delivery of the feed's events — the events computation defined here is consumed by
  `docs/features/push-notifications/prd.md`, which owns the hourly digest, device registration, and
  the notification permission prompt shown on this screen.

## User Journey

A signed-in resident opens the app and, via startup restore, lands on `/home`. The header shows the
logo and an inert language switcher. Below, a building photo with their block-and-apartment badge
confirms where they are. The welcome card shows what is new since their last visit: if events have
appeared since then, it lists them newest-first; if nothing is new, it greets them by name with a
friendly "no news" message. Once the feed has loaded, the app records this visit, so already-seen
events drop off the feed next time. Scrolling down they see the services list and the emergency-contacts
card; tapping a service opens its destination (the in-app announcements screen or an external link in a
new tab), and tapping a contact opens the phone dialer with that number. A bottom navigation bar stays
anchored at the bottom with Главная highlighted; tapping Объявления or Настройки opens that section,
tapping Заявки opens the external Trello board in a new tab, and Главная returns here. Without a valid
session the resident never reaches home — the guard redirects to welcome.

## Success Metrics

- A resident with a valid session reaches a fully rendered home screen — header, hero with their
  block/apartment, the "what's new" feed (or a "no news" greeting), services, and contacts.
- The feed lists only activity dated after the resident's recorded last visit, newest first — new
  announcements and offers for every resident, and issue status changes or comments only for issues the
  resident follows; after the visit is recorded, those events no longer appear on the next session.
- The Объявления and Настройки tabs navigate to their screens and back to home with the nav intact and
  the correct internal tab marked active; the Заявки tab opens the external Trello board.
- Tapping a service item opens its destination; tapping a contact invokes the device dialer with the
  contact's number.
- Every API-backed block (profile, events feed, contacts) exposes observable loading and error states;
  a single failing block does not blank the screen.

## Non-functional Requirements

- **Mobile-first, single column, full-viewport height** using dynamic viewport units (`svh`). Content
  scrolls beneath a pinned header; the bottom nav stays anchored to the bottom of the viewport.
- **Touch targets ≥ 44px**; nav items and contact rows comfortable to tap.
- **No keyboard accessibility work** (mobile-only), but prefer semantic elements — `<nav>` for the
  bottom bar, `<a href="tel:…">` for contacts, `<a target="_blank">` for external service/nav links,
  router `<Link>` for internal tabs, `<section>` / `<header>` for structure.
- **Russian only** this iteration.
- **Reuse the design system** — compose from the `.pen` DS components (ScreenHeader, LocationBadge,
  HeroCard, AnnounceCard, ActionCard, SectionHeader, ContactCard, Divider, NavItem) rather than
  forking layout.
- **State boundaries** — server data via TanStack Query (tRPC), navigation via router, UI state via
  Zustand; no client-side duplication of server data.

## Dependencies

- **Onboarding session** — the existing `/home` route guard and session model, reused as-is. The guard
  (`beforeLoad`) gates access on the persisted token pair (`useAuthStore`): it admits a valid access
  token (`hasValidAccessToken`), silently rotates an expired access token against a valid refresh token
  (`hasValidRefreshToken` → `refreshSession`), and redirects to `/onboarding/welcome` when no refresh
  token can renew the session.
- **tRPC API** (`apps/api`) — procedures for the resident `profile`, the derived `events` feed, and
  the `contacts` list, plus a `markVisit` mutation; types flow to web with no codegen. The events
  procedure returns a discriminated union of event types, computed on read.
- **Firestore** — the `residents` collection (profile, `lastVisit` per uid, and each resident's issue
  follows under `residents/{uid}/watches/{issueId}`), the `posts` collection (announcements and offers,
  queried by `createdAt`), the `issues` collection (carrying `lastStatusAt` / `lastCommentAt` activity
  timestamps), and the `serviceContacts` collection (contacts, ordered by their `order` field). The
  events feed is derived from posts and issues on read; there is no stored `events` collection.
- **Issue follows** (`issue-tracker`) — the per-resident issue-follow subscription and the issue
  `lastStatusAt` / `lastCommentAt` timestamps are owned by the issue-tracker feature and consumed here
  to scope and date the issue events in the feed.
- **Design system** (`design/design-system.lib.pen` + `design/home-screen.pen`) — the composed
  components above.
- **Image asset** — `images/building.png` for the hero (ships in the web app's assets).
- **Router** — routes `/announcements` and `/settings`; the Заявки tab and request-related service
  items link out to external destinations.

## Open Questions

- None.
