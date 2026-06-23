# Infrastructure — Error States

## Scenario 1: WhatsApp provider failure on code send

  Given: a resident requests a verification code
  When:  the provider (Twilio WhatsApp) call fails
  Then:  the API returns an error to the client
         the send is not counted toward the resend ladder or lockout
         the resident can retry the send immediately

## Scenario 2: Firestore unavailable during a request

  Given: the function is handling a request
  When:  Firestore is unreachable or returns an error
  Then:  the API returns an error response
         no partial write leaves resident, OTP, or session state inconsistent

## Scenario 3: Deploy step fails in CI

  Given: the deploy workflow runs on a push to `main`
  When:  the Firebase deploy or the Pages publish step fails
  Then:  the workflow is marked failed
         the previously deployed web app and backend remain live (no half-deployed state)

## Scenario 4: Checks fail before deploy

  Given: a push to `main`
  When:  lint, typecheck, or tests fail
  Then:  the deploy steps do not run
         no new version is published to Pages or Firebase
