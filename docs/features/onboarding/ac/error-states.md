# Onboarding — Error States

## Scenario 1: A wrong code burns the single attempt

  Given: a cooldown is running on `/onboarding/verify`, and the attempt for the current code
         is unused
  When:  the user enters 4 digits that form an incorrect code
  Then:  the cells clear and an error message is shown
         the app stays on `/onboarding/verify`

  Given: an incorrect code was just entered on `/onboarding/verify`
  When:  the user enters 4 digits again without requesting a new code
  Then:  the check is rejected ("attempt used up, request a new code" or equivalent)
         the app stays on `/onboarding/verify`

## Scenario 2: Re-checking an already-used code is rejected

  Given: the single attempt for the current code has already been used (a previous check was made),
         the cooldown is still running
  When:  the user enters 4 digits again
  Then:  the check is rejected with a message indicating the attempt is exhausted
         the cells clear and no move to `/home` happens
         the "Resend" button is not shown until the cooldown ends

## Scenario 3: A new code restores the right to one attempt

  Given: the attempt for the previous code is used up, the cooldown timer has expired,
         and the "Resend" button is visible
  When:  the user taps "Resend" and a new code is successfully issued
  Then:  one verification attempt becomes available again
         the countdown timer restarts with the next cooldown duration per the schedule
         the cells are empty and ready for a new code

## Scenario 4: Network error while submitting the form

  Given: the form on `/onboarding/welcome` is valid
  When:  the user taps "Next" but `otp.send` fails with a network error
  Then:  no move to `/onboarding/verify` happens
         an error message is shown, and "Next" is available again to retry

## Scenario 5: Network error during the auto-check

  Given: 4 digits are entered on `/onboarding/verify`
  When:  the verification call fails with a network error (not a "wrong code" response)
  Then:  the cells retain the entered digits
         an error message is shown

  Given: the verification call failed with a network error (not a "wrong code" response)
  When:  the user corrects or re-enters the same 4 digits
  Then:  the check runs again automatically — the attempt is not marked as used by a network failure

## Scenario 6: Network error registering after the correct code

  Given: the correct code has been verified on `/onboarding/verify`
  When:  the registration call fails with a network error
  Then:  no tokens are stored and the app stays on `/onboarding/verify`
         an error message is shown with an option to retry registration

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
