# Push Notifications — Hourly Activity Digest

## Problem and Goal

A resident learns what happened in the complex only by opening the app: `/home` shows what is new
since their last visit, and the feed waits there until they come back. Activity that needs a timely
read — the management company announcing that water is cut off tomorrow, a reply in a thread the
resident is following, a status change on their own issue — reaches them whenever they next happen to
open the app, which may be days later or never.

`Push notifications` delivers that same activity to the resident's device while the app is closed.
The goal is reach, not a second feed: a push is a signal that something is new, and `/home` remains
the single place where the activity is read.

Delivery is **accumulated, never per event**. A community feed produces bursts — a manager publishing
four announcements in a row, a lively comment thread — and one push per event turns the app into a
nuisance and trains residents to switch notifications off, which costs the reach the feature exists
to buy. Instead the app sends **at most one digest per resident per hour**, covering everything that
accumulated in that window.

Requirements:

- One aggregated **digest** per resident per hour, covering every new **event** in the window.
- The digest covers the same events the Home feed shows, for the same audience, with the same
  exclusions — one definition of "new activity", not two.
- An event the resident has already seen on Home is never pushed.
- Delivery is silent during night hours; nothing is dropped, it waits for the morning.
- Permission is requested in the app; a resident who declines keeps a fully working app.
- Tapping a digest opens `/home`.

The transport, the storage shape, and the per-platform constraints are recorded in
`docs/decisions/014-push-notifications-fcm-hourly-digest.md`.

## Users

Signed-in residents holding a valid session — the same audience `/home` serves, under the same five
roles (`viewer`, `resident`, `owner`, `manager`, `administration`). Roles do not gate the digest
itself: a role decides which **events** a resident is entitled to, and that decision is already made
by the Home feed and reused here unchanged. **Managers** and **Administration** are subscribed to
every issue by default, so their digest carries issue activity across all issues; every other role
receives issue activity only for issues they follow.

Notifications reach a **device**, not an account: one resident may hold several registered devices,
and each receives the same digest.

## Scope

### What's included

- **Digest** — one push message per resident per hourly window, summarizing that window's events:
  - The digest is built from the **event** set defined by the Home feed
    (`docs/features/home/prd.md`) — new announcement, new private offer, status change on a followed
    issue, and new comment from someone else on a followed issue — including its exclusion of the
    resident's own actions and its role-based issue subscription. The feed's definition is the only
    definition; the digest reuses the computation rather than restating it.
  - **Window anchor** — the digest covers events dated after the **later** of the resident's recorded
    last visit and the end of their last delivered digest window. An event already shown on Home is
    therefore never pushed, and an event already pushed is never pushed twice.
  - **Content** — the digest names the newest event in the window and, when the window holds more,
    the number of remaining events. It carries no message body per event; `/home` holds the detail.
  - **Identity** — the digest is identifiable as this app at a glance: it carries the app's own icon,
    the same mark the app is installed and bookmarked under, at the **192×192** px the notification
    surface renders — not the generic icon a browser falls back to for a sender it cannot identify.
  - **Cap** — a window carries at most **10** events, matching the Home feed's limit; a window with
    more reports the first 10 and the remainder rolls into the resident's next Home visit rather than
    a second push.
  - **One at a time** — a device shows at most one undelivered-and-unread digest; a newer digest
    replaces the older one on that device rather than stacking beside it.
  - **Opening** — tapping the digest opens `/home` in the app.
- **Cadence** — a scheduled run every **hour** builds and sends the digests. A resident with no new
  events in the window receives nothing.
- **Quiet hours** — no digest is delivered between **22:00 and 08:00** in the complex's local time
  (Asia/Almaty). Events arising in that period are not dropped: they stay in the window and are
  carried by the first digest after 08:00.
- **Permission** — the app requests notification permission **once per device**, on `/home`, after
  the feed has loaded. A resident who grants it registers that device. A resident who declines, or
  whose browser cannot deliver push, is never asked again by the app and sees no error — the Home
  feed is the fallback and the app is fully usable.
