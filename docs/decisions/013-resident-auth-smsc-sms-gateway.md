# 013. Resident SMS OTP over the smsc.kz gateway with server-issued Firebase custom tokens

**Date:** 2026-07-13
**Status:** accepted — amends the delivery and anti-abuse mechanism of ADR 010 (its Firebase ID-token trust model is retained)

## Context

ADR 010 adopted Firebase Phone Authentication so that Google's managed SMS OTP delivered the
verification code straight from the client, and the tRPC API trusted the resulting Firebase ID token.
That ADR named "SMS delivery cost and Kazakhstan deliverability are tied to Firebase's SMS provider" as
a known con. In production that con became the blocker: Firebase's SMS provider does not reliably
deliver the code to every Kazakhstan (`+7`) mobile number. `signInWithPhoneNumber` resolves
successfully the moment Google accepts the request — Firebase exposes no delivery receipt to the
client — so a number whose carrier drops the SMS produces a *successful* send and a resident stranded on
the verification screen with no error and no code.

The verification channel must therefore deliver reliably to Kazakhstan carriers with a provider that
reports delivery status, while preserving everything downstream that already depends on a Firebase ID
token:

- **Stack:** the backend is a stateless tRPC API on Cloud Functions gen2 with Firestore via the Admin
  SDK; identity is per-request from a verified Firebase ID token (`getAuth().verifyIdToken` →
  `{ uid, phone }`), and every identity-gated mutation (`resident.register`, `resident.markVisit`)
  rejects a null `uid` as `UNAUTHORIZED`.
- **Region:** residents are on Kazakhstan (`+7`) mobile numbers.
- **Abuse:** without Firebase's invisible reCAPTCHA / App Check, the send endpoint must be protected
  against SMS-bombing by the API itself.

## Options Considered

### Option 1: Stay on Firebase Phone Authentication

- **Pros:** No migration; the managed OTP, session, and anti-abuse surface stays Google's.
- **Cons:** Does not fix the problem — the unreliable Kazakhstan delivery *is* Firebase's SMS provider,
  which is not pluggable or replaceable from the client SDK.

### Option 2: Keep Firebase Phone Auth and fall back to a second provider on failure

- **Pros:** Retains Firebase's managed anti-abuse for the common path.
- **Cons:** Firebase reports send *success* even when the carrier drops the message, so there is no
  signal to fall back on; running two OTP issuers in parallel doubles the verification, session, and
  test surface for no reliable trigger.

### Option 3: Self-managed OTP over the smsc.kz SMS gateway with server-issued Firebase custom tokens (chosen)

- **Pros:** smsc.kz delivers to Kazakhstan carriers and reports per-message delivery status; the API
  owns the message copy, code format, and expiry; the entire downstream identity model is preserved by
  minting a Firebase **custom token** rather than inventing a new session format.
- **Cons:** The team now owns OTP generation, expiry, hashing, and send/verify rate limiting — the
  security-critical surface ADR 010 deliberately avoided; smsc.kz credentials, balance, and uptime
  become a managed dependency.

## Decision

Adopt **Option 3**. Resident phone verification is issued and checked by the tRPC API and delivered
through the **smsc.kz SMS gateway**; a successful check mints a Firebase custom token so the session and
every downstream identity check are unchanged. Firebase Phone Authentication, `RecaptchaVerifier`,
`signInWithPhoneNumber`, and the in-form reCAPTCHA legal notice are removed from the web client.

### Send — `otp.send({ phone })`

1. Generate a 6-digit numeric code with a cryptographically secure RNG.
2. Upsert `otps/{phone}` in Firestore with `{ codeHash, salt, expiresAt, sendCount, attemptCount,
   lastSentAt, createdAt }`. The code is stored only as a salted SHA-256 hash — never in plaintext.
   `expiresAt` is `lastSentAt + 5 minutes`.
