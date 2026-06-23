# Home — Resident Main Screen and Service Hub

## Problem and Goal

`/home` is the resident's main screen after onboarding and the root of the app's navigation — the first
tab of a persistent bottom nav and the entry point to every other top-level section (services,
announcements, requests, settings, emergency contacts).

This feature delivers `/home` as a complete, scrollable, data-driven screen plus the bottom-nav shell
that routes the resident to the other sections. The screen orients a returning resident — their
location (block/apartment) and the changes since their last visit — and routes them onward.

Requirements:

- A scrollable home screen composed from the design system and wired to its (mocked) data via real
  client queries.
- A persistent bottom-nav shell linking the four top-level sections, with the active tab reflecting the
  current route.
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
  - **Welcome Card** — greeting by first name ("Привет, {name}! 👋") and a "what changed while you
    were away" feed: a list of change rows (icon + text). Greeting name and feed come from the API.
  - **Services Section** — titled section ("Сервисы") listing service items (icon, title,
    description), e.g. Объявления, Быстрая заявка, Заявка с медиа, Статус заявки, Чат дома в WhatsApp.
    The list comes from the **API**. Items are **non-navigational** this iteration — tapping does
    nothing (no destination yet).
  - **Contacts Section** — "Аварийные контакты" card listing emergency contacts (name, role, icon,
    phone number), divider-separated, from the API. **Tapping a contact opens the phone dialer** with
    that number (native `tel:` call on mobile).
- **Bottom navigation** — a new persistent `BottomNav` component with **4 tabs**: Home (house, active
  here), Announcements (megaphone), Requests (clipboard-list), Settings (settings). The Home tab
  renders this screen; the other three navigate to **placeholder stub screens** at `/announcements`,
  `/requests`, `/settings`.
- **Mocked data layer** — tRPC procedures on `apps/api` return **mocked** data for profile, changes
  feed, services, and contacts. The web side is **real**: tRPC queries via TanStack Query with proper
  caching, loading, and error handling — no mock data on the client.
- **Data states** — each API-backed block renders its loading and error state independently; a failure
  in one block does not blank the screen.

### What's NOT included

- Real behavior behind service items — data-driven but non-navigational (request flows, WhatsApp
  handoff, deep links all later).
- Real screens for the other three nav tabs — they reach **placeholder** screens only; Announcements /
  Requests / Settings features are separate.
- Functional language switching / localization — switcher visible but inert; Russian only (consistent
  with onboarding).
- Real persistence — profile, changes, services, and contacts are mocked on the API (no real database).
- Authentication / session logic — delivered by onboarding; home only consumes the existing session
  guard.
- Pull-to-refresh, real-time updates, push notifications.

## User Journey

A signed-in resident opens the app and, via startup restore, lands on `/home`. The header shows the
logo and an inert language switcher. Below, a building photo with their block-and-apartment badge
confirms where they are. The welcome card greets them by name and lists what changed while they were
away. Scrolling down they see the services list and the emergency-contacts card; tapping a contact
opens the phone dialer with that number. A bottom navigation bar stays anchored at the bottom with
Home highlighted; tapping Announcements, Requests, or Settings opens that section's placeholder screen,
and Home returns here. Without a valid session the resident never reaches home — the guard redirects to
welcome.

## Success Metrics

- A resident with a valid session reaches a fully rendered home screen — header, hero with their
  (mocked) block/apartment, greeting by their name, changes feed, services, and contacts — all sourced
  from real client queries against the mocked API (no client-side mock data).
- The three non-home tabs each navigate to their placeholder screen and back to home with the nav
  intact and the correct tab marked active.
- Tapping a contact invokes the device dialer with the contact's number.
- Every API-backed block (profile, changes, services, contacts) exposes observable loading and error
  states; a single failing block does not blank the screen.

## Non-functional Requirements

- **Mobile-first, single column, full-viewport height** using dynamic viewport units (`svh`). Content
  scrolls beneath a pinned header; the bottom nav stays anchored to the bottom of the viewport.
- **Touch targets ≥ 44px**; nav items and contact rows comfortable to tap.
- **No keyboard accessibility work** (mobile-only), but prefer semantic elements — `<nav>` for the
  bottom bar, `<a href="tel:…">` for contacts, `<button>` / router `<Link>` for tabs,
  `<section>` / `<header>` for structure.
- **Russian only** this iteration.
- **Reuse the design system** — compose from the `.pen` DS components (ScreenHeader, LocationBadge,
  WelcomeCard, ChangeRow, ServiceItem, SectionHeader, ContactItem, Divider, NavItem) rather than
  forking layout.
- **State boundaries** — server data via TanStack Query (mocked tRPC), navigation via router, UI state
  via Zustand; no client-side duplication of server data.

## Dependencies

- **Onboarding session** — the existing `/home` route guard and session model, reused as-is. The guard
  (`beforeLoad`) gates access on the persisted token pair (`useAuthStore`): it admits a valid access
  token (`hasValidAccessToken`), silently rotates an expired access token against a valid refresh token
  (`hasValidRefreshToken` → `refreshSession`), and redirects to `/onboarding/welcome` when no refresh
  token can renew the session.
- **tRPC API** (`apps/api`) — new mocked procedures for profile, changes feed, services, and contacts;
  types flow to web with no codegen.
- **Design system** (`design/design-system.lib.pen` + `design/home-screen.pen`) — the composed
  components above.
- **Image asset** — `images/building.png` for the hero (ships in the web app's assets).
- **Router** — new placeholder routes `/announcements`, `/requests`, `/settings`.

## Open Questions

- **Exact copy** (section titles, change-row wording, fallback / empty / error text) comes from the
  design during layout — an implementation detail, not a blocker. AC asserts presence and behavior, not
  exact strings.
