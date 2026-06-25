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
- A "what's new since your last visit" feed: events created after the resident's recorded last visit,
  newest first; a friendly greeting when nothing is new.
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
  - **Welcome Card** — a "what's new since your last visit" feed. When new events exist, the card
    greets the resident ("За время вашего отсутствия появились изменения:") and lists the events as
    change rows (icon + text), newest first, up to **10**. The feed contains events created **after**
    the resident's recorded last visit; a resident with no recorded last visit sees the most recent
    events. When there are no new events, the card shows a fixed greeting by first name
    ("Привет, {name}! 👋", or "Привет! 👋" when the name is unavailable) plus a "no news" message
    chosen at random from a set of friendly variants. Events come from the API.
  - **Services Section** — titled section ("Сервисы") of **five** fixed service items defined in the
    web app (a static catalog, not from the API), each with icon, title, and description:
    **Объявления** (opens the in-app `/announcements` screen, same tab), **Быстрая заявка**, **Заявка
    с медиа**, **Статус заявки**, and **Чат дома в WhatsApp** (each opens its external URL — Google
    Form, Trello board, or WhatsApp group — in a new browser tab).
  - **Contacts Section** — "Аварийные контакты" card listing emergency / service contacts (name, role,
    icon, phone number), divider-separated, from the API. **Tapping a contact opens the phone dialer**
    with that number (native `tel:` call on mobile).
- **Visit recording** — the resident's last-visit timestamp is recorded once per app session, and only
  **after the feed has loaded** (so the feed is read against the previous last visit before it is
  overwritten). On the next app session, events already seen drop off the feed.
- **Bottom navigation** — a persistent `BottomNav` component with **4 tabs**: **Главная** (house, the
  Home screen at `/home`), **Объявления** (megaphone, `/announcements`), **Заявки** (clipboard-list,
  opens an external Trello board in a new browser tab), and **Настройки** (settings, `/settings`). The
  active internal tab is highlighted; the external **Заявки** tab is never marked active. There is no
  internal requests screen.
- **Live data layer** — tRPC procedures on `apps/api` serve profile, events feed, and contacts from
  Firestore. The web side queries them via TanStack Query with caching, loading, and error handling.
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
- Pull-to-refresh, real-time updates, push notifications.

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
- The feed lists only events created after the resident's recorded last visit, newest first; after the
  visit is recorded, those events no longer appear on the next session.
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
- **tRPC API** (`apps/api`) — procedures for the resident `profile`, the `events` feed (`changes`), and
  the `contacts` list, plus a `markVisit` mutation; types flow to web with no codegen.
- **Firestore** — the `residents` collection (profile + `lastVisit` per uid), the `events` collection
  (feed, queried by `createdAt`, newest first), and the `serviceContacts` collection (contacts, ordered
  by their `order` field).
- **Design system** (`design/design-system.lib.pen` + `design/home-screen.pen`) — the composed
  components above.
- **Image asset** — `images/building.png` for the hero (ships in the web app's assets).
- **Router** — routes `/announcements` and `/settings`; the Заявки tab and request-related service
  items link out to external destinations.

## Open Questions

- None.