3. Send the SMS through the smsc.kz HTTP API: `GET/POST https://smsc.kz/sys/send.php` with `login`,
   `psw` (or `apikey`), `phones` (the E.164 number), `mes` (the message with the code), `sender` (the
   approved sender name), and `fmt=3` (JSON response). A JSON body with an `error_code` is a send
   failure surfaced to the client; a body with an `id` is a success.
4. **Rate limiting (server-side, per phone):** reject a second send within **60 s** of `lastSentAt`;
   reject once `sendCount` reaches **5 within a rolling hour**, with a too-many-requests error that the
   client routes to the locked screen. This replaces Firebase's reCAPTCHA / App Check; the client's
   escalating cooldown (60 → 120 → 300 → 600 s) remains UI-level deterrence layered on top.

### Verify — `otp.verify({ phone, code })`

1. Load `otps/{phone}`. Reject if absent or `expiresAt` has passed (expired code).
2. Increment `attemptCount`; after **5** failed attempts, invalidate the record so the resident must
   request a new code.
3. Compare the salted hash. On mismatch, return a wrong-code error.
4. On match: get-or-create the Firebase Auth user for that phone via the Admin SDK
   (`getUserByPhoneNumber`, falling back to `createUser({ phoneNumber })`), mint a custom token with
   `getAuth().createCustomToken(uid)`, delete `otps/{phone}`, and return the token.

Because the phone is set on the Firebase Auth **user record**, the ID token minted from the custom-token
sign-in carries the standard `phone_number` claim, so `verifyIdToken` and the `{ uid, phone }` context
derivation are unchanged — no `context.ts` change, no new session format, no new server-stored session.

### Client

Submitting the registration form calls `otp.send`; the verification screen calls `otp.verify` and, on
success, `signInWithCustomToken(auth, customToken)` to establish the Firebase session. Everything after
sign-in — attaching the ID token, `resident.register`, the route guards — is untouched.

### Credentials

The smsc.kz `login` + `psw` (or `apikey`) and the sender name are held as Firebase Functions secrets via
`defineSecret(...)`, mirroring `apps/functions/src/anthropic-key.ts`, and set with
`firebase functions:secrets:set {NAME}`. They are never committed and never enter the web bundle. A
deploy succeeds silently without them, so they must be set before the flow works.

### Testing

End-to-end runs do not send live SMS: in `e2e` mode a configured test-phone → fixed-code map is honored
by `otp.send`/`otp.verify`, replacing Firebase's `appVerificationDisabledForTesting` and test phone
numbers.

## Consequences

### Positive

- Reliable Kazakhstan delivery with per-message delivery status from smsc.kz, closing the silent
  non-delivery gap where a resident was stranded with no error.
- The downstream identity model is unchanged: the API still trusts a verified ID token carrying
  `phone_number`; `resident.register` / `resident.markVisit` gates are byte-for-byte the same.
- reCAPTCHA and its in-form legal notice are removed; the form is simpler and no third-party badge is
  suppressed.
- Full control over message copy, code length, and expiry.

### Negative

- The team now owns OTP generation, hashing, expiry, and send/verify rate limiting — the
  security-critical surface ADR 010 avoided.
- smsc.kz credentials are a new managed secret, and smsc.kz balance and uptime are a new external
  dependency in the send path.
- End-to-end and local testing rely on a test-phone → fixed-code map rather than Firebase test numbers.

### Neutral

- This amends ADR 010: its verification *delivery* and *anti-abuse* mechanism are replaced, but its core
  decision — the API trusts a verified Firebase ID token and stores no server session — is retained.
- Relationship with ADR 001 (state boundaries): the `otps/{phone}` record is server truth in Firestore,
  while the confirmation and Firebase session remain client/SDK-owned through the custom-token exchange.
- The `otps` collection is deny-all to clients (`allow read, write: if false`) like every other
  collection; only the `api` function reaches it through the Admin SDK.
