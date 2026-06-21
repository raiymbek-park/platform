# Onboarding — Edge Cases

## Scenario 1: Growing resend timer

  Given: the user is on `/onboarding/verify` and the cooldown has expired after the initial send
  When:  they tap "Resend" (send 2)
  Then:  the countdown resets to 2:00 (120 s) and begins counting down

  Given: the 120 s cooldown expires and the user taps "Resend" again (send 3)
  When:  the new cooldown begins
  Then:  the countdown shows 5:00 (300 s)

  Given: the 300 s cooldown expires and the user taps "Resend" again (send 4)
  When:  the new cooldown begins
  Then:  the countdown shows 10:00 (600 s)

  Given: the user closes and reopens the app while a resend cooldown is running
  When:  the verify screen loads
  Then:  the timer shows the remaining time of the current cooldown — it does not reset to the full duration

## Scenario 2: Number locked after the 4 sends are used

  Given: all 4 sends are used on `/onboarding/verify` (the initial send plus 3 resends),
         and the last cooldown is running
  When:  the timer expires and the user requests a 5th send
  Then:  `otp.send` returns a lockout: `lockedUntil = now + 86400s` (24 h)
         the app moves to `/onboarding/locked` with a countdown to unlock

## Scenario 3: Hard lock guard — direct URL and reload

  Given: a lockout is in effect for `pendingPhone` (`lockedUntil` in the future), with no valid session
  When:  the user types any URL directly (`/onboarding/welcome`, `/onboarding/verify`,
         `/home`, `/`) or reloads the app
  Then:  the global guard forces `/onboarding/locked`
         no other screen is reachable

## Scenario 4: Hard lock guard — back navigation

  Given: the user is on `/onboarding/locked` and the lockout is in effect
  When:  they use a system back swipe or the browser's back button
  Then:  the app stays on `/onboarding/locked`
         the lockout screen can't be left while the lockout holds

## Scenario 5: Lockout expiry returns to verify

  Given: the user is on `/onboarding/locked` and the countdown is running
  When:  `lockedUntil` passes (the timer reaches 0)
  Then:  the app moves to `/onboarding/verify`
         the cells are empty, `sendCount` is reset to 0, and a verification attempt is available
         the CTA is "Send code" (which starts a fresh send with a 60 s cooldown)

## Scenario 6: Restoring the flow on relaunch during a cooldown

  Given: the user sent a code and closed the app while a cooldown was running
  When:  they launch the app again (no refresh token, but `pendingPhone` is set)
  Then:  the index guard calls `otp.status(phone)` and finds an active code session
         the app opens `/onboarding/verify` with the remaining timer time
         the timer continues from the server's `resendAvailableAt`, it doesn't reset

## Scenario 7: Restoring the lockout on relaunch

  Given: the number is locked and the user closed and reopened the app
  When:  the index guard runs
  Then:  `otp.status` returns a `lockedUntil` in the future
         the app opens `/onboarding/locked` with the remaining countdown

## Scenario 8: Session takes priority over onboarding

  Given: the user has a valid refresh token and also still has a `pendingPhone`
  When:  they launch the app
  Then:  the session wins: `auth.refresh` succeeds → `/home`
         the onboarding state (`pendingPhone`) is ignored

## Scenario 9: Status query for a phone with no prior session returns neutral state

  Given: a phone number that has never been used to request a code
  When:  `otp.status` is called for that number
  Then:  the server returns a response indicating no active session — no code pending,
         no cooldown, no lockout

## Scenario 10: Token rotation — used refresh token is rejected on a second call

  Given: `auth.refresh` was called with a valid refresh token and returned a new token pair
  When:  the same (now-rotated-out) refresh token is submitted to `auth.refresh` again
  Then:  the server rejects the request as invalid
         the newly issued pair remains valid and unaffected

## Scenario 11: Clipboard read is unavailable or denied

  Given: the user is on `/onboarding/verify` during a cooldown
  When:  the Clipboard API is unavailable or the user has denied clipboard access
  Then:  the "Paste code from clipboard" button is disabled
         no error is surfaced to the user — the button simply stays disabled