- **Device registration** — a granted device is registered against the resident, is idempotent
  (registering the same device twice leaves one registration), and carries the **locale** the app is
  running in, so the digest is written in the language that device reads. A device reporting a locale
  outside the supported set, or none at all, is registered with the default locale.
- **Locale refresh** — a registration carries the language the resident reads **now**, not the one
  they read when the device was first registered. A registered device refreshes its registration
  whenever the resident changes the interface language (`docs/features/user-profile/prd.md`), so the
  first digest sent after the change is already written in the newly chosen language — the resident
  neither restarts nor reopens the app to be understood. The refresh is the same idempotent
  registration, so the device keeps exactly one. It reaches only a device that already holds a
  registration: a language change never asks for notification permission and never registers a device
  that has none.
- **Device reclaiming** — a device carries a registration for one resident at a time. Registering a
  device for a resident removes that same device's registration from every other resident it was
  registered against, so a digest never reaches a device that has changed hands. The reclaim happens
  at registration, without anyone having to act, and leaves the previous resident's other devices
  registered.
- **Pruning** — a registration the delivery service reports as no longer valid is removed on the spot,
  so a reinstalled or expired device stops accumulating dead registrations.
- **Digest copy** — authored server-side (a scheduled run has no caller to take a locale from) and
  written in the device's registered locale, in each of the three **supported locales** the app
  already serves: `ru`, `kk`, and `en`, with `ru` the **default locale**.

### What's NOT included

- **Notification settings** — no per-event-kind toggles, no notification section in `/settings`, no
  in-app switch. The device's own notification permission is the only control, and it lives in the
  browser or the operating system.
- **An in-app control that ends a device's registration** — no screen, button, or flow removes a
  registration. A registration ends when the device is registered for another resident, or when the
  delivery service rejects it.
- **Per-event, real-time push** — delivery is the hourly digest; an event never triggers an immediate
  message of its own.
- **A notification centre or history screen** — a digest is not stored for later reading; `/home` is
  the record of what is new.
- **Native mobile notifications** — the app is a web app; there is no native shell to deliver through.
- **Quiet-hours or cadence configuration** — the window and the night hours are fixed values, not
  per-resident preferences.
- **Deep links to the event** — the digest opens `/home`, not the individual post, issue, or comment
  thread.
- **Delivery analytics** — open rates, per-device delivery reporting, and campaign tooling.

## User Journey

A resident opens `/home`, reads what is new, and — once the feed has settled — the app asks whether
it may send notifications. They allow it, and that device is registered; nothing else about the
screen changes. Over the following days they keep the app closed while the complex carries on
publishing announcements and answering issues. Their device stays quiet through the night and, at
most once an hour by day, shows a single notification pointing at what has accumulated. They tap it
and land on `/home`, where the activity is listed in full; the visit is recorded, so the next
notification starts from this moment rather than repeating what they have now read. A resident who
declines the prompt is never asked again and reads the same activity on `/home` exactly as before,
with no error and no degraded screen.

## Success Metrics

- A resident with a registered device and new activity in the window receives exactly one digest for
  that window, naming the newest event and the count of the rest.
- Every delivered digest shows the app's own icon, so the resident knows which app is speaking before
  reading a word of it.
- A resident who changes the interface language receives their next digest in that language, without
  restarting or reloading the app.
- A resident whose events were all already visible on their last Home visit receives no digest.
- An event delivered in one digest never appears in a later one.
- Activity arising between 22:00 and 08:00 produces no notification during that period and is carried
  in full by the first digest after 08:00.
- The audience and exclusions of a digest match the Home feed exactly: a resident's own post,
  comment, or issue never notifies them; issue activity reaches followers, and reaches Managers and
  Administration across all issues.
- Declining the permission prompt, or opening the app in a browser that cannot deliver push, leaves
  every screen fully functional and produces no visible error.
