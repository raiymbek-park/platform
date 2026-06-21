# Onboarding — Happy Path

## Scenario 1: Filling the form enables "Next"

  Given: the user is on `/onboarding/welcome`, the form is empty, "Next" is disabled
  When:  they enter a name (2–60 chars), a phone (`+7` + 10 digits), pick a block,
         enter an apartment number within that block's range, and pick a role
  Then:  every field is valid
         "Next" becomes enabled
         the header is pinned to the top, "Next" is pinned to the bottom

## Scenario 2: Submitting the form opens a code session and goes to verify

  Given: the form on `/onboarding/welcome` is fully valid
  When:  the user taps "Next"
  Then:  `otp.send({ phone })` is called (mock); the server opens a session for the number with
         `sendCount = 1` and `resendAvailableAt = now + 60s`
         the phone is saved as `pendingPhone`; the form draft is saved to `onboardingStore`
         the app moves to `/onboarding/verify`

## Scenario 3: The verify screen shows the number and empty cells

  Given: the user reached `/onboarding/verify` after a send
  When:  the screen loads
  Then:  the entered number is shown in the format `+7 707 123 45 67`
         4 empty code cells are shown, with focus on the first
         a "Resend in 0:59" timer and a "Paste code from clipboard" button are visible

## Scenario 4: Focus auto-advances between cells while typing

  Given: focus is on the first cell, the cells are empty
  When:  the user types digits one by one
  Then:  after each digit, focus moves automatically to the next cell
         after the fourth digit, focus stays on the fourth

## Scenario 5: Auto-checking the correct code goes to home with a session

  Given: 3 of the 4 digits are entered on `/onboarding/verify`, and the attempt for this code
         hasn't been used yet
  When:  the user enters the fourth digit, forming the code `1234`
  Then:  `otp.verify({ phone, code: '1234' })` is called automatically and returns success
         `resident.register({ name, phone, block, apartment, role })` is called (mock)
         the server returns an `accessToken` (1 h) and a `refreshToken` (30 days), saved to `authStore`
         the app moves to `/home`

## Scenario 6: A returning user with a valid refresh lands on home

  Given: `authStore` holds a non-expired `refreshToken` and the user launches the app
  When:  the `/onboarding` index guard runs
  Then:  `auth.refresh({ refreshToken })` is called and returns a new token pair
         the new pair is saved to `authStore`
         the app opens `/home`, skipping onboarding

## Scenario 7: Pasting the code from the clipboard triggers the check

  Given: a cooldown is running on `/onboarding/verify`, and the clipboard holds `1234`
  When:  the user taps the enabled "Paste code from clipboard"
  Then:  the 4 cells fill with the digits `1234`
         `otp.verify` runs automatically and passes
         the app moves to `/home`

## Scenario 8: "Next" is disabled while the code request is in flight

  Given: the form on `/onboarding/welcome` is fully valid and the user taps "Next"
  When:  the code request is in flight (the response has not yet arrived)
  Then:  "Next" is disabled for the duration of the request
         the form cannot be submitted a second time
