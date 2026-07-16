# 016. Facebook sign-in as a third resident sign-in channel

**Date:** 2026-07-16
**Status:** accepted — amends ADR 015 by adding a third sign-in channel beside Google (ADR 013's SMS
OTP mechanism and ADR 010's Firebase ID-token trust model are unchanged)

## Context

ADR 015 added Google because the smsc.kz account has no carrier route to Beeline (705, 771, 776) or
Tele2/Altel (707, 708, 747) — every send returns SMSC `error 8 "can't to deliver"`. That remedy holds,
but it substitutes one prerequisite for another: a resident locked out by their carrier is only rescued
if they hold a **Google account** and are willing to sign in with it. Google is the most common account
in this complex, not a universal one.

The gap is the same shape as the original: a resident with no route and no Google account has no way in,
and the flyers pointing them at the app are already posted. Nothing about that resident is exceptional —
they are simply on the wrong carrier and outside the wrong ecosystem.

Two further forces shaped the timing:

- **The channel choice moved up front.** #95 replaced the "discover the dead end, then find a way out"
  flow with a sign-in method screen shown before the registration form. Once the resident is asked to
  *choose* a channel, the cost of a thin channel list is paid at the very first decision — the screen
  either offers a way in or it does not.
- **The second channel had already been generalized.** ADR 015 shipped Google as a concrete provider.
  #95 refactored it into a `SocialProvider` parameter (`'google' | 'facebook'`) over Firebase
  `signInWithPopup`, so a third channel is a provider entry and an icon, not a new code path.

Constraints are inherited from ADR 015 and unchanged: no legal entity, no БИН, and no fee may sit on the
critical path; the phone stays mandatory on every channel (`registerInputSchema`, libphonenumber-js with
the `KZ` region), so no channel produces a resident without a usable phone.

## Options Considered

### Option 1: Google alone (status quo)

- **Pros:** Nothing to build, provision, or maintain. One social dependency, one consent screen.
- **Cons:** Leaves the residual lockout in place — no route *and* no Google account means no way in.
  Now that the method screen asks the resident to choose up front, that resident is shown a list on
  which nothing applies to them.

### Option 2: Sign in with Apple

- **Pros:** Reaches iPhone owners who decline a Google account — a real segment.
- **Cons:** $99/year for the Apple Developer Program on the critical path, which ADR 015 already
  rejected on exactly these grounds. The App Store rule that mandates Sign in with Apple applies to App
  Store submissions, not a web app, so nothing compels it. The cost objection has not changed.

### Option 3: Email and password

- **Pros:** Depends on no third party at all; Firebase Auth supports it natively.
- **Cons:** Invents a credential the resident must create and remember, and shifts password reset,
  verification mail, and its deliverability onto us — the same class of delivery dependency the SMS
  route already proved fragile in this country. It reaches residents no social channel does, but at the
  worst effort-to-reach ratio of the options here.

### Option 4: Facebook as a third channel (chosen)

- **Pros:** Free, and the account is widespread in the target audience — including among residents who
  do not use Google. Firebase Auth supports it as a first-class provider, so the session, ID token, and
  every `ctx.uid` gate stay untouched. The provider generalization from #95 means the app-side cost is a
  provider entry and an icon.
- **Cons:** Meta's provisioning is materially heavier than Google's (see *Wiring*), and publishing to
  the general public depends on Meta's review posture rather than on us. It inherits every caveat ADR
  015 recorded for Google: a self-declared phone and a possible second account per person.

## Decision

Adopt **Option 4**. Facebook joins phone and Google on the sign-in method screen introduced in #95. It
is a third **sign-in channel**, not a replacement: SMS OTP stands as ADR 013 specifies, Google stands as
ADR 015 specifies, and both are reached by the same screen.

### Wiring

The provider is added to the existing `authProviders` map in `use-social-sign-in.ts` — Firebase's
`FacebookAuthProvider` beside `GoogleAuthProvider`, both driven through one `signInWithPopup` call. The
official Facebook mark is added to `packages/ui/src/icon/svg/`, for the same reason ADR 015 added
Google's: Lucide ships no brand logos, and the provider requires its own mark on the button.

Meta's setup is where this channel is expensive, and the shape of it is not obvious:

- **The Facebook app must be a consumer app.** An app attached to a **business portfolio** only offers
  *Facebook Login for Business*, which does not serve the consumer `public_profile` / `email` scopes —
  the sign-in dialog rejects them as `Invalid Scopes: email`, and the consumer login use case cannot be
  added to such an app afterwards. A **separate app with no business portfolio** is required. This is a
  property of the app's type, not a setting to flip.
- **The domain Meta must trust is Firebase's, not ours.** OAuth returns to
  `https://raiymbek-park-sa99.firebaseapp.com/__/auth/handler`, so `raiymbek-park-sa99.firebaseapp.com`
  goes in **App Domains**, backed by a **Website platform** whose Site URL is that same origin — Meta
  rejects an App Domain with no matching platform. `raiymbek-park.github.io` is never named on Meta's
  side; it belongs to Firebase's authorised domains.
- **The redirect URI is registered explicitly** under Facebook Login → Settings → *Valid OAuth Redirect
  URIs*.

Firebase Auth then returns the same session the other two channels produce, so `createContext`,
`verifyIdToken`, and `ctx.uid` are untouched.

### Phone handling, roles, and linking

Unchanged from ADR 015, and for the same reasons. A Facebook identity carries no phone, so `ctx.phone`
is `null` and `resident.register` stores the number from the form (`ctx.phone ?? resident.phone`) — a
self-declared phone, exactly as on the Google channel. No provenance flag is stored; the channel is
recoverable per uid from `getUser(uid).providerData` (`facebook.com`) if it is ever needed.

`registerInputSchema` still accepts only `owner` or `tenant`, and elevated roles exist only as per-uid
records written outside the app, so a Facebook sign-in — a new uid — cannot reach one. Account linking
stays deferred: a resident who registered over SMS and later signs in with Facebook lands on a separate
account, as ADR 015 accepts and the onboarding PRD states.

## Consequences

### Positive

- A resident with no carrier route and no Google account now has a way in. The method screen offers
  three channels, so the up-front choice #95 introduced is a real choice rather than a narrow one.
- Free, and on no external critical path to *build*: no legal entity, no БИН, no fee.
- The identity model is byte-for-byte unchanged — the API still trusts a verified Firebase ID token,
  and no schema, payload, or gate moved.
- Because #95 generalized the provider, a fourth channel would now cost a map entry and an icon.

### Negative

- **Meta's provisioning is a standing dependency, and publishing is not ours to drive.** The app is
  currently in **Development** mode, so only admins and listed testers can sign in — the channel is
  verified end-to-end on prod, but it does not yet serve residents. Going Live requires a privacy policy
  URL and a data-deletion URL (issue #97) and, for the `email` scope, App Review and business
  verification.
- The business-portfolio trap above cost real time and is invisible until the sign-in dialog fails. It
  is recorded here so the next person does not rediscover it.
- Facebook inherits ADR 015's negatives in full: a self-declared, non-editable phone stored with the
  same authority as an SMS-proven one, and a possible second account per person with no in-app remedy.
- A third channel is a third surface to keep configured, and Meta changes its console and its review
  rules on its own schedule.

### Neutral

- **Open question — whether `email` is needed at all.** Firebase requests the `email` scope by default
  for Facebook. The app uses only `displayName` from the provider; the email is never read or stored.
  If Meta silently drops an unapproved `email` for public users and lets sign-in proceed on
  `public_profile` (which holds Advanced Access by default), App Review would be unnecessary. **This is
  unverified** — it is the first thing to establish before submitting anything to review.
- This amends ADR 015 by adding a channel beside its Google mechanism; ADR 015's entry-point reasoning
  is superseded only in *where* the choice is made (the method screen from #95, not the verification
  screen), not in *why* a second channel exists.
- Relationship with ADR 001 (state boundaries): the Facebook session is client/SDK-owned like the Google
  and custom-token sessions beside it, while the resident record stays server truth in Firestore.
