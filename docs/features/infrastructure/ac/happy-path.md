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

## Scenario 7: Verification code delivered by Firebase Phone Authentication

  Given: a resident enters a phone number on the verification step
  When:  the client requests a verification code
  Then:  Firebase Phone Authentication sends an SMS code directly to that number
         entering the correct code establishes a Firebase session for the resident
         the resulting Firebase ID token authorizes subsequent API mutations

## Scenario 8: Visit timestamp is recorded under the resident's uid

  Given: a request carries a verifiable Firebase ID token whose `uid` is `U`
  When:  the resident's visit is marked
  Then:  `residents/U.lastVisit` is written as a server timestamp
