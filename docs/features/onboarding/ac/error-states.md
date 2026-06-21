# Onboarding — Error States

## Scenario 1: A wrong code burns the single attempt

  Given: a cooldown is running on `/onboarding/verify`, and the attempt for the current code
         is unused
  When:  the user enters 4 digits that aren't `1234`
  Then:  `otp.verify` returns an error (wrong code)
         the attempt for this code is marked used (`verifyUsed = true`)
         the cells clear and an error message is shown
         no move to `/home` happens

## Scenario 2: Re-checking an already-used code is rejected

  Given: the attempt for the current code is already used (`verifyUsed = true`), cooldown running
  When:  the user enters 4 digits again
  Then:  `otp.verify` rejects the request ("attempt used up, request a new code")
         a new attempt requires resending the code

## Scenario 3: A new code restores the right to one attempt

  Given: the attempt for the previous code is used up, the timer expired, "Resend" is visible
  When:  the user taps "Resend" and `otp.send` successfully issues a new code
  Then:  `verifyUsed` resets — one verification attempt is available again
         the timer restarts with the increased cooldown per the schedule

## Scenario 4: Network error while submitting the form

  Given: the form on `/onboarding/welcome` is valid
  When:  the user taps "Next" but `otp.send` fails with a network error
  Then:  no move to `/onboarding/verify` happens
         an error message is shown, and "Next" is available again to retry

## Scenario 5: Network error during the auto-check

  Given: 4 digits are entered on `/onboarding/verify`
  When:  `otp.verify` fails with a network error (not a "wrong code" response)
  Then:  the verification attempt is NOT counted as used
         an error message is shown, and the code stays for a repeat auto-check

## Scenario 6: Network error registering after the correct code

  Given: `otp.verify` confirmed the code `1234`
  When:  `resident.register` fails with a network error
  Then:  no tokens are issued and no move to `/home` happens
         an error message is shown with the option to retry registration

## Scenario 7: Token refresh fails on startup

  Given: `authStore` holds a `refreshToken` and the user launches the app
  When:  `auth.refresh` returns an error (expired / invalid)
  Then:  the tokens are cleared from `authStore`
         the app opens `/onboarding/welcome`

## Scenario 8: Access token expires mid-session

  Given: the user is on `/home`, the access token has expired, the refresh token is still valid
  When:  a protected request runs
  Then:  a silent `auth.refresh` runs, a new token pair is issued, and the request is retried
  When:  `auth.refresh` also fails
  Then:  the tokens are cleared and the app goes to `/onboarding/welcome`

## Scenario 9: Resend requested while cooldown is still active

  Given: a code has been sent for a number and the cooldown period has not yet elapsed
  When:  `otp.send` is called for that number again before the cooldown expires
  Then:  the server rejects the request with a "cooldown active" error
         the current code and cooldown remain unchanged

## Scenario 10: Verify called while the number is locked

  Given: a number has been locked for 24 hours after exhausting all sends
  When:  `otp.verify` is called for that number
  Then:  the server rejects the request with a "number locked" error, including the time remaining until unlock
         no verification attempt is consumed
