# Onboarding — Error States

## Scenario 1: A send failure opens the verification screen

  Given: the form on the welcome screen is fully valid
  When:  the user taps "Далее" but sending the code fails
  Then:  the app moves to the verification screen
         an error message about the failed send is shown there
         both the resend control and the Google control are reachable

  Given: the send failed and the resident is on the verification screen
  When:  the resend cooldown elapses and they tap the resend control, and the send succeeds
  Then:  a new code is on its way and the resident can enter it

## Scenario 2: A wrong code shows an error and clears the cells

  Given: 6 digits are entered on the verification screen
  When:  the entered code is rejected as invalid or expired
  Then:  the app stays on the verification screen
         a wrong-code error message is shown
         the cells clear so the user can retype the code

## Scenario 3: Network failure during the check

  Given: 6 digits are entered on the verification screen
  When:  the check fails with a connection error (not a wrong-code response)
  Then:  the app stays on the verification screen
         a connection error message is shown
         the cells clear so the user can re-enter the code

## Scenario 4: Registration failure after the correct code offers a retry

  Given: the correct code has been confirmed on the verification screen
  When:  saving the resident's profile fails
  Then:  the app stays on the verification screen — it does not move to home
         an error message is shown
         a "Повторить попытку" (Retry) action is available

  Given: the profile save previously failed and the retry action is shown
  When:  the user taps "Повторить попытку" and the save succeeds
  Then:  the app moves to home

## Scenario 5: Resend failure

  Given: the user is on the verification screen and the resend cooldown has elapsed
  When:  the user taps the resend control but requesting a new code fails
  Then:  the app stays on the verification screen
         a connection error message is shown
         the user can attempt the resend again

## Scenario 6: Too many attempts routes to the locked screen

  Given: the resident is in onboarding (welcome, verification, or resend step)
  When:  the request is rejected with a too-many-requests (rate limit) error
  Then:  the app moves to the "Доступ заблокирован" (Access locked) screen
         a "Повторить" (Retry) action is shown

  Given: the resident is on the locked screen
  When:  the user taps "Повторить" and requesting a new code succeeds
  Then:  the app moves to the verification screen

  Given: the resident is on the locked screen
  When:  the user taps "Повторить" but requesting a new code fails
  Then:  the app stays on the locked screen
         an error message is shown

## Scenario 7: Establishing the session after the correct code offers a retry

  Given: the correct code has been confirmed on the verification screen
  When:  establishing the signed-in session from the confirmed code fails
  Then:  the app stays on the verification screen — it does not move to home
         an error message is shown
         a "Повторить попытку" (Retry) action is available

  Given: the session sign-in previously failed and the retry action is shown
  When:  the user taps "Повторить попытку" and the sign-in succeeds
  Then:  the resident's profile is saved and the app moves to home

## Scenario 8: Dismissing the Google window leaves the screen untouched

  Given: the resident typed 3 digits of the code on the verification screen and tapped
         "Продолжить с Google"
  When:  they close the Google window or cancel the account choice
  Then:  the app stays on the verification screen
         no error message is shown — cancelling is not a failure
         the 3 typed digits are still in the field and the resend cooldown still runs
         both the Google control and the SMS channel remain available

## Scenario 9: The Google sign-in window cannot open

  Given: the resident is on the verification screen and the browser blocks the sign-in window
  When:  they tap "Продолжить с Google"
  Then:  the app stays on the verification screen
         a message says the sign-in window could not be opened
         the Google control stays available so the resident can try again
         the code field and the resend control keep working

## Scenario 10: Network failure during Google sign-in

  Given: the resident is on the verification screen
  When:  they tap "Продолжить с Google" and the sign-in fails with a connection error
  Then:  the app stays on the verification screen
         a connection error message is shown
         no resident is registered and no session is established
         the resident can take the Google control again

## Scenario 11: Registration failure after Google sign-in offers a retry

  Given: the resident signed in with Google from the verification screen
  When:  saving the resident's profile fails
  Then:  the app stays on the verification screen — it does not move to home
         an error message is shown
         a "Повторить попытку" (Retry) action is available

  Given: the profile save after a Google sign-in failed and the retry action is shown
  When:  the user taps "Повторить попытку" and the save succeeds
  Then:  the app moves to home
         no second Google account choice is required — the established session is reused
