# Infrastructure — Happy Path

## Scenario 1: API served from the cloud function

  Given: the `api` Cloud Function (gen2) is deployed with `minInstances: 0` and has idled to
         zero instances
  When:  the web app calls a query (e.g. `welcome`) against `VITE_API_URL`
  Then:  the function cold-starts and returns a valid tRPC response
         end-to-end tRPC types resolve in the web client without codegen
         no always-on instance is required between calls

## Scenario 2: Resident registration persists in Firestore

  Given: a resident completes onboarding and registers
  When:  registration succeeds
  Then:  a `residents/{uid}` document is written with name, block, apartment, role, phone
         a `sessions/{id}` refresh-token record is written with expiry and single-use flag
         the data is visible in the Firebase console

## Scenario 3: Session survives backend idle-to-zero

  Given: a resident has a valid 30-day session and the backend has scaled to zero
  When:  the resident reopens the app after the function has cold-started
  Then:  the session is renewed against Firestore truth
         the resident lands on the home screen without repeating onboarding

## Scenario 4: Home content is read from Firestore

  Given: `content/changes`, `content/services`, and `content/contacts` exist in Firestore
  When:  the home screen loads
  Then:  changes, services, and contacts render from the Firestore documents
         the resident profile renders from `residents/{uid}`

## Scenario 5: Content edits apply without a code deploy

  Given: the home screen reads content from Firestore
  When:  an editor changes a `content/*` document in the Firebase console
  Then:  the updated content appears in the app on the next load
         no code deploy is required

## Scenario 6: Real verification code delivered over WhatsApp

  Given: the provider (Twilio WhatsApp) credentials are configured as server-side secrets
  When:  a resident requests a code for a live WhatsApp number
  Then:  a 4-digit code is delivered to that number over WhatsApp
         entering it verifies successfully and starts a session

## Scenario 7: Web app published at the public URL

  Given: the web app is built with `VITE_BASE=/platform/` and deployed to GitHub Pages
  When:  a resident opens `https://raiymbek-park.github.io/platform/`
  Then:  the app loads with correct asset and router base paths
         the app reaches the API via the configured `VITE_API_URL`

## Scenario 8: Merge to main deploys automatically

  Given: a change is merged to `main` and the existing checks (lint, typecheck, tests) pass
  When:  the deploy workflow runs
  Then:  the web app is published to GitHub Pages
         the function, Firestore rules/indexes, and Storage rules are deployed to Firebase
         the change is live with no manual deploy command
