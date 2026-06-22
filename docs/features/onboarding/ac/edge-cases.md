# Onboarding — Edge Cases

## Scenario 1: Growing resend wait

  Given: the user is on the code screen and the wait after the initial send has expired
  When:  they tap "Resend" (the 1st resend)
  Then:  the countdown resets to 2:00 (120 s) and begins counting down

  Given: the 120 s wait expires and the user taps "Resend" again (the 2nd resend)
  When:  the new wait begins
  Then:  the countdown shows 5:00 (300 s)

  Given: the 300 s wait expires and the user taps "Resend" again (the 3rd resend)
  When:  the new wait begins
  Then:  the countdown shows 10:00 (600 s)

  Given: the user closes and reopens the app while a resend wait is running
  When:  the code screen loads
  Then:  the timer shows the remaining time of the current wait — it does not reset to the full
         duration

## Scenario 2: Number locked after all code requests are used

  Given: all 4 code requests have been used on the code screen (the initial one plus 3 resends),
         and the last wait is running
  When:  the wait expires and the user requests another code
  Then:  the number is locked for 24 hours
         the app moves to the lockout screen with a countdown to unlock

## Scenario 3: The lockout can't be escaped — direct URL and reload

  Given: a lockout is in effect for the in-progress number, with no valid session
  When:  the user tries to open any other screen directly, or reloads the app
  Then:  the app returns to the lockout screen
         no other screen is reachable

## Scenario 4: The lockout can't be escaped — back navigation

  Given: the user is on the lockout screen and the lockout is in effect
  When:  they use a system back swipe or the browser's back button
  Then:  the app stays on the lockout screen
         the lockout screen can't be left while the lockout holds

## Scenario 5: Lockout expiry returns to the code screen

  Given: the user is on the lockout screen and the countdown is running
  When:  the lockout time passes (the countdown reaches 0)
  Then:  the app moves to the code screen
         the cells are empty, the code-request count is reset, and one attempt is available
         the action is "Send code" (which starts a fresh send with a 60 s wait)

## Scenario 6: Relaunch during a wait restores the code screen

  Given: the user sent a code and closed the app while a wait was running, with no valid session
         but onboarding still in progress for the number
  When:  they launch the app again
  Then:  the app reopens the code screen with the remaining wait from the server
         the timer continues from where it was, it doesn't reset

## Scenario 7: Relaunch during a lockout restores the lockout screen

  Given: the number is locked and the user closed and reopened the app
  When:  the app starts
  Then:  it opens the lockout screen with the remaining countdown

## Scenario 8: A valid session takes priority over onboarding

  Given: the resident has a valid session and also still has onboarding in progress for a number
  When:  they launch the app
  Then:  the session wins — they open home
         the onboarding-in-progress state is ignored

## Scenario 9: Checking a never-used number reports a neutral state

  Given: a phone number that has never been used to request a code
  When:  its state is checked
  Then:  it reports no active code, no running wait, and no lockout

## Scenario 10: A used renewal can't be reused

  Given: a session was renewed and a new one issued
  When:  the previous, already-used renewal is presented again
  Then:  it is refused
         the newly issued session stays valid and unaffected

## Scenario 11: Clipboard read is unavailable or denied

  Given: the user is on the code screen during a resend wait
  When:  the clipboard cannot be read or the user has denied clipboard access
  Then:  the "Paste code from clipboard" action stays disabled
         no error is surfaced to the user — the action simply stays disabled
