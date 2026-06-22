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

  Given: the number was just locked by a 5th code request
  When:  the 5th request completes
  Then:  the app moves to the lockout screen

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

  Given: the app has just moved to the code screen after the lockout expired
  When:  the code screen loads
  Then:  the cells are empty and one verification attempt is available

  Given: the app has just moved to the code screen after the lockout expired
  When:  the code screen loads
  Then:  the primary action shown is "Send code"

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

  Given: the resident has a valid session and also still has onboarding in progress for a
         number (the number may or may not be locked)
  When:  they launch the app
  Then:  the session wins — they open home
         the onboarding-in-progress state (including any active lock) is ignored

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

## Scenario 12: Lockout screen shows the required content on arrival

  Given: the app has just navigated to the lockout screen after the number was locked
  When:  the screen renders
  Then:  an illustration, an "Access blocked" heading, and a subheading about used-up attempts
         are all visible

## Scenario 13: Lockout countdown is shown in HH:MM:SS format

  Given: the user is on the lockout screen and the lockout has time remaining
  When:  the countdown is displayed
  Then:  the remaining time is shown in HH:MM:SS format (e.g. "23:59:42")

## Scenario 14: Lockout screen has no controls

  Given: the user is on the lockout screen and the lockout is in effect
  When:  the screen is visible
  Then:  no button, no resend action, and no back control are present on the screen

## Scenario 15: Lockout countdown derives from server-provided expiry time

  Given: the user arrives on the lockout screen (whether by fresh navigation or relaunch)
  When:  the countdown starts
  Then:  it counts down from the remaining time supplied by the server — not from a fixed
         24-hour value — so relaunching the app mid-lockout shows the correct remaining time,
         not a reset countdown

## Scenario 16: Opening the lockout screen with no active lock returns to the code screen

  Given: the lockout screen is opened but, once the server lock state has loaded, no time
         remains (the lock has already elapsed or no lock is in effect)
  When:  the lock state finishes loading
  Then:  the app moves to the code screen — the lockout screen is never shown with a zeroed
         countdown

## Scenario 17: The lockout persists even after clearing local storage

  Given: a number is locked (the server lock is in effect) and the user clears the app's
         local storage for that number to remove the stored pending-phone record
  When:  the user reloads the app or navigates to any other screen
  Then:  the server confirms the lock is still active
         the app returns to the lockout screen — the lock cannot be bypassed by removing
         local data

## Scenario 18: A valid session overrides an active lockout

  Given: the user has a valid session and that same number is also actively locked on the
         server
  When:  the app starts (or the user navigates to any onboarding screen)
  Then:  the valid session takes priority — the app opens home
         the lockout screen is not shown

## Scenario 19: Unauthenticated direct navigation to home redirects to welcome

  Given: the user has no valid session (no stored tokens, or the session has expired)
  When:  the user navigates directly to the home screen (e.g. by typing the URL or using a
         deep link)
  Then:  the app redirects to the welcome screen
         the home screen content is not shown

## Scenario 20: Cold-start with no session and no pending number lands on welcome

  Given: the app has never been used, or all tokens and pending-number state have been
         cleared (there is no session and no pending phone number in storage)
  When:  the app starts
  Then:  the app opens the welcome screen directly — no routing to code or lockout screens
         occurs
