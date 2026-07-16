# Onboarding — Error States

## Scenario 1: Dismissing the provider window leaves the method screen untouched

  Given: the resident selected "Google" on the sign-in method screen and tapped "Выбрать"
  When:  they close the Google window or cancel the account choice
  Then:  the app stays on the sign-in method screen
         no error message is shown — cancelling is not a failure
         "Google" is still selected and all three methods remain available
         no session is established

  Given: the resident selected "Facebook" and tapped "Выбрать"
  When:  they close the Facebook window or cancel the account choice
  Then:  the app stays on the sign-in method screen and no error message is shown

## Scenario 2: The provider sign-in window cannot open

  Given: the resident is on the sign-in method screen and the browser blocks the sign-in window
  When:  they select "Google" and tap "Выбрать"
  Then:  the app stays on the sign-in method screen
         a message says the sign-in window could not be opened
         all three methods stay available so the resident can try again or switch

## Scenario 3: Network failure during provider sign-in

  Given: the resident is on the sign-in method screen
  When:  they select "Google", tap "Выбрать", and the sign-in fails with a connection error
  Then:  the app stays on the sign-in method screen
         a connection error message is shown
         no resident is registered and no session is established
         the resident can take the method again

## Scenario 4: A send failure opens the verification screen

  Given: the registration form is fully valid on the phone method
  When:  the resident taps "Далее" but sending the code fails
  Then:  the app moves to the verification screen
         an error message about the failed send is shown there
         the resend control and the back control are reachable

  Given: the send failed and the resident is on the verification screen
  When:  the resend cooldown elapses and they tap the resend control, and the send succeeds
  Then:  a new code is on its way and the resident can enter it

## Scenario 5: A failed send consumes no resend step and no rate-limit allowance

  Given: the resident reached the verification screen after a send that failed
  When:  the screen loads
  Then:  the resend cooldown counts down from 1:00 — the failed send did not advance the schedule

## Scenario 6: A wrong code shows an error and clears the field

  Given: 6 digits are entered on the verification screen
  When:  the entered code is rejected as invalid or expired
  Then:  the app stays on the verification screen
         a wrong-code error message is shown
         the field clears so the resident can retype the code

## Scenario 7: Network failure during the check

  Given: 6 digits are entered on the verification screen
  When:  the check fails with a connection error (not a wrong-code response)
  Then:  the app stays on the verification screen
         a connection error message is shown
         the field clears so the resident can re-enter the code

## Scenario 8: Establishing the session after the correct code offers a retry

  Given: the correct code has been confirmed on the verification screen
  When:  establishing the signed-in session from the confirmed code fails
  Then:  the app stays on the verification screen — it does not move to home
         an error message is shown
         a "Повторить попытку" (Retry) action is available

  Given: the session sign-in previously failed and the retry action is shown
  When:  the resident taps "Повторить попытку" and the sign-in succeeds
  Then:  the resident's profile is saved and the app moves to home

## Scenario 9: Registration failure on the phone method offers a retry

  Given: the correct code has been confirmed on the verification screen
  When:  saving the resident's profile fails
  Then:  the app stays on the verification screen — it does not move to home
         an error message is shown
         a "Повторить попытку" (Retry) action is available

  Given: the profile save previously failed and the retry action is shown
  When:  the resident taps "Повторить попытку" and the save succeeds
  Then:  the app moves to home

## Scenario 10: Registration failure on a social channel offers a retry without a second sign-in

  Given: the resident signed in with Google and submitted the registration form
  When:  saving the resident's profile fails
  Then:  the app stays on the registration form — it does not move to home
         an error message is shown
         a "Повторить попытку" (Retry) action is available

  Given: the profile save after a Google sign-in failed and the retry action is shown
  When:  the resident taps "Повторить попытку" and the save succeeds
  Then:  the app moves to home
         no second Google account choice is required — the established session is reused

## Scenario 11: Resend failure

  Given: the resident is on the verification screen and the resend cooldown has elapsed
  When:  the resident taps the resend control but requesting a new code fails
  Then:  the app stays on the verification screen
         a connection error message is shown
         the resident can attempt the resend again

## Scenario 12: Too many attempts routes to the locked screen

  Given: the resident is on the phone method (submitting the form, on the verification screen, or
         resending)
  When:  the request is rejected with a too-many-requests (rate limit) error
  Then:  the app moves to the "Доступ заблокирован" (Access locked) screen
         an illustration, an explanatory message, and a "Повторить" (Retry) action are shown

  Given: the resident is on the locked screen
  When:  the resident taps "Повторить" and requesting a new code succeeds
  Then:  the app moves to the verification screen

  Given: the resident is on the locked screen
  When:  the resident taps "Повторить" but requesting a new code fails
  Then:  the app stays on the locked screen
         an error message is shown

## Scenario 13: Failed sends keep the throttle but never consume the hourly allowance

  Given: the resident's code requests have failed to send several times over on the verification
         screen
  When:  the resident resends once more and the send succeeds
  Then:  a new code is on its way and the app stays on the verification screen
         the app does not move to the "Доступ заблокирован" screen — the failed sends were never
         counted against the hourly send allowance

  Given: a send has just failed
  When:  the resident tries to resend right away
  Then:  the resend is held back by the same per-minute interval that gates a successful send —
         a failing number cannot be resent faster than once per interval, so a broken number or a
         bot-driven resend loop cannot drain the paid SMS budget

## Scenario 14: A profile that cannot be loaded never unlocks home

  Given: the resident is signed in and loading their profile fails with a connection error
  When:  the resident navigates to an onboarding screen
  Then:  the app keeps them in onboarding and opens the registration form
         home is not reached — a profile that could not be read never counts as registered
