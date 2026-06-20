# Onboarding — Resident Registration + WhatsApp OTP + Session

## Problem and Goal

A resident's first entry into the "Raiymbek Park" app. Before using the app, a person
introduces themselves once (name, block, apartment, role) and confirms ownership of their
phone number with a 4-digit code from WhatsApp. On success they get a session (token) that
lasts a month and is refreshed on every app launch, so a returning user lands straight on the
home screen.

The goal is to carry a new resident from the form to a confirmed number and an active session
in a single pass, with protection against code brute-forcing (a growing resend timer and a
24-hour lockout).

## Users

New residents — owners and tenants of apartments in the complex — opening the app on mobile for
the first time. One user equals one phone number. A returning user with a valid session skips
onboarding entirely.

## Scope

### In scope

- **`/onboarding/welcome` screen** — the registration form. Every field is required; the "Next"
  button is enabled only when the whole form is valid (built on **TanStack Form**). The header is
  sticky at the top, "Next" is sticky/fixed at the bottom.
- **`/onboarding/verify` screen** — 4-digit code entry: focus moves between cells automatically,
  the code is checked automatically once the cells are full, the resend timer comes from the
  server, codes can be pasted from the clipboard, and a resend button appears when the timer runs
  out.
- **`/onboarding/locked` screen** — the 24-hour lockout after resends are exhausted. Per the
  design (`design/home-screen.pen`, "Account Locked" frame): an illustration, the "Access blocked"
  heading, the "You've used up your code attempts. You can try again in 24 hours." subheading, and
  a large `HH:MM:SS` countdown. **There are no controls** (no button, no back) — the screen can't
  be left; when the countdown reaches zero the app moves to `/onboarding/verify` with a "Send code"
  CTA.
- **`/onboarding` entry point** — an index guard that routes by state (session / draft / lockout).
- **`/home` screen** — the existing placeholder, behind a guard (a session is required). Its
  content is out of scope.
- **Session:** an access token (1 h) plus a refresh token (30 days). On app launch the token is
  refreshed through `auth.refresh`. An invalid or expired refresh token sends the user to
  `/onboarding/welcome`.
- **Mock tRPC procedures** (nothing is actually sent over WhatsApp): `otp.send`, `otp.status`,
  `otp.verify`, `resident.register`, `auth.refresh`. The correct code is `1234`.

### Out of scope

- Real code delivery over WhatsApp (mocked; the correct code is hard-wired to `1234`).
- Real persistence of the resident (`resident.register` is mocked — it returns success and tokens).
- Home screen content (the existing placeholder only).
- Country codes other than `+7` (mask `+7 (___) ___-__-__`, exactly 10 digits).
- Logout and changing the phone number after sign-in.
- Editing registration data after confirmation.
- Localization (the language switcher in the DS header is hidden; Russian only).
- Keyboard accessibility (mobile-only, per project rules).

## User Journey

The user opens the app → the `/onboarding` index guard checks state. With a valid refresh token,
the app refreshes the session and opens `/home` right away. Otherwise the onboarding form appears.
The user fills in name and phone, picks a block and role, enters an apartment number → "Next"
becomes enabled → they tap it → the server "sends" the code (mock) and opens a session keyed by
the number → the app moves to `/onboarding/verify`. There the user sees their number and four
cells, and types the code (the cells advance on their own); once four digits are in, the code is
checked automatically. On `1234` the resident is registered (mock), a token pair is issued, and the
app moves to `/home`. On a wrong code the single attempt for that code is spent; a new attempt needs
a fresh resend. The resend timer lives on the server per number and does not reset when the app is
closed. Once resends are exhausted the number is locked for a day (`/onboarding/locked`); when the
lockout ends the user returns to `/onboarding/verify` and can request a fresh code.

## Verification, Resend, and Lockout Behavior (exact parameters)

**Terms:**

- *Sending a code* — `otp.send`: the server generates a fresh 4-digit code for the number (mock,
  never actually delivered). The first send happens on "Next" (or "Send code" after a lockout);
  every send after that is a *resend*.
