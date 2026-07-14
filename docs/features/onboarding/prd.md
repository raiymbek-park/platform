# Onboarding — Resident Registration and Sign-in

## Problem and Goal

A resident's first entry into the "Raiymbek Park" app. Before using the app, a person introduces
themselves once (name, phone, block, apartment, role) and establishes an identity the app can trust.
On success they are registered, signed in, and land on the home screen; a returning resident who is
already signed in skips onboarding entirely.

Delivery of an SMS code to a Kazakhstan mobile number is outside the app's control: it depends on the
gateway account's route to the resident's carrier, and for part of the country that route does not
carry. A resident whose carrier never delivers the code cannot register at all, so the SMS code cannot
be the only way in.

The goal is to carry a new resident from the registration form to a saved profile and an authenticated
session in a single pass, over whichever sign-in channel works for them. See ADR 015 for the sign-in
channels and ADR 013 for the SMS gateway and session mechanics.

## Users

New residents — owners and tenants of apartments in the complex — opening the app on a phone for the
first time. One person equals one identity: a phone proven over SMS, or a Google account. A returning
resident who is already signed in skips onboarding and goes straight to home.

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
  registration screen. The screen also carries the **Google control** ("Продолжить с Google") — the way
  in for a resident whose code never arrives. It is available from the moment the screen opens, and
  carries Google's official mark per their branding guidelines.
- **Home screen** (`/home`) — reachable only by a signed-in resident. Its content is out of scope for
  this feature.
- **Session** — an authenticated Firebase session established by either sign-in channel. A signed-in
  resident is taken to home and is kept out of the onboarding screens.

### What's NOT included

- Home screen content (guarded entry only; its content is owned elsewhere).
- Signing out, or editing registration data after sign-in.
- **Linking a Google account to an existing SMS identity**, in either direction — the two are separate
  residents (see Sign-in Channels).
- **Changing the phone after registration** — it is fixed at registration on both channels.
- Sign-in with Apple, or any identity provider other than Google.
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
elapses they can request a new code.

A resident whose carrier never delivers the code — the code never arrives, or the send itself fails —
takes the Google control on the same screen instead. They choose a Google account; the app signs them
in on that account and registers them with the details they already filled in on the form, phone
included. The app moves to home.

A returning resident who is already signed in is taken to home and never sees the onboarding screens.

## Sign-in Channels

A resident registers over exactly one **sign-in channel**, chosen at registration and fixed for the
life of the account:

- **SMS channel** — the resident enters the code delivered to the phone they typed on the form. The
  phone is thereby proven to be theirs.
- **Google channel** — the resident signs in with a Google account. It carries an email, never a
  phone. The phone stored with the resident is the one they typed on the form — validated as a real
  phone number by the same registration rules as on the SMS channel.

Both channels are always offered — the Google control does not appear only after a failure, and the SMS
channel is unaffected by the presence of the Google control. Both produce the same authenticated
Firebase session and the same registered resident, with the same profile fields. Every resident has a
phone on record — the form requires one — and the app displays and discloses it identically whichever
channel the resident registered over: no marker, no omission. A phone stored over the Google channel is
**self-declared, not SMS-proven** — the form validates it as a real phone number, but no code has
demonstrated the resident owns it — so a displayed phone carries no implication of SMS verification.
(The sign-in provider stays recoverable from the identity platform per uid, so nothing is recorded
with the resident.)

