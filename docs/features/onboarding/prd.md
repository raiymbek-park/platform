# Onboarding — Resident Registration and Phone Verification

## Problem and Goal

A resident's first entry into the "Raiymbek Park" app. Before using the app, a person introduces
themselves once (name, phone, block, apartment, role) and proves they own their phone number by
entering a code delivered over SMS. On success they are registered, signed in, and land on the home
screen; a returning resident who is already signed in skips onboarding entirely.

The goal is to carry a new resident from the registration form to a verified phone number, a saved
profile, and an authenticated session in a single pass, using Firebase Phone Authentication as the
identity provider.

## Users

New residents — owners and tenants of apartments in the complex — opening the app on a phone for the
first time. One person equals one phone number. A returning resident who is already signed in skips
onboarding and goes straight to home.

## Scope

### In scope

- **Welcome screen** (`/onboarding/welcome`) — the registration form. It collects name, phone, block
  (one of 1–4), apartment number, and role (owner or tenant). Every field is required, and the
  "Далее" (Next) button is enabled only once the whole form is valid. Each field shows an inline
  success check when its value is valid, and an error state once it is invalid after the user has
  interacted with it. A reCAPTCHA legal notice (a link to Google's Privacy Policy and Terms) is shown
  in the form.
- **Verification screen** (`/onboarding/verification`) — entry of the 6-digit SMS code across 6
  cells. The entered phone number is shown in the format `+7 707 123 45 67`. Focus advances between
  cells automatically as digits are typed and steps back on backspace from an empty cell. The code is
  checked automatically the moment all six digits are present — no button tap is required. The code
  can also be filled by pasting it from the clipboard. A resend control lets the resident request a
  new code, gated by an escalating cooldown.
- **Home screen** (`/home`) — reachable only by a signed-in resident. Its content is out of scope for
  this feature.
- **Session** — an authenticated Firebase session established once the SMS code is confirmed. A
  signed-in resident is taken to home and is kept out of the onboarding screens.

### What's NOT included

- Home screen content (guarded entry only; its content is owned elsewhere).
- Signing out, changing the phone number, or editing registration data after sign-in.
- Localization — Russian only; the UI language switcher is not part of this feature.
- Keyboard accessibility (mobile-only).
- The floating reCAPTCHA badge — it is suppressed in favour of the in-form reCAPTCHA notice.

## User Journey

The resident opens the app. If already signed in, they go straight to home. Otherwise the
registration form appears. They fill in their name and phone, pick a block and a role, and enter an
apartment number; "Далее" enables once every field is valid. Tapping it runs an invisible reCAPTCHA
check and sends an SMS code to their number, then opens the verification screen. There they see their
number and six cells and type the code — the cells advance on their own, and once all six digits are
in, the code is checked automatically. With the correct code the resident's profile is saved and they
are signed in, and the app moves to home. A wrong code shows an error and clears the cells so the
resident can retype. If the resident does not receive the code, an escalating cooldown gates a resend;
once it elapses they can request a new code. A returning resident who is already signed in is taken to
home and never sees the onboarding screens.

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

- **Code delivery.** Submitting the registration form sends a 6-digit SMS code to the entered number
  via Firebase Phone Authentication (an invisible reCAPTCHA runs as part of sending).
- **Automatic check.** The code is verified the moment all six cells are filled — by typing or by
  pasting — without a separate confirm action.
- **Paste from clipboard.** A "Вставить код из буфера" (Paste code from clipboard) action appears
  when the clipboard contains exactly 6 standalone digits; the surrounding text is ignored, so a code
  embedded in a message (e.g. "Your code is 123456") is detected. The clipboard is re-read whenever
  the app regains focus, so copying the code elsewhere and returning surfaces the paste action without
  any manual step. If the clipboard cannot be read or access is denied, the paste action simply does
  not appear — no error is shown.
- **Resend cooldown.** A resend control labelled "Запросить пин повторно" (Request a new code) lets
  the resident request a fresh code. It is gated by an escalating cooldown that grows with each
  attempt: **60 s → 120 s → 300 s → 600 s**, capping at 600 s for any further resend. The cooldown
  starts active (60 s) the moment the verification screen opens. While the cooldown runs, the resend
  button is disabled and shows the remaining time as an `M:SS` countdown ("Запросить пин повторно
  через M:SS"). When the cooldown reaches zero, the button becomes enabled. After each successful
  resend the cooldown restarts at the next step in the schedule, the cells clear, and a new code is on
  its way.
- **Resend vs. paste.** When a 6-digit clipboard code is detected, the paste action is shown in place
  of the resend button; otherwise the resend button (enabled or counting down) is shown.

## Registration and Session

- After the SMS code is confirmed, the resident's profile (name, phone, block, apartment, role) is
  saved under their Firebase user id via an authenticated request that carries the Firebase ID token.
  The server requires a verified identity (a valid ID token) and rejects the request otherwise.
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
  cells so the resident can retype.
- **Network failure during the check** (verification): a failure that is not a wrong-code response
  shows a connection error and clears the cells for another attempt.
- **Registration failure** (verification): if saving the profile fails after the code is confirmed,
  an error message is shown together with a "Повторить попытку" (Retry) action that re-attempts the
  save; the app stays on the verification screen.
- **Resend failure** (verification): if requesting a new code fails, a connection error is shown and
  the resident can try the resend again.
- **Too many attempts** (welcome, verification, or resend): when Firebase Phone Authentication rejects
  a request with a rate-limit (too-many-requests) error, the resident is taken to a dedicated "Доступ
  заблокирован" (Access locked) screen. It shows an illustration, an explanatory message, and a
  "Повторить" (Retry) action that requests a fresh code — moving to the verification screen on success
  and staying on the locked screen (with an error message) otherwise. The lock is enforced by Firebase;
  the app keeps no countdown of its own.

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
- **Code:** 6 cells, one digit (`0–9`) each.

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

- **Firebase Phone Authentication** — SMS code delivery, invisible reCAPTCHA, and the authenticated
  session (Firebase ID token).
- **libphonenumber-js** — phone parsing, normalization, and validation (default region `KZ`).
- The profile-save API endpoint that persists the resident under their Firebase user id.

## Open Questions

None — every threshold, format, and timing is fixed above.
</content>
</invoke>