- *Verification attempt* — `otp.verify`. Each issued code allows **exactly one** attempt. Once it's
  used (whatever the result), no further check against that code is allowed until a new send.
- *Phone* is normalized to E.164 (`+7XXXXXXXXXX`) and serves as the key for the server-side session.

**Cooldown schedule (server-side, per number).** The cooldown is the wait until the next resend
becomes available; it counts down from `resendAvailableAt`, which the server returns:

| Send | sendCount | Cooldown until next resend |
|---|---|---|
| Initial ("Next" / "Send code") | 1 | 60 s |
| Resend 1 | 2 | 120 s |
| Resend 2 | 3 | 300 s |
| Resend 3 | 4 | 600 s |
| Request for a 5th send (4th resend) | — | **number locked for 86 400 s (24 h)** |

- While a cooldown is running: "Didn't get the code? Resend in M:SS" is shown, along with a
  **"Paste code from clipboard"** button (`ButtonAction`).
- When the cooldown hits 0: "Paste code from clipboard" **disappears** and
  `<Button variant="secondary">Resend</Button>` appears.
- "Paste code from clipboard" is **disabled** while the clipboard doesn't hold a string of exactly
  4 digits (`^\d{4}$`); when it does, the button is enabled, and tapping it fills the cells and
  triggers the automatic check.
- A number gets **4 sends total** — the initial send plus 3 resends. Requesting a 5th send returns a
  lockout: the number is locked for 86 400 s (24 h), verification and resend are disabled, and the
  app moves to `/onboarding/locked` with a countdown to unlock.
- When the lockout ends the app moves to `/onboarding/verify`: the cells are empty, the send counter
  is reset (`sendCount = 0`), and the CTA is **"Send code"** (which starts a fresh send with a 60 s
  cooldown).

**Timer source:** `resendAvailableAt` and `lockedUntil` come from the server for the specific
number. The client doesn't store the timer — it only displays the time left from the server. When
the app is closed and reopened, the client restores the screen (`verify` / `locked`) from the saved
`pendingPhone` and pulls the current state through `otp.status` — the timer keeps running, it
doesn't reset.

## Session and Token Refresh

- After a successful check, `resident.register` returns a pair: `accessToken` (lives 3600 s / 1 h)
  and `refreshToken` (lives 2 592 000 s / 30 days), plus their `expiresAt` and a `resident` object.
- On app launch the index guard calls `auth.refresh({ refreshToken })`:
  - valid and not expired → it returns a **new pair** of tokens (rotation) and the app opens
    `/home`;
  - expired or invalid → the tokens are cleared and the app opens `/onboarding/welcome`.
- `/home` is protected: it's reachable only with a valid access token. If the access token expires
  mid-session, a silent `auth.refresh` runs; if the refresh fails → `/onboarding/welcome`.
- Tokens live in a dedicated persistent Zustand store (`authStore`, localStorage):
  `{ accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt, resident }`.
  On web that's localStorage; a later Tauri build will use secure storage (out of scope this
  iteration).

## Routes and Startup Restore Priority

```
/onboarding              -> index guard (no UI), decides where to route
/onboarding/welcome      -> registration form
/onboarding/verify       -> OTP entry
/onboarding/locked       -> 24 h lockout
/home                    -> placeholder (guarded: session required)
```

Index-guard priority on startup:

1. A `refreshToken` exists and isn't expired → `auth.refresh` → success → `/home`.
2. Otherwise a `pendingPhone` exists → `otp.status(phone)`:
   - `lockedUntil` in the future → `/onboarding/locked`;
   - an active code session (an unspent code / a running cooldown) → `/onboarding/verify`;
   - otherwise → `/onboarding/welcome`.
3. Otherwise → `/onboarding/welcome`.

### Hard navigation lock during a lockout

While `lockedUntil` for `pendingPhone` is in the future, the lockout takes priority over everything
else. A global guard forces `/onboarding/locked` on **any** navigation attempt:

- typing any URL directly (`/onboarding/welcome`, `/onboarding/verify`, `/home`, `/`) → redirect to
  `/onboarding/locked`;