**One Google account is one resident, separate from any SMS resident.** A resident who registered over
SMS and later uses the Google control lands on a **different account**: a fresh resident with no
history — none of their issues, offers, comments, reactions, or car plates — and the default resident
role. Their SMS account is untouched and still reachable by completing an SMS code on it. Two accounts
may hold the same phone. This is a known limitation of the fixed channel; linking is not offered (see
What's NOT included).

**Neither channel grants a role.** Registration stores only the role the resident picked on the form —
owner or tenant — and elevated roles (manager, administration) exist only as per-uid records written
into the datastore outside the app. A Google account is a new uid with no such record, so it resolves
to a plain resident. The Google channel cannot reach manager or administration, whoever uses it.

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
  client exchanges for a session, yielding the Firebase ID token (see ADR 013). Choosing a Google
  account establishes the same kind of session directly (see ADR 015).
- With the session established, the resident's profile (name, phone, block, apartment, role) is saved
  under their Firebase user id via an authenticated request that carries the Firebase ID token. The
  server requires a verified identity (a valid ID token) and rejects the request otherwise. The form
  details are the same on both channels — the Google channel asks for nothing a second time.
- On a successful save the resident is signed in and the app navigates to home.
- The phone stored with the profile is the number tied to the signed-in identity on the SMS channel,
  and the number entered on the form on the Google channel. The server takes the identity's own number
  whenever the verified token carries one, never a client-sent substitute.

## Route Guards

- The onboarding screens are for unauthenticated residents. A signed-in resident who lands on any
  onboarding entry is redirected to home.
- The verification screen requires a verification started from the registration form — a submitted,
  valid form whose send was attempted, whether it succeeded or failed. Reaching it without one (e.g. a
  direct visit or a relaunch) redirects to the welcome/registration screen. The Google control lives
  behind this guard, so it is only ever reachable with a complete registration draft — which is what
  supplies the resident's details on that channel.
- The locked screen requires a phone number in the in-progress registration draft. Reaching it
  without one (e.g. a direct visit) redirects to the welcome/registration screen.
- The home screen requires a signed-in resident. An unauthenticated visit to home redirects to the
  welcome/registration screen.

## Error States

- **Send failure** (welcome): if sending the code fails, the app opens the verification screen and
  shows the failure there, where the resident can resend or continue with Google. A carrier the gateway
  cannot route to fails at the send, so this is the case the Google control exists for and it must
  reach the screen that carries it. A failed send consumes no resend step and does not count towards
  the send rate limit.
- **Wrong code** (verification): an invalid or expired code shows a wrong-code error and clears the
  field so the resident can retype.
- **Network failure during the check** (verification): a failure that is not a wrong-code response
  shows a connection error and clears the field for another attempt.
- **Registration failure** (verification): if saving the profile fails after the identity is
  established — over either channel — an error message is shown together with a "Повторить попытку"
  (Retry) action that re-attempts the save; the app stays on the verification screen.
- **Google sign-in dismissed** (verification): if the resident closes the Google window or cancels the
  choice, nothing is shown as an error — they chose not to proceed. The verification screen is
  unchanged: the code they typed is still there, the cooldown still runs, and both channels remain
  available.
- **Google sign-in unavailable** (verification): if the sign-in window cannot open at all — the browser
  blocks it, or the resident's environment refuses it — a message says so and the Google control stays
  available. The SMS channel is unaffected.
- **Google network failure** (verification): if the sign-in cannot complete for connection reasons, a
  connection error is shown and the resident can take the Google control again. No resident is
  registered and no session is established, so a retry starts clean.
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

- The funnel is measurable end to end: form submitted → identity established → profile saved →
  resident signed in, with both throughput and drop-off visible, and split by sign-in channel.
- A resident who completes the form and enters the correct SMS code reaches home; a returning,
  signed-in resident reaches home without onboarding.
- **No resident is locked out by their carrier.** A resident whose code never arrives reaches home over
  the Google channel from the screen they are stuck on, without leaving the app or re-entering the
  form.

## Dependencies

- **The API's `otp.send` / `otp.verify` procedures and the smsc.kz SMS gateway** — code delivery,
  verification, and the custom token that establishes the Firebase session (Firebase ID token). See
  ADR 013 for the delivery and session mechanics and ADR 010 for the retained ID-token identity model.
- **Google as an identity provider** — establishes the session on the Google channel. See ADR 015.
- **libphonenumber-js** — phone parsing, normalization, and validation (default region `KZ`).
- The profile-save API endpoint that persists the resident under their Firebase user id.

## Open Questions

None — every threshold, format, and timing is fixed above.
