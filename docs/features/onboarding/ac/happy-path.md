# Onboarding — Happy Path

## Scenario 1: Filling the form enables "Next"

  Given: the user is on the welcome screen, the form is empty, "Далее" is disabled
  When:  they enter a valid name, a valid phone, pick a block, enter an apartment number within
         that block's range, and pick a role
  Then:  every field shows its inline success check and "Далее" becomes enabled

## Scenario 2: Phone field defaults to "+7"

  Given: the user opens the welcome screen with an empty draft
  When:  the form loads
  Then:  the phone field is pre-filled with "+7"

## Scenario 3: Submitting the form sends a code and opens the verification screen

  Given: the form on the welcome screen is fully valid
  When:  the user taps "Далее"
  Then:  an SMS code is sent to the entered number
         the app moves to the verification screen

## Scenario 4: The verification screen shows the number and an empty code field

  Given: the user reached the verification screen after a code was sent
  When:  the screen loads
  Then:  the entered phone number is shown in the format `+7 707 123 45 67`

  Given: the user reached the verification screen after a code was sent
  When:  the screen loads
  Then:  an empty code field with the `xxx - xxx` mask is shown and focused

  Given: the user reached the verification screen after a code was sent
  When:  the screen loads
  Then:  the resend control shows "Запросить код повторно через 1:00" and is disabled

## Scenario 5: The code field masks the digits as "xxx - xxx"

  Given: the user is on the verification screen
  When:  the user types digits
  Then:  the field groups them as "xxx - xxx" (e.g. "12345" shows as "123 - 45")
         non-digit characters are ignored

## Scenario 6: The correct code registers and signs the resident in

  Given: 5 of the 6 digits are entered on the verification screen
  When:  the user enters the sixth digit, forming the correct code
  Then:  the code is checked automatically — no button tap is required

  Given: the correct code is entered on the verification screen
  When:  the check succeeds
  Then:  the resident's profile is saved with the details from the registration form
         the resident is signed in

  Given: the resident's profile is saved after the code is confirmed
  When:  the save succeeds
  Then:  the app moves to home

## Scenario 7: A returning signed-in resident lands on home

  Given: the resident is already signed in and opens an onboarding entry
  When:  the app starts
  Then:  the app opens home, skipping onboarding

## Scenario 8: "Next" cannot be submitted twice while the request is in flight

  Given: the form on the welcome screen is fully valid and the user taps "Далее"
  When:  the send request is still in flight
  Then:  "Далее" is disabled and shows a loading state for the duration of the request
         the form cannot be submitted a second time

## Scenario 9: The field and actions are disabled while the check is in flight

  Given: 6 digits have been entered on the verification screen and the check is in flight
  When:  the response has not yet arrived
  Then:  a progress notice ("Ваш код отправляется на проверку…") is shown
         the code field, the back control, and the resend control are disabled
