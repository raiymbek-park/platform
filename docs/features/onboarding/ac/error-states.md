# Onboarding — Error States

## Scenario 1: Send failure on the welcome screen

  Given: the form on the welcome screen is fully valid
  When:  the user taps "Далее" but sending the code fails
  Then:  the app stays on the welcome screen — it does not move to the verification screen
         an error message is shown
         "Далее" is enabled again so the user can retry

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
