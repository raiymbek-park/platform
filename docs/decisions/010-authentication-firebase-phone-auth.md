# 010. Resident authentication: Firebase Phone Authentication over WhatsApp verification

**Date:** 2026-07-07
**Status:** accepted

## Context

A resident proves ownership of their phone number once, during onboarding, and that verified number
becomes their identity for the app (see the `onboarding` PRD). The verification channel must deliver a
one-time code to a Kazakhstan mobile number, resist automated abuse of the send endpoint, and yield a
session the API can trust when it persists the resident's profile.

The original plan was to verify residents over **WhatsApp** — send and confirm the code through a
WhatsApp Business account. That path was blocked: registering and verifying the WhatsApp Business
account (Meta business verification, phone-number and display-name approval, message-template review)
did not complete, so it could not be shipped on the project's timeline.

Constraints shaping the decision:

- **Stack:** the backend already runs on Firebase — Firestore for data, Storage for media, Cloud
  Functions — with the tRPC API verifying callers by Firebase ID token.
- **Region:** residents are on Kazakhstan (`+7`) mobile numbers; the channel must deliver there.
- **Project ethos:** fewer dependencies, minimal custom security surface, no bespoke infrastructure
  where a managed service covers the need.
- **Abuse:** the send/resend endpoint must be protected against SMS-bombing without the team building
  its own rate-limiting and bot-detection.

## Options Considered

### Option 1: WhatsApp Business verification (original plan)

- **Pros:** High message open rates; familiar channel; avoids per-message SMS pricing in some regions.
- **Cons:** Requires an approved WhatsApp Business account and Meta business verification — which was
  blocked and could not be completed; template approval and messaging-policy overhead; ties resident
  identity to a third-party messaging account; the team would still build its own OTP issuance,
  session, and anti-abuse layer around it.

### Option 2: Self-managed SMS OTP (own gateway + backend)

- **Pros:** Full control over the SMS provider, message copy, and token format.
- **Cons:** The team owns OTP generation and expiry, send/resend rate-limiting, bot mitigation, and
  session/token issuance and verification — a large security-critical surface to build and maintain;
  duplicates identity infrastructure Firebase already provides.

### Option 3: Firebase Phone Authentication (chosen)

- **Pros:** Managed SMS OTP delivery; invisible reCAPTCHA plus App Check and server-side SMS quotas
  guard the send endpoint; drop-in web SDK (`signInWithPhoneNumber` + `RecaptchaVerifier`); the
  resulting Firebase ID token is verified by the Admin SDK on the tRPC API, so the profile-save call
  is authenticated with no custom session code; consistent with the Firebase backend already in use.
- **Cons:** SMS cost and regional deliverability depend on Firebase; a reCAPTCHA dependency is
  introduced; vendor lock-in to Firebase Auth; end-to-end tests need Firebase test phone numbers.

## Decision

Adopt **Firebase Phone Authentication** as the resident identity provider. Submitting the registration
form runs an invisible reCAPTCHA and sends a 6-digit SMS code; confirming the code establishes a
Firebase session. The resident's profile is then persisted through the tRPC API, authenticated by the
Firebase ID token, which the API verifies with the Admin SDK.

The WhatsApp objection — the only reason it was the first choice — is moot because its business-account
onboarding was blocked. Against a self-managed OTP stack, Firebase removes the security-critical code
the team would otherwise own (OTP issuance, session tokens, anti-abuse) and reuses the platform already
carrying Firestore, Storage, and Functions.

## Consequences

### Positive

- No custom OTP, session, or token code — issuance and verification are managed; the API trusts a
  verified ID token.
- Send-endpoint abuse is mitigated by Firebase (invisible reCAPTCHA, App Check, server-side SMS
  quotas) rather than hand-rolled rate limiting.
- One identity platform end to end: the same Firebase project backs auth, data, and storage.
- Phone verification works before any profile exists, which is exactly what onboarding needs.

### Negative

- SMS delivery cost and Kazakhstan deliverability are tied to Firebase's SMS provider.
- A reCAPTCHA dependency is added; it is rendered as an in-form notice and the floating badge is
  suppressed, so the legal notice is surfaced explicitly in the form instead.
- Vendor lock-in to Firebase Auth; migrating providers later would touch the send/confirm flow.
- End-to-end and local testing require Firebase test phone numbers rather than live SMS.

### Neutral

- The client's escalating resend cooldown (60 → 120 → 300 → 600 s) only deters casual UI abuse; the
  real protection is Firebase's server-side limits.
- Relationship with ADR 001 (state boundaries): the confirmation handle and Firebase session are
  client/SDK-owned, while the resident profile is server truth persisted and read through tRPC.
