# Onboarding — Resident Registration and Phone Verification

## Problem and Goal

A resident's first entry into the "Raiymbek Park" app. Before using the app, a person introduces
themselves once (name, phone, block, apartment, role) and proves they own their phone number by
entering a code delivered over SMS. On success they are registered, signed in, and land on the home
screen; a returning resident who is already signed in skips onboarding entirely.

The goal is to carry a new resident from the registration form to a verified phone number, a saved
profile, and an authenticated session in a single pass. The verification code is issued and checked by
the API and delivered over an SMS gateway; a successful check establishes a Firebase session. See
ADR 013 for the gateway and session mechanics.

## Users

New residents — owners and tenants of apartments in the complex — opening the app on a phone for the
first time. One person equals one phone number. A returning resident who is already signed in skips
onboarding and goes straight to home.

## Scope

### In scope

- **Welcome screen** (`/onboarding/welcome`) — the registration form, opened by a welcome hero (a
  greeting title and a short description of what the app offers residents). It collects name, phone,
  block (one of 1–4), apartment number, and role (owner or tenant). Every field is required. The
  "Далее" (Next) button stays enabled throughout; on submit, any validation errors surface as
  toasts. Each field shows an inline
  success check when its value is valid, and an error state once it is invalid after the user has
  interacted with it. The block selector presents all four blocks, each labelled with its residential
  floor count. A privacy notice states the resident's contact details are hidden from other residents
  and reachable only by administration; the phone field carries a closed-eye indicator reinforcing
  this.
