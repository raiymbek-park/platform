# Onboarding — Resident Registration, WhatsApp Code, and Session

## Problem and Goal

A resident's first entry into the "Raiymbek Park" app. Before using the app, a person introduces
themselves once (name, block, apartment, role) and proves they own their phone number with a 4-digit
code sent over WhatsApp. On success they get a session that lasts a month and is renewed each time the
app launches, so a returning resident lands straight on the home screen.

The goal is to carry a new resident from the form to a confirmed number and an active session in a
single pass, with protection against code guessing (a growing resend wait and a 24-hour lockout).

## Users

New residents — owners and tenants of apartments in the complex — opening the app on a phone for the
first time. One person equals one phone number. A returning resident with a valid session skips
onboarding entirely.

## Scope

### In scope

- **Welcome screen** (`/onboarding/welcome`) — the registration form. Every field is required, and
  "Next" is enabled only once the whole form is valid. The header scrolls with the content while
  "Next" stays fixed at the bottom. Coming back to this screen (e.g. to fix a phone typo after
  reaching the code screen) restores everything already entered — name, phone, block, apartment, and
  role are pre-filled, not lost.
- **Code screen** (`/onboarding/verify`) — entry of the 4-digit code: focus moves between cells on
  its own, the code is checked the moment all four digits are in, the resend timer is shown, and the
  code can be pasted from the clipboard. After a wrong code the cells are locked — the spent attempt
  can't be retyped — and stay locked until the resident requests a fresh code, which only becomes
  possible once the resend timer runs out.
- **Lockout screen** (`/onboarding/locked`) — the 24-hour lockout shown once a resident exhausts
  their code requests: an illustration, an "Access blocked" heading, a short "you've used up your
  attempts, try again in 24 hours" message, and a large `HH:MM:SS` countdown. It has no controls and
  can't be left; when the countdown reaches zero the app returns to the code screen with a "Send
  code" action.
- **Entry point** (`/onboarding`) — on launch, sends the resident to the right screen based on their
  state (active session, onboarding in progress, or lockout).
- **Home screen** (`/home`) — the existing placeholder, reachable only with a valid session. Its
  content is out of scope.
- **Session** — sign-in lasts 30 days and is renewed on each launch; the working access window
  refreshes silently while the app is in use. An expired or invalid session returns the resident to
  the welcome screen.

Everything is mocked end to end: no real WhatsApp message is sent, the resident isn't really
persisted, and the only code that works is **1234**.

### Out of scope

- Real code delivery over WhatsApp (mocked; the only valid code is 1234).
- Real persistence of the resident.
- Home screen content (placeholder only).
- Country codes other than `+7` (mask `+7 (___) ___-__-__`, exactly 10 digits).
- Signing out and changing the phone number after sign-in.
- Editing registration data after confirmation.
- Localization (Russian only; the language switcher is hidden).
- Keyboard accessibility (mobile-only).

## User Journey

The resident opens the app. With a valid session they go straight to home. Otherwise the
registration form appears. They fill in name and phone, pick a block and role, and enter an apartment
number; "Next" enables once everything is valid. Tapping it requests a code for their number and
opens the code screen. There they see their number and four cells and type the code — the cells
advance on their own, and once four digits are in the code is checked automatically. With the correct
code the resident is registered, a session starts, and the app moves to home. A wrong code spends the
one attempt that code allows; getting another attempt requires a fresh code. The resend wait runs on
the server per number and keeps counting even if the app is closed. Once a resident exhausts their
code requests the number is locked for a day; when the lockout ends they return to the code screen and
can request a fresh code.

## Verification, Resend, and Lockout Rules

The exact numbers below are fixed business rules.

- **Sending a code.** The first code is requested by tapping "Next" (or "Send code" after a lockout);
  any further code for the same number is a *resend*.
- **One attempt per code.** Each code allows exactly one verification attempt. Once it's used — right
  or wrong — that code is spent, and no further check against it is allowed until a new code is sent.
  This is enforced on the server, so it holds even against a direct request outside the app, not just
  the UI; the app reflects it by locking the cells after an attempt until a fresh code is sent.
- **The phone number is the identity** for the whole flow.

**Resend wait (per number).** After each send, a wait counts down before the next resend is allowed:

| Code request | Wait until next resend |
|---|---|
| Initial ("Next" / "Send code") | 60 s |
| 1st resend | 120 s |
| 2nd resend | 300 s |
| 3rd resend | 600 s |
| Any request beyond that | **number locked for 24 h** |

- While the wait runs: a "Didn't get the code? Resend in M:SS" line is shown, together with a
  **"Paste code from clipboard"** action.
- When the wait reaches zero: the paste action is replaced by a **"Resend"** button.
- **Paste from clipboard** reads the clipboard and pulls the digits out of it; it is enabled only when
  exactly 4 digits are found (so "Your code is 1234" works) and stays disabled for any other digit
  count — none, fewer, or more. When enabled, tapping it fills the cells and triggers the automatic
  check. The clipboard is re-read whenever the app regains focus, so copying the code elsewhere and
  coming back enables the action without any manual step.
- A number gets **4 code requests total** — the initial one plus 3 resends. A 5th request locks the
  number for 24 hours: verification and resend are disabled, and the lockout screen takes over with a
  countdown to unlock.
- When the lockout ends, the app returns to the code screen with empty cells, the request count
  reset, and a "Send code" action that starts a fresh send (60 s wait).

**Timer source.** The resend wait and the lockout countdown are server truth, per number. The app
only displays the time left — it never keeps its own copy. After a relaunch the app restores the
right screen (code or lockout) and shows the live remaining time; the timer keeps running, it doesn't
reset.

## Session and Renewal

- After a correct code the resident is registered and a session begins. The session is valid for
  **30 days** and renews on each launch; within a session, access refreshes silently about every hour
  so the resident never notices.
- On launch the app renews the session: still valid → the resident goes to home; expired or invalid →
  the session is cleared and the resident goes to the welcome screen.
- Home is reachable only with a valid session. If access lapses mid-session the app renews silently;
  if renewal fails, it returns to the welcome screen.
- Renewal is single-use: once a session has been renewed, the previous renewal can no longer be used.

## Startup Restore Priority

On launch the app decides where to land, in this order:

1. A valid session → renew it → **home**.
2. Otherwise, an onboarding in progress for a number → check that number's state:
   - locked → **lockout screen**;
   - an active code or a running wait → **code screen**;
   - otherwise → **welcome screen**.
3. Otherwise → **welcome screen**.

### The lockout can't be escaped

While a number is locked, the lockout takes priority over everything else. Any attempt to go
elsewhere — typing a URL directly, reloading, or using the system/browser back gesture — returns the
resident to the lockout screen. The lock is server truth and can't be bypassed by clearing the app's
local data for the same number. It lifts only when the countdown ends, at which point the app moves
to the code screen. The one exception: a valid session takes priority — the lockout only affects
residents who haven't signed in.

## Success Metrics

- The funnel is measurable end to end: form submitted → code issued → code confirmed → resident
  registered → session active, with both throughput and drop-off visible.
- On the mock: 100% of forms completed with the correct code (1234) reach home; a returning resident
  with a valid session reaches home without onboarding.
- Target onboarding completion ≥ 80% after the real WhatsApp integration.

## Experience Requirements

- **Mobile-first, single column**, full-viewport height. The header scrolls with the page; the
  primary action stays fixed at the bottom — "Next" on welcome, the action buttons on the code screen.
- **Clipboard detection ignores surrounding text:** it keeps only the digits and accepts the result
  only when it's exactly 4 digits, so a code embedded in a message is still detected while clipboard
  content without a 4-digit code leaves the paste action disabled. If the clipboard can't be read or
  access is denied, the paste action simply stays disabled — no error is shown.
- **Russian only** this iteration.

## Field Validation (welcome)

- **Name:** non-empty after trimming, 2–60 characters.
- **Phone:** `+7` plus exactly 10 digits (mask `+7 (___) ___-__-__`); valid once all 10 digits are
  present.
- **Block:** exactly one of 1–4.
- **Apartment:** digits only, within the selected block's range:
  - block 1 → 1–70
  - block 2 → 71–139
  - block 3 → 1–63
  - block 4 → 64–126
- **Role:** owner or tenant (exactly one).
- **Code:** 4 cells, one digit (`0–9`) each; the only correct code is 1234.

## Open Questions

None — every threshold, format, and timing is fixed above. Exact wording (the lockout copy and the
wrong-code message) comes from the design during layout — an implementation detail, not a blocker.
