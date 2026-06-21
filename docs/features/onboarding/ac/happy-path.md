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
  Then:  the entered phone number is displayed in the format `+7 707 123 45 67`

  Given: the user reached `/onboarding/verify` after a send
  When:  the screen loads
  Then:  4 empty code cells are shown, with focus on the first cell

  Given: the user reached `/onboarding/verify` after a send
  When:  the screen loads
  Then:  a countdown label in the format "Resend in M:SS" is visible
         a "Paste code from clipboard" button is visible

## Scenario 4: Focus auto-advances between cells while typing

  Given: focus is on the first cell, the cells are empty
  When:  the user types digits one by one
  Then:  after each digit, focus moves automatically to the next cell
         after the fourth digit, focus stays on the fourth

## Scenario 5: Auto-checking the correct code goes to home with a session

  Given: 3 of the 4 digits are entered on `/onboarding/verify`, and the attempt for this code
         hasn't been used yet
  When:  the user enters the fourth digit, forming the correct code
  Then:  the code is checked automatically (no button tap required)

  Given: the correct code is entered on `/onboarding/verify`
  When:  the verification succeeds
  Then:  the resident is registered with the details from the registration form

  Given: registration succeeds after code verification
  When:  the server returns tokens
  Then:  an access token and a refresh token are saved to persistent session storage
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

  Given: the 4 cells were filled by pasting a valid 4-digit clipboard value
  When:  the cells are full
  Then:  the code is checked automatically
         the app moves to `/home` on a correct code

## Scenario 8: "Next" is disabled while the code request is in flight

  Given: the form on `/onboarding/welcome` is fully valid and the user taps "Next"
  When:  the code request is in flight (the response has not yet arrived)
  Then:  "Next" is disabled for the duration of the request
         the form cannot be submitted a second time

## Scenario 9: Cells are non-interactive while the auto-check is in flight

  Given: 4 digits have been entered on `/onboarding/verify` and the verification check is in flight
  When:  the response has not yet arrived
  Then:  the cells do not accept new input for the duration of the request
         the user cannot modify the code while the check is pending

## Scenario 10: Backspace key moves focus to the previous cell

  Given: focus is on the second, third, or fourth cell on `/onboarding/verify`
  When:  the user presses backspace on an empty cell
  Then:  focus moves to the previous cell

  Given: focus is on the first cell
  When:  the user presses backspace
  Then:  focus stays on the first cell