- **Verification screen** (`/onboarding/verification`) — entry of the 6-digit SMS code in a single
  masked field (`xxx - xxx`) that accepts digits only. The entered phone number is shown in the format
  `+7 707 123 45 67`. The code is checked automatically the moment all six digits are present — no
  button tap is required. While the check is in flight, a progress notice ("Ваш код отправляется на
  проверку…") is shown and the field and bottom actions are disabled. Below the field a resend control
  lets the resident request a new code, gated by an escalating cooldown; a back control returns to the
  registration screen.
- **Home screen** (`/home`) — reachable only by a signed-in resident. Its content is out of scope for
  this feature.
- **Session** — an authenticated Firebase session established once the SMS code is confirmed. A
  signed-in resident is taken to home and is kept out of the onboarding screens.

### What's NOT included

- Home screen content (guarded entry only; its content is owned elsewhere).
- Signing out, changing the phone number, or editing registration data after sign-in.
- Localization — Russian only; the UI language switcher is not part of this feature.
- Keyboard accessibility (mobile-only).

## User Journey

The resident opens the app. If already signed in, they go straight to home. Otherwise the
registration form appears. They fill in their name and phone, pick a block and a role, and enter an
apartment number. "Далее" stays enabled; tapping it validates the form and, on any error, surfaces it
as a toast — otherwise it sends an SMS code to their number over the gateway, then opens the
verification screen. There they see their
number and a single masked code field and type the code; once all six digits are in, the code is
checked automatically. With the correct code the resident's profile is saved and they are signed in,
and the app moves to home. A wrong code shows an error and clears the field so the resident can
retype. If the resident does not receive the code, an escalating cooldown gates a resend; once it
elapses they can request a new code. A returning resident who is already signed in is taken to home and
never sees the onboarding screens.

## Phone Number Handling

The phone field is a free-form input (no fixed mask) and defaults to the value `+7`. It is validated
with libphonenumber-js using Kazakhstan (`KZ`) as the default region:

- A Kazakhstan domestic number written as `8XXXXXXXXXX` (no `+`) normalizes to the canonical `+7…`
  E.164 form.
- A number written with an explicit country code (`+1`, `+44`, …) is accepted as that international
  number.
- The phone is valid once it is a valid phone number for its resolved region, and is stored in
  canonical E.164 form for verification and registration.

## Verification and Resend Rules

- **Code delivery.** Submitting the registration form asks the API to send a 6-digit SMS code to the
  entered number; the API delivers it over the smsc.kz SMS gateway (see ADR 013).
- **Automatic check.** The code is verified the moment all six digits are entered — without a separate
  confirm action. While the verification request is in flight, a progress notice ("Ваш код
  отправляется на проверку…") is shown and the field, the back control, and the resend control are
  disabled.
- **Resend.** A resend control below the code field labelled "Запросить код повторно" (Request a new
  code) lets the resident request a fresh code. It is gated by an escalating cooldown that grows with
  each attempt: **60 s → 120 s → 300 s → 600 s**, capping at 600 s for any further resend. The cooldown
  starts active (60 s) the moment the verification screen opens. While the cooldown runs, the resend
  button is disabled and shows the remaining time as an `M:SS` countdown ("Запросить код повторно через
  M:SS"). When the cooldown reaches zero, the button becomes enabled. After each successful resend the
  cooldown restarts at the next step in the schedule, the field clears, and a new code is on its way.

## Registration and Session

- Confirming the SMS code establishes the Firebase session: the API returns a custom token that the
  client exchanges for a session, yielding the Firebase ID token (see ADR 013).
- With the session established, the resident's profile (name, phone, block, apartment, role) is saved
  under their Firebase user id via an authenticated request that carries the Firebase ID token. The
  server requires a verified identity (a valid ID token) and rejects the request otherwise.
- On a successful save the resident is signed in and the app navigates to home.
- The phone stored with the profile is the verified number tied to the signed-in identity.

## Route Guards

- The onboarding screens are for unauthenticated residents. A signed-in resident who lands on any
  onboarding entry is redirected to home.
- The verification screen requires a pending code request — a verification that was started from the
  registration form. Reaching it without a pending request (e.g. a direct visit or a relaunch)
  redirects to the welcome/registration screen.
- The locked screen requires a phone number in the in-progress registration draft. Reaching it
  without one (e.g. a direct visit) redirects to the welcome/registration screen.
- The home screen requires a signed-in resident. An unauthenticated visit to home redirects to the
  welcome/registration screen.

## Error States

- **Send failure** (welcome): if sending the code fails, an error message is shown, the app stays on
  the registration screen, and "Далее" is available again to retry.
- **Wrong code** (verification): an invalid or expired code shows a wrong-code error and clears the
  field so the resident can retype.
- **Network failure during the check** (verification): a failure that is not a wrong-code response
  shows a connection error and clears the field for another attempt.
- **Registration failure** (verification): if saving the profile fails after the code is confirmed,
  an error message is shown together with a "Повторить попытку" (Retry) action that re-attempts the
  save; the app stays on the verification screen.
- **Resend failure** (verification): if requesting a new code fails, a connection error is shown and
  the resident can try the resend again.
- **Too many attempts** (welcome, verification, or resend): when the API rejects a send with a
  rate-limit (too-many-requests) error, the resident is taken to a dedicated "Доступ заблокирован"
  (Access locked) screen. It shows an illustration, an explanatory message, and a "Повторить" (Retry)
  action that requests a fresh code — moving to the verification screen on success and staying on the
  locked screen (with an error message) otherwise. The lock is enforced by the server's send rate
  limit; the app keeps no countdown of its own.

## Field Validation (welcome)

- **Name:** non-empty after trimming, 2–60 characters.
- **Phone:** a valid phone number per libphonenumber-js (default region `KZ`); stored in canonical
  E.164 form. Default field value `+7`.
- **Block:** exactly one of 1–4.
- **Apartment:** digits only, within the selected block's range:
  - block 1 → 1–70
  - block 2 → 71–139
  - block 3 → 1–63
  - block 4 → 64–126
- **Role:** owner or tenant (exactly one).
- **Code:** 6 digits (`0–9`), entered in a single masked field (`xxx - xxx`); non-digits are ignored.

## Experience Requirements

- **Mobile-first, single column.** A screen header stays at the top while the content scrolls
  beneath it. The primary action ("Далее" on welcome) sits at the end of the form.
- **Russian only** this iteration.

## Success Metrics

- The funnel is measurable end to end: form submitted → code sent → code confirmed → profile saved →
  resident signed in, with both throughput and drop-off visible.
- A resident who completes the form and enters the correct SMS code reaches home; a returning,
  signed-in resident reaches home without onboarding.

## Dependencies

- **The API's `otp.send` / `otp.verify` procedures and the smsc.kz SMS gateway** — code delivery,
  verification, and the custom token that establishes the Firebase session (Firebase ID token). See
  ADR 013 for the delivery and session mechanics and ADR 010 for the retained ID-token identity model.
- **libphonenumber-js** — phone parsing, normalization, and validation (default region `KZ`).
- The profile-save API endpoint that persists the resident under their Firebase user id.

## Open Questions

None — every threshold, format, and timing is fixed above.
