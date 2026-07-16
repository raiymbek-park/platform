# Onboarding — Resident Registration and Sign-in

## Problem and Goal

A resident's first entry into the "Raiymbek Park" app. Before using the app, a person introduces
themselves once (name, block, apartment, role, and a phone) and establishes an identity the app can
trust. On success they are registered, signed in, and land on the home screen; a returning resident
who is already signed in and registered skips onboarding entirely.

Delivery of an SMS code to a Kazakhstan mobile number is outside the app's control: it depends on the
gateway account's route to the resident's carrier, and for part of the country that route does not
carry. A resident whose carrier never delivers the code cannot register at all, so the SMS code cannot
be the only way in.

The goal is to carry a new resident from a chosen sign-in method to a saved profile and an
authenticated session in a single pass, over whichever channel works for them. The resident picks the
channel up front rather than discovering a dead end partway through. See ADR 015 for the Google
sign-in channel and ADR 013 for the SMS gateway and session mechanics.

## Users

New residents — owners and tenants of apartments in the complex — opening the app on a phone for the
first time. One person equals one identity: a phone proven over SMS, a Google account, or a Facebook
account. A returning resident who is already signed in and registered skips onboarding and goes
straight to home.

## Scope

### In scope

- **Sign-in method screen** (`/onboarding/auth-method`) — the first screen after the language choice.
  It opens with a welcome hero (a greeting title and a short description of what the app offers
  residents) and presents the three sign-in methods as a single-choice list: **По номеру телефона**
  (labelled "Только для операторов Kcell/Activ"), **Google**, and **Facebook** (both labelled "Быстрый
  вход с аккаунтом"). The phone method is preselected. Exactly one method is selected at a time. A
  "Выбрать" (Select) action commits the choice; a back control returns to the language screen. The
  chosen method is what the rest of onboarding branches on.
- **Registration form** (`/onboarding/registration`) — collects name, phone, block (one of 1–4),
  apartment number, and role (owner or tenant). A "Далее" (Next) action submits it. The block selector
  presents all four blocks, each labelled with its residential floor count: blocks 1 and 2 have 10
  residential floors, blocks 3 and 4 have 9. A privacy notice states the resident's contact details are
  hidden from other residents and reachable only by administration; the phone field carries a
  closed-eye indicator reinforcing this. What the form expects depends on the chosen channel — see
  Sign-in Channels and Field Validation.
- **Verification screen** (`/onboarding/verification`) — reached only on the SMS channel. Entry of the
  6-digit SMS code in a single masked field (`xxx - xxx`). The entered phone number is shown in the
  format `+7 707 123 45 67`. Below the field a resend control lets the resident request a new code,
  gated by an escalating cooldown; a back control returns to the registration form. The screen carries
  **no social sign-in control** — the channel was chosen before the form. See Verification and Resend
  Rules.
- **Locked screen** (`/onboarding/locked`) — where a resident lands when the server's send rate limit
  rejects a code request.
- **Home screen** (`/home`) — reachable only by a signed-in, registered resident. Its content is out of
  scope for this feature.
- **Session** — an authenticated Firebase session established by any of the three sign-in channels. A
  signed-in, registered resident is taken to home and is kept out of the onboarding screens.

### What's NOT included

- Home screen content (guarded entry only; its content is owned elsewhere).
- Signing out, or editing registration data after sign-in.
- **Linking accounts across channels**, in any direction — each channel produces a separate resident
  (see Sign-in Channels).
- **Changing the phone after registration** — it is fixed at registration on every channel.
- **Changing the sign-in method after registration** — it is fixed at registration.
- Sign-in with Apple, or any identity provider other than Google and Facebook.
- Localization — Russian only; the UI language switcher is owned by the i18n feature.
- Keyboard accessibility (mobile-only).

## User Journey

The resident opens the app. If already signed in and registered, they go straight to home. Otherwise,
after choosing a language, they reach the sign-in method screen: a welcome hero and three ways in, with
"По номеру телефона" preselected. They pick one and tap "Выбрать".

**Choosing the phone method** opens the registration form with an empty, editable phone field. They
fill in their name and phone, pick a block and a role, and enter an apartment number. "Далее" stays
enabled; tapping it validates the form and, on any error, surfaces it as a toast — otherwise it sends
an SMS code to their number over the gateway and opens the verification screen. There they see their
number and a single masked code field and type the code; once all six digits are in, the code is
checked automatically. With the correct code the resident's profile is saved and they are signed in,
and the app moves to home. A wrong code shows an error and clears the field so the resident can
retype. If the resident does not receive the code, an escalating cooldown gates a resend; once it
elapses they can request a new code. If the code never arrives at all, the back control returns them to
the form, and from there to the method screen where Google and Facebook are waiting.

**Choosing Google or Facebook** opens that provider's sign-in window straight away. Once the resident
chooses an account, the app signs them in and opens the registration form with their name filled in
from the provider's profile — editable, in case it is not the name they want on record, and never
overwriting a name they already typed. The phone field is optional on this channel. They complete the remaining fields and tap "Далее";
the profile is saved and the app moves to home. There is no code to enter — the provider has already
established the identity.

A returning resident who is already signed in and registered is taken to home and never sees the
onboarding screens.

## Sign-in Channels

A resident registers over exactly one **sign-in channel**, chosen on the sign-in method screen and
fixed for the life of the account:

- **SMS channel** — the resident enters the code delivered to the phone they typed on the form. The
  phone is thereby proven to be theirs. A phone is required on this channel.
- **Google channel** — the resident signs in with a Google account. It carries an email, never a phone.
- **Facebook channel** — the resident signs in with a Facebook account. It carries no phone either.

All three methods are offered up front, before any details are entered. Each produces the same
authenticated Firebase session and the same registered resident, with the same profile fields. (The
sign-in provider stays recoverable from the identity platform per uid, so nothing is recorded with the
resident.)

**The identity is established at a different point on each channel.** On the SMS channel the session
appears only after the code is confirmed — after the form. On the social channels it appears when the
resident picks an account — before the form. So a resident on a social channel sits on the registration
form already signed in but not yet registered; the route guards account for this (see Route Guards).

**Phone is not guaranteed on the social channels.** The form requires a phone on the SMS channel and
leaves it optional on the Google and Facebook channels, so a resident registered over a social channel
may have **no phone on record**. Any surface that shows or acts on a resident's phone must handle its
absence rather than assume one exists.

**A phone is only proven on the SMS channel.** A phone entered on a social channel is
**self-declared** — the form validates it as a real phone number, but no code has demonstrated the
resident owns it. The app displays and discloses a stored phone identically whichever channel it came
from — no marker, no omission — so a displayed phone carries no implication of SMS verification.

**One provider account is one resident, separate from every other channel.** A resident who registered
over SMS and later signs in with Google or Facebook lands on a **different account**: a fresh resident
with no history — none of their issues, offers, comments, reactions, or car plates — and the default
resident role. The same holds between Google and Facebook, and between two accounts on the same
provider. The original account is untouched and still reachable by signing in over its own channel.
Several accounts may hold the same phone. This is a known limitation of the fixed channel; linking is
not offered (see What's NOT included).

**No channel grants a role.** Registration stores only the role the resident picked on the form — owner
or tenant — and elevated roles (manager, administration) exist only as per-uid records written into the
datastore outside the app. A social account is a new uid with no such record, so it resolves to a plain
resident. Neither social channel can reach manager or administration, whoever uses it.

## Phone Number Handling

The phone field is a free-form input (no fixed mask). It starts empty, showing the placeholder
`+7 701 123 44 55` as a format hint — a Kcell number, so the example never contradicts the carrier
guidance below. The placeholder is a hint, never a value: an untouched field submits as empty. It is
validated
with libphonenumber-js using Kazakhstan (`KZ`) as the default region:

- A Kazakhstan domestic number written as `8XXXXXXXXXX` (no `+`) normalizes to the canonical `+7…`
  E.164 form.
- A number written with an explicit country code (`+1`, `+44`, …) is accepted as that international
  number.
- The phone is valid once it is a valid phone number for its resolved region, and is stored in
  canonical E.164 form for verification and registration.

### Carrier guidance on the SMS channel

The gateway's route reliably carries only to Kcell and Activ. Their assigned prefixes are **701** and
**702** (Kcell) and **775** and **778** (Activ); the remaining Kazakhstan mobile prefixes belong to
other carriers (700/708 — Altel, 705/706/771/776/777 — Beeline, 707/747 — Tele2).

**A prefix outside that list is a warning, never a rejection.** Kazakhstan has offered mobile number
portability since 1 January 2016, so a prefix no longer identifies the carrier: a `+7 705…` number may
have been ported *into* Kcell and receive the code fine, while a `+7 701…` number may have been ported
*away* and never receive it. Rejecting by prefix would lock out residents whose code would have
arrived.

So on the SMS channel, a phone whose prefix is outside the Kcell/Activ list shows a warning that the
code may not arrive and that Google or Facebook is the more reliable way in — and "Далее" still sends
the code. The sign-in method screen carries the same guidance as a label on the phone method
("Только для операторов Kcell/Activ"). The prefix is not checked at all on the social channels, where
the phone is optional and no code is sent.

## Verification and Resend Rules

- **Code delivery.** Submitting the registration form on the SMS channel asks the API to send a 6-digit
  SMS code to the entered number; the API delivers it over the smsc.kz SMS gateway (see ADR 013).
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

- **SMS channel.** Confirming the code establishes the Firebase session: the API returns a custom token
  that the client exchanges for a session, yielding the Firebase ID token (see ADR 013). The profile is
  saved immediately afterwards, and the resident goes to home.
- **Social channels.** Choosing an account in the provider's window establishes the same kind of
  session directly (see ADR 015), before the form is filled. The profile is saved when the resident
  submits the form, and the resident goes to home.
- With the session established, the resident's profile (name, phone, block, apartment, role) is saved
  under their Firebase user id via an authenticated request that carries the Firebase ID token. The
  server requires a verified identity (a valid ID token) and rejects the request otherwise.
- On a successful save the resident is registered and the app navigates to home.
- The phone stored with the profile is the number tied to the signed-in identity on the SMS channel,
  and the number entered on the form — if any — on the social channels. The server takes the identity's
  own number whenever the verified token carries one, never a client-sent substitute.

## Route Guards

- **Registered is what unlocks home — not merely signed in.** A social-channel resident is signed in
  from the moment they pick an account, before any profile exists, so a guard keyed on the session
  alone would bounce them off the very form they need to complete.
  - A signed-in resident **with** a saved profile who lands on any onboarding entry is redirected to
    home.
  - A signed-in resident **without** a saved profile is sent to the registration form, with their
    provider name prefilled again. This is how an abandoned social registration resumes: closing the
    app mid-form and reopening it returns them to the form, not to home and not to a fresh start.
  - The home screen requires a signed-in **and registered** resident. Any other visit to home redirects
    into onboarding.
- The sign-in method screen requires a language choice. Reaching it without one redirects to the
  language screen.
- The registration form requires a chosen sign-in method. Reaching it without one (e.g. a direct visit)
  redirects to the sign-in method screen. On a social channel it additionally requires an established
  session — the provider window runs before the form, so arriving without a session means the sign-in
  never completed.
- The verification screen requires a verification started from the registration form — a submitted,
  valid form whose send was attempted, whether it succeeded or failed. Reaching it without one (e.g. a
  direct visit or a relaunch) redirects to the registration form.
- The locked screen requires a phone number in the in-progress registration draft. Reaching it without
  one (e.g. a direct visit) redirects to the registration form.

## Error States

- **Social sign-in dismissed** (sign-in method screen): if the resident closes the provider window or
  cancels the choice, nothing is shown as an error — they chose not to proceed. The screen is
  unchanged: their method selection stands and all three methods remain available.
- **Social sign-in unavailable** (sign-in method screen): if the provider window cannot open at all —
  the browser blocks it, or the resident's environment refuses it — a message says so and the screen
  stays as it is. The other methods are unaffected.
- **Social network failure** (sign-in method screen): if the sign-in cannot complete for connection
  reasons, a connection error is shown and the resident can take the method again. No resident is
  registered and no session is established, so a retry starts clean.
- **Send failure** (registration form, SMS channel): if sending the code fails, the app opens the
  verification screen and shows the failure there, where the resident can resend or go back and switch
  to a social method. A carrier the gateway cannot route to fails at the send. A failed send does not
  advance the resend schedule and does not count towards the hourly send allowance — but it still
  respects the per-send interval, so a number that keeps failing cannot be resent faster than once per
  interval and cannot drain the paid SMS budget.
- **Wrong code** (verification): an invalid or expired code shows a wrong-code error and clears the
  field so the resident can retype.
- **Network failure during the check** (verification): a failure that is not a wrong-code response
  shows a connection error and clears the field for another attempt.
- **Registration failure** (registration form or verification): if saving the profile fails after the
  identity is established — over any channel — an error message is shown together with a "Повторить
  попытку" (Retry) action that re-attempts the save; the app stays on the screen it is on. On a social
  channel the session survives, so the retry does not re-open the provider window.
- **Resend failure** (verification): if requesting a new code fails, a connection error is shown and
  the resident can try the resend again.
- **Too many attempts** (registration form, verification, or resend): when the API rejects a send with
  a rate-limit (too-many-requests) error, the resident is taken to a dedicated "Доступ заблокирован"
  (Access locked) screen. It shows an illustration, an explanatory message, and a "Повторить" (Retry)
  action that requests a fresh code — moving to the verification screen on success and staying on the
  locked screen (with an error message) otherwise. The lock is enforced by the server's send rate
  limit; the app keeps no countdown of its own.

## Field Validation

### Sign-in method screen

- **Method:** exactly one of phone, Google, or Facebook. The phone method is selected when the screen
  opens, so a choice is always present and "Выбрать" always has something to commit.

### Registration form

The "Далее" action stays enabled whatever the form's state; validation runs on submit and reports
failures as toasts rather than by disabling the action. A field shows an inline success check once its
value is valid, and an error state once it is invalid and the resident has interacted with it.

- **Name:** non-empty after trimming, 2–60 characters. The same length rules apply whatever the source.
  On the social channels the provider's profile name fills the field, and the field remains editable.
  **A name the resident already typed wins over the provider's.** The provider name fills an empty
  field only — it never overwrites a draft, because a resident who typed a name chose it deliberately,
  and the provider's is a convenience for the field they left blank. A provider that supplies no name
  leaves an empty field empty.
- **Phone:** a valid phone number per libphonenumber-js (default region `KZ`); stored in canonical
  E.164 form. The field starts empty behind the placeholder `+7 701 123 44 55`.
  - **SMS channel:** required. A prefix outside 701/702/775/778 warns but does not block (see Carrier
    guidance).
  - **Social channels:** optional — an empty field is valid and the resident registers with no phone.
    A non-empty value must still be a valid phone number; any carrier is accepted with no warning.
- **Block:** exactly one of 1–4.
- **Apartment:** digits only, within the selected block's range:
  - block 1 → 1–70
  - block 2 → 71–139
  - block 3 → 1–63
  - block 4 → 64–126
- **Role:** owner or tenant (exactly one).

### Verification screen

- **Code:** 6 digits (`0–9`), entered in a single masked field (`xxx - xxx`); non-digits are ignored.

## Experience Requirements

- **Mobile-first, single column.** A screen header stays at the top while the content scrolls
  beneath it. The primary action ("Выбрать" on the method screen, "Далее" on the form) sits at the end
  of the content, paired with a back control.
- **Russian only** this iteration.

## Success Metrics

- The funnel is measurable end to end: method chosen → identity established → profile saved → resident
  signed in, with both throughput and drop-off visible, and split by sign-in channel.
- A resident who picks the phone method, completes the form, and enters the correct SMS code reaches
  home; a returning, registered resident reaches home without onboarding.
- **No resident is locked out by their carrier.** A resident whose code never arrives reaches home over
  a social channel without leaving the app, and a resident on a non-Kcell/Activ number is steered
  there before they spend an SMS attempt — but is never blocked from trying.
- **The method choice is visible.** How residents distribute across the three channels is measurable,
  so the carrier problem's real size is known rather than assumed.

## Dependencies

- **The API's `otp.send` / `otp.verify` procedures and the smsc.kz SMS gateway** — code delivery,
  verification, and the custom token that establishes the Firebase session (Firebase ID token). See
  ADR 013 for the delivery and session mechanics and ADR 010 for the retained ID-token identity model.
- **Google as an identity provider** — establishes the session on the Google channel. See ADR 015.
- **Facebook as an identity provider** — establishes the session on the Facebook channel. It depends on
  a Facebook app (App ID + secret) registered with the provider and enabled in Firebase Authentication.
  That provisioning is out-of-band and is not verified by CI: the app builds and deploys with it
  absent, and the channel then fails for every resident who picks it rather than erroring at deploy.
- **libphonenumber-js** — phone parsing, normalization, and validation (default region `KZ`).
- The profile-save API endpoint that persists the resident under their Firebase user id, and a way for
  the client to tell a signed-in resident with a profile from one without.
- **The language choice** (i18n feature) — precedes the sign-in method screen.

## Open Questions

None — every threshold, format, and timing is fixed above.