- A device registered for one resident receives no other resident's digest from that registration
  onwards, and the reclaim costs the previous resident none of their other devices.
- A device the delivery service rejects as invalid is no longer registered after the run that
  observed the rejection.

## Non-functional Requirements

- **Reach is best-effort, and the app never depends on it.** Push is a signal layer over the Home
  feed; no information exists only inside a digest, and any failure to deliver costs timeliness,
  never data.
- **Platform reality is not uniform.** On Android and desktop browsers a granted permission delivers
  push while the browser runs. On iOS the app receives push **only when installed to the Home
  Screen** — a browser tab on iOS cannot receive it, whatever the resident answers to the prompt. The
  app states nothing to the resident that contradicts this and never promises delivery it cannot
  make. ADR 014 records the constraint and what the app ships to satisfy it.
- **The digest carries no private content.** It names an event, not a resident: no phone number, no
  apartment, no comment text, no author contact. A notification is readable on a locked screen, so it
  must reveal no more than a public feed row.
- **Idempotent windows.** A run that fails part way, or is retried, never sends a resident two
  digests for the same window and never advances a window it did not deliver.
- **One resident's failure is contained.** A device or resident that fails during a run does not stop
  the run for everyone else.
- **The scheduled run is the only writer of the window marker**, and it advances only on a delivered
  digest.
- **Cost and load stay flat with silence.** A window in which nothing happened reads the same data as
  the Home feed already reads and sends nothing.
- **Copy is server-authored** in all three supported locales, per device; there is no client
  rendering of digest text.
- Mobile-only; no manual keyboard accessibility work.

## Dependencies

- **The Home feed's event computation** (`docs/features/home/prd.md`) — the event union, the
  audience, the role-based issue subscription, and the own-action exclusions are consumed as-is,
  parameterised by the window anchor. This is a reuse dependency, not a copy: a change to what counts
  as an event changes both surfaces at once. ADR 014 records which function is reused and the one
  change it takes.
- **Issue follows** (`docs/features/issue-tracker/prd.md`) — the per-resident `watch` subscription and
  the issues' activity timestamps scope issue events, exactly as they scope the Home feed.
- **The resident's recorded last visit** (`docs/features/home/prd.md`) — one half of the window
  anchor.
- **The existing session and route guard** — permission is requested and a device registered only for
  a signed-in resident on `/home`.
- **The interface language switch** (`docs/features/user-profile/prd.md`) — the resident's choice of
  reading language is the locale a registration carries, and a change to it refreshes that
  registration.
- **The server-side locale message catalogue** — the digest copy joins the existing server-authored
  message set, the same one the OTP text is written from.
- **The delivery service and its scheduled run** — transport, credentials, and the operational
  prerequisites are specified in `docs/decisions/014-push-notifications-fcm-hourly-digest.md`. The
  feature depends on a delivery credential provisioned out of band; without it the app degrades to
  silence rather than to an error, so provisioning is verified as part of shipping, not assumed.

## Terminology

Canonical identifiers used in code and stored data. Display copy is Russian, Kazakh, and English;
these identifiers are not. Do not introduce synonyms (notification-subscription, device, alert,
reminder, subscriber) in code.

- **event** — one item of new activity. The existing union from the Home feed
  (`announcement` | `offer` | `issue-status` | `issue-comment`); this feature adds no new kind.
- **digest** — one aggregated push message covering N events for one resident in one window.
- **window** — the interval a digest covers: from the anchor to the moment the digest is built.
- **pushToken** — the registration identifying one device; stored per resident with the device's
  locale, and held by at most one resident at a time.
- **locale** — the language a device reads, drawn from the supported set `ru` | `kk` | `en`; `ru` is
  the default, applied when a device reports anything else or nothing.
- **lastNotifiedAt** — the marker on the resident closing the last delivered window; the anchor is
  the later of it and `lastVisit`.
- **quiet hours** — 22:00–08:00 Asia/Almaty, during which no digest is delivered.

## Open Questions

None.
