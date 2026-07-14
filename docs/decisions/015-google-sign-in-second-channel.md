# 015. Google sign-in as a second resident sign-in channel alongside SMS OTP

**Date:** 2026-07-14
**Status:** accepted — amends ADR 013 by adding a second sign-in channel (its SMS OTP mechanism and the
Firebase ID-token trust model retained from ADR 010 are unchanged)

## Context

ADR 013 moved resident verification onto the smsc.kz SMS gateway precisely because Firebase's SMS
provider did not reliably deliver to Kazakhstan numbers. It named "smsc.kz credentials, balance, and
uptime become a managed dependency" as a con. In production that con became the blocker in a second
form: the account has **no carrier route** to Beeline (705, 771, 776) or Tele2/Altel (707, 708, 747).
Every send to those carriers returns SMSC `error 8 "can't to deliver"`; `otp.send` returned **100 × 502
against 4 × 200** over three hours.

This is not a defect in the app. It reproduces from a local machine with the same credentials and
parameters, and sending from SMSC's own advertised "common sender name" for Tele2/Altel fails
identically — so it is not the code, the IP, the message copy, or a missing sender name. It is the
routing on the account, and reopening those routes depends on smsc.kz support; if a sender-name
registration turns out to be required, applications close on the 10th with activation on the 1st of the
following month.

Roughly half of Kazakhstan's mobile subscribers are therefore unable to register, while the physical
flyers directing them to the app are already posted. Constraints shaping the decision:

- **Time:** residents must be able to get in now, not after a carrier negotiation resolves.
- **Cost and paperwork:** no legal entity, no БИН, and no fee may sit on the critical path.
- **Stack:** Firebase Auth is already the identity platform (project `raiymbek-park-sa99`); the tRPC
  API derives `{ uid, phone }` per request from a verified Firebase ID token (`verifyIdToken`), and
  every identity-gated mutation (`resident.register`, `resident.update`, `resident.markVisit`) rejects
  a null `uid`.
- **The phone is mandatory on every channel.** Registration validates it as a real Kazakhstan number
  (`registerInputSchema`, libphonenumber-js with the `KZ` default region), so no resident gets past
  the form without a usable phone — whichever channel signs them in.

## Options Considered

### Option 1: Wait for smsc.kz to open the missing carrier routes

- **Pros:** No app change; SMS OTP stays the single channel and the identity model is untouched.
- **Cons:** Does not resolve on any known date, and the resolution is not ours to drive. Half the
  country stays locked out of an app whose flyers are already distributed — the one outcome that is
  unacceptable.

### Option 2: Return to Firebase Phone Authentication

- **Pros:** Managed OTP and anti-abuse; would remove the smsc.kz dependency.
- **Cons:** Revisits ADR 013 and reinstates the exact defect it was written to escape — Firebase's SMS
  provider does not reliably deliver to Kazakhstan numbers, and reports send *success* when the carrier
  drops the message, stranding the resident with no error. Swapping one unreliable SMS route for
  another known-worse one is not a fallback; it is a regression with extra migration cost.

### Option 3: Add a second SMS gateway and route by carrier prefix

- **Pros:** Keeps every resident on one channel with a verified phone; no new identity model.
- **Cons:** Another provider means another account, contract, sender-name approval, and balance — the
  same paperwork on the critical path that blocks Option 1, with no guarantee its Beeline and Tele2
  routes carry. It doubles the send path and the delivery-failure surface, and leaves the app one
  provider outage away from the same lockout.

### Option 4: Sign in with Apple, alongside or instead of Google

- **Pros:** Covers iPhone owners who decline a Google account.
- **Cons:** $99/year for the Apple Developer Program on the critical path, for an audience Google
  already reaches — iPhone owners in this complex overwhelmingly hold a Google account. The App Store
  rule that mandates Sign in with Apple wherever another social login is offered applies to App Store
  submissions, not to a web app, so nothing compels it. Cost and setup time for marginal reach.

### Option 5: Google sign-in as a second channel alongside SMS OTP (chosen)

- **Pros:** Depends on nothing outside the project — no carrier, no legal entity, no БИН, no fee, no
  approval window. Firebase Auth already backs the session, so the ID token, `{ uid, phone }` context
  derivation, and every downstream identity gate keep working untouched. Ships now, and SMS OTP stays
  exactly as ADR 013 specifies for the residents it reaches.
- **Cons:** A Google identity carries an email and **no phone**, so a resident registering this way
  stores the phone they typed on the form — self-declared rather than SMS-proven. Two sign-in channels
  mean two ways into the app and, without linking, two possible accounts per person.

## Decision

Adopt **Option 5**. The `OTP Verification` screen carries a **Google control** ("Продолжить с Google")
alongside the code field and the resend control. It is a second **sign-in channel**, not a replacement:
SMS OTP is unchanged for every resident whose carrier the gateway reaches, and ADR 013's send/verify,
rate limiting, and custom-token exchange stand as written.

### Entry point

The control lives on the verification screen — where the resident is stuck waiting for a code that will
never arrive, and where the phone has already been entered on the preceding screen, so the app holds
the full registration draft at that moment. It is available as soon as the screen opens, not revealed
after a failure.

