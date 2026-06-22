# Onboarding — Error States

## Scenario 1: A wrong code spends the single attempt and locks the cells

  Given: a resend wait is running on the code screen and this code's attempt is unused
  When:  the user enters 4 digits that form an incorrect code
  Then:  an error message is shown and the app stays on the code screen
         the cells lock and keep the entered digits — they do not clear — so the spent code can't
         be retyped

  Given: an incorrect code was just entered on the code screen
  When:  the user wants to try again
  Then:  the cells stay locked until a fresh code is requested
         a second check against the spent code is not possible

## Scenario 2: A repeat check against a spent code is refused

  Given: this code's single attempt has already been used and the resend wait is still running
  When:  a check is attempted against the same code again (for example, a request made outside the
         app)
  Then:  it is refused as "attempt used up" and no move to home happens
         within the app the cells stay locked and no "Resend" button appears until the wait ends

## Scenario 3: A fresh code restores the right to one attempt

  Given: the previous code's attempt is used up, the resend wait has expired, and the "Resend"
         button is visible
  When:  the user taps "Resend" and a new code is successfully issued
  Then:  one verification attempt becomes available again
         the cells unlock and clear, ready for the new code
         the countdown restarts with the next wait per the schedule

## Scenario 4: Network error while submitting the form

  Given: the form on the welcome screen is valid
  When:  the user taps "Next" but the code request fails with a network error
  Then:  no move to the code screen happens
         an error message is shown and "Next" is available again to retry

## Scenario 5: Network error during the check

  Given: 4 digits are entered on the code screen
  When:  the check fails with a network error (not a wrong-code response)
  Then:  the cells clear and are ready for input again (they are not locked)
         an error message is shown

  Given: the check failed with a network error (not a wrong-code response)
  When:  the user re-enters the code
  Then:  the check runs again — a network failure does not spend the attempt

## Scenario 6: Network error registering after the correct code

  Given: the correct code has been confirmed on the code screen
  When:  registration fails with a network error
  Then:  no session is saved and the app stays on the code screen
         an error message is shown with an option to retry registration

## Scenario 7: Session renewal fails on startup

  Given: the resident has a session and launches the app
  When:  renewal fails because the session is expired or invalid
  Then:  the session is cleared
         the app opens the welcome screen

## Scenario 8: Access lapses mid-session

  Given: the resident is on home, their access has lapsed, and the session is still valid
  When:  a protected action runs
  Then:  access is renewed silently and the action proceeds
  When:  renewal also fails
  Then:  the session is cleared and the app opens the welcome screen

## Scenario 9: Resend requested before the wait has elapsed

  Given: a code has been sent for a number and its resend wait has not yet elapsed
  When:  another code is requested for that number before the wait expires
  Then:  the request is refused for an active wait
         the current code and the wait remain unchanged

## Scenario 10: A check while the number is locked

  Given: a number has been locked for 24 hours after exhausting its code requests
  When:  a code check is attempted for that number
  Then:  it is refused as "number locked", including the time remaining until unlock
         no verification attempt is consumed
