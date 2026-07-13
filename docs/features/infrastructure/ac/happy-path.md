# Infrastructure — Happy Path

## Scenario 1: API served from the cloud function after idle

  Given: the `api` Cloud Function (gen2) has idled to zero instances
  When:  the web app calls a query (e.g. `welcome`) against the configured API URL
  Then:  the function cold-starts and returns a valid tRPC response
         end-to-end tRPC types resolve in the web client without codegen

## Scenario 2: Resident registration persists in Firestore

  Given: a request carries a verifiable Firebase ID token whose `uid` is `U`
  When:  the resident registers with name, block, apartment, role, and phone
  Then:  a `residents/U` document is written holding name, block, apartment, role, and phone
         the stored phone is the verified phone from the token when the token carries one
         the document is readable back under `uid` `U`

## Scenario 3: Profile survives backend idle-to-zero

  Given: `residents/U` was written and the backend has since scaled to zero
  When:  the resident reopens the app after the function cold-starts and the home screen loads
  Then:  the resident profile (name, block, apartment) is read back from `residents/U`
         the profile is identical to what was stored before the backend idled

## Scenario 4: Home content is read from Firestore

  Given: `serviceContacts` and `events` documents exist in Firestore
  When:  the home screen loads for a resident
  Then:  contacts render from `serviceContacts`, ordered by `order` ascending
         changes render from `events`, ordered by `createdAt` descending, at most 10
         the resident profile renders from `residents/{uid}`

## Scenario 5: Changes are scoped to events after the resident's last visit

  Given: `residents/U` has a `lastVisit` timestamp and some `events` predate it while others
         follow it
  When:  the home screen loads for resident `U`
  Then:  only events created after `lastVisit` are returned
         events created at or before `lastVisit` are excluded

## Scenario 6: Content edits apply without a code deploy

  Given: an `events` (or `serviceContacts`) document is displayed on the home screen
  When:  that document is edited in the Firebase console
  Then:  the updated content appears in the app on the next load
         no code deploy is required

## Scenario 7: `otp.send` issues a code and delivers it over the smsc.kz gateway

  Given: a resident submits a valid phone number
  When:  the client calls `otp.send`
  Then:  a 6-digit code is generated and its salted hash is stored in `otps/{phone}` with an expiry
         the code is delivered to that number through the smsc.kz SMS gateway
         the plaintext code is never stored or returned to the client

## Scenario 8: `otp.verify` with the correct code mints a Firebase custom token

  Given: a code was sent and `otps/{phone}` holds its unexpired hash
  When:  the client calls `otp.verify` with the matching code
  Then:  a Firebase custom token is returned for the phone's user record
         the `otps/{phone}` record is removed
         exchanging the custom token yields a Firebase session whose ID token carries the phone,
         so subsequent API mutations are authorized

## Scenario 9: Visit timestamp is recorded under the resident's uid

  Given: a request carries a verifiable Firebase ID token whose `uid` is `U`
  When:  the resident's visit is marked
  Then:  `residents/U.lastVisit` is written as a server timestamp