A **failed send** must therefore route to the verification screen rather than keep the resident on the
registration screen: a carrier the gateway cannot route to fails at `otp.send`, so leaving the resident
on the welcome screen puts the only channel available to them behind a code that is never sent. A
delivery failure already restores the previous OTP record (`restoreOtp`), so it consumes no resend step
and no rate-limit budget — the reroute costs the SMS path nothing.

### Wiring

The Google provider is enabled on the existing Firebase project (`raiymbek-park-sa99`) together with
the OAuth consent screen. Only the non-sensitive `email` and `profile` scopes are requested, which
require no Google app verification to publish. Authorised origins must cover
`https://raiymbek-park.github.io`, where the web app is served from GitHub Pages under base
`/platform/`.

The client signs in with the Firebase Auth Google provider and receives the same Firebase session it
gets from `signInWithCustomToken` on the SMS channel — so the ID token, `createContext`, and
`verifyIdToken` are untouched. On a Google identity `ctx.phone` is `null`; on an SMS identity it carries
the `phone_number` claim.

Google and Apple both require their official marks on sign-in buttons. Lucide removed all brand logos in
v1.0 and will not add them (`chromium` is the Chromium browser, not Google's "G"; `apple` is the fruit),
so the official Google SVG is added to `packages/ui/src/icon/svg/` alongside the existing icons.

### Phone handling

`resident.register` keeps its `ctx.uid` gate — an unauthenticated caller is still rejected — and keeps
its existing phone resolution: the token's own number when the verified identity carries one
(`ctx.phone`), otherwise the number from the registration form (`ctx.phone ?? resident.phone`). No code
change is needed there for the Google channel.

A Google-registered resident's phone is displayed and disclosed **exactly like any other**: the form
already requires a valid Kazakhstan number on every channel, so every resident holds a usable phone and
there is no second class of phone to treat differently. No provenance flag is stored — a field that
branches nothing would be denormalized onto every resident, post, and issue for no reader. If the
sign-in channel is ever needed, it is recoverable per uid from Firebase Auth itself
(`getUser(uid).providerData` — `google.com` vs `phone`), without any schema change.

The phone stays non-editable on both channels (`ProfileUpdate` continues to omit it), so the stored
phone cannot be swapped for another one after registration.

### Deferred: account linking

A resident who registered over SMS and later takes the Google control lands on a **separate account** —
a new uid, a fresh resident with none of their issues, offers, comments, reactions, or car plates, and
the default role. Their SMS account is untouched and still reachable by completing an SMS code on it.
Two resident records may hold the same phone.

This is accepted, not overlooked. Linking means reconciling two uids and merging or re-pointing every
record that references the old one, and doing it safely needs proof the same person owns both — which
is an SMS code, the very thing that does not arrive. Building it now would put the fix behind the defect
it fixes. The limitation is stated plainly in the onboarding PRD.

### Roles

Roles are unaffected. `registerInputSchema` accepts only `owner` or `tenant`, so registration cannot
write an elevated role on any channel; `resolveRole` maps anything unrecognised to `resident`, and
`resident.update` preserves an existing elevated role rather than accepting one from input. `manager`
and `administration` exist only as per-uid records written into Firestore outside the app, and a Google
sign-in is a new uid with no such record. The Google channel cannot reach an elevated role.

## Consequences

### Positive

- Residents on carriers the gateway cannot route to can register today, from the screen they are
  stranded on, without leaving the app or re-entering the form.
- The channel depends on nothing outside the project: no carrier, no legal entity, no БИН, no fee, no
  approval window.
- The downstream identity model is unchanged — the API still trusts a verified Firebase ID token and
  every `ctx.uid` gate is byte-for-byte the same.
- SMS OTP is untouched for the residents it reaches; ADR 013 stands, and restoring the missing routes
  later requires no app change.
- No schema or payload change anywhere: `resident.register`, the resident record, and the post/issue
  author snapshots are byte-for-byte what they were before this decision.

### Negative

- Two accounts per person are possible, and the split is invisible until the resident notices their
  history is gone. Linking is deferred, so support has no in-app remedy.
- A Google-registered resident's phone is self-declared: nobody has proven they own it. The form
  guarantees it is a real, well-formed number, but a typo — or someone else's number — is stored and
  disclosed with the same authority as an SMS-proven one, and it is non-editable after registration.
- Google is a new dependency in the sign-in path, and a resident without a Google account gains
  nothing from it.

### Neutral

- This amends ADR 013 by adding a channel beside its SMS OTP mechanism; ADR 013's send/verify, hashing,
  expiry, rate limiting, and custom-token exchange are retained unchanged, as is ADR 010's core
  decision that the API trusts a verified Firebase ID token and stores no server session.
- Apple is out of scope, not rejected forever — revisit only if Google proves insufficient, or if the
  app is ever submitted to the App Store, where the social-login rule does apply.
- Relationship with ADR 001 (state boundaries): the Google session is client/SDK-owned like the
  custom-token session it sits beside, while the resident record stays server truth in Firestore.
</content>
</invoke>