- reloading the app → `/onboarding/locked` again;
- a system back swipe / the browser's back button → the user stays on `/onboarding/locked` (the
  lockout screen can't be left).

The lock state is server truth (`otp.status` → `lockedUntil`); the client can't get around it by
clearing localStorage for the same number. The guard lifts only once `lockedUntil` passes — at which
point the app moves to `/onboarding/verify` (see the schedule above). Exception: a valid refresh
token takes priority (the lockout only affects users who haven't signed in through onboarding).

## Success Metrics

- The funnel is instrumented: `form submitted → code issued → code confirmed → resident registered
  → session active` — both throughput and drop-off points are measurable.
- On the mock: 100% of forms with the correct code `1234` reach `/home`; a returning user with a
  valid refresh token reaches `/home` without onboarding.
- Target onboarding completion ≥ 80% after the real WhatsApp integration.

## Non-functional Requirements

- **Form (welcome):** state and validation run on **TanStack Form**; the "Next" button's enabled
  state derives from form validity.
- **Server state:** every API call goes through **TanStack Query**; keys come from the `otpKeys` and
  `authKeys` factories. Mutations: `otp.send`, `otp.verify`, `resident.register`, `auth.refresh`;
  query: `otp.status`.
- **UI / flow state:** **Zustand** (`persist`, localStorage). `onboardingStore` holds the
  registration draft (`name, phone, block, apartment, role`) and `pendingPhone`. `authStore` holds
  the tokens. The timer isn't duplicated in the store — it's derived from the server's
  `resendAvailableAt` / `lockedUntil`.
- **State boundaries:** server truth → Query, navigation → Router, UI / flow → Zustand
  (per `.claude/rules/state-boundaries.md`).
- **Layout:** single column, `max-width: 480px`, `100svh`; header sticky at the top, "Next"
  sticky/fixed at the bottom (welcome); semantic tags (`<form>`, `<header>`, `<footer>`,
  `<fieldset>` for the block and role choices).
- **Clipboard:** 4-digit code detection via the Clipboard API (`navigator.clipboard.readText`),
  polled on focus / screen visibility change.
- **Mock server:** per-number session state lives in the api process memory
  (`{ code, sendCount, resendAvailableAt, verifyUsed, lockedUntil, verified, refreshToken }`). That's
  enough for the mock; a real backend will persist it in a database. Tokens are opaque strings,
  validated server-side by their lifetime.

## Field Validation (welcome)

- **Name:** non-empty after trim, 2–60 characters.
- **Phone:** `+7` plus exactly 10 digits (mask `+7 (___) ___-__-__`); valid once all 10 digits are
  present; normalized to `+7XXXXXXXXXX`.
- **Block:** exactly one value from 1 to 4.
- **Apartment:** digits only, within the selected block's range:
  - block 1 → 1 to 70
  - block 2 → 71 to 139
  - block 3 → 1 to 63
  - block 4 → 64 to 126
- **Role:** `owner` | `tenant` (exactly one).
- **OTP code:** 4 cells, each taking a single digit (`0–9`); the correct code is `1234`.

## Dependencies

- Add the `@tanstack/react-form` package (not installed yet).
- New mock tRPC procedures in `apps/api/src/router.ts`: `otp.send`, `otp.status`, `otp.verify`,
  `resident.register`, `auth.refresh`.
- New design-system components from `design/*.pen` (the code currently has only `Button` and
  `Icon`): a text `Input` (with icon), `OtpInput` (a cell), `SectionHeader`, `WelcomeCard`,
  `BlockCard` (selectable), `OptionRow` (selectable), `InfoCallout`, `ScreenHeader`, `Divider`; plus
  a `variant` prop on `Button` (`action` by default | `secondary`).
- Clipboard API, Zustand `persist`.

## Open Questions

None — every threshold, format, and timing is fixed above. Exact message copy (including the lockout
screen text and the wrong-code error) comes from the `design/home-screen.pen` design during layout —
an implementation detail, not a blocker.
