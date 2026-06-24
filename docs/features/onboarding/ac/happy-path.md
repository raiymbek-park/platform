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

## Scenario 4: The verification screen shows the number and empty cells

  Given: the user reached the verification screen after a code was sent
  When:  the screen loads
  Then:  the entered phone number is shown in the format `+7 707 123 45 67`

  Given: the user reached the verification screen after a code was sent
  When:  the screen loads
  Then:  6 empty code cells are shown, with focus on the first cell

  Given: the user reached the verification screen after a code was sent
  When:  the screen loads
  Then:  the resend control shows "Запросить пин повторно через 1:00" and is disabled

## Scenario 5: Focus auto-advances between cells while typing

  Given: focus is on the first cell and the cells are empty
  When:  the user types digits one by one
  Then:  after each digit, focus moves automatically to the next cell
         after the sixth digit, focus stays on the sixth cell

## Scenario 6: Backspace moves focus to the previous cell

  Given: focus is on any cell after the first on the verification screen and that cell is empty
  When:  the user presses backspace
  Then:  focus moves to the previous cell

  Given: focus is on the first cell
  When:  the user presses backspace
  Then:  focus stays on the first cell

## Scenario 7: The correct code registers and signs the resident in

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

## Scenario 8: A returning signed-in resident lands on home

  Given: the resident is already signed in and opens an onboarding entry
  When:  the app starts
  Then:  the app opens home, skipping onboarding

## Scenario 9: Pasting the code from the clipboard triggers the check

  Given: the user is on the verification screen and the clipboard holds a 6-digit code
  When:  the user taps the "Вставить код из буфера" action
  Then:  the 6 cells fill with the digits from the clipboard

  Given: the 6 cells were filled by pasting a valid 6-digit clipboard value forming the correct code
  When:  the cells are full
  Then:  the code is checked automatically and the app moves to home

## Scenario 10: "Next" cannot be submitted twice while the request is in flight

  Given: the form on the welcome screen is fully valid and the user taps "Далее"
  When:  the send request is still in flight
  Then:  "Далее" is disabled and shows a loading state for the duration of the request
         the form cannot be submitted a second time

## Scenario 11: Cells are non-interactive while the check is in flight

  Given: 6 digits have been entered on the verification screen and the check is in flight
  When:  the response has not yet arrived
  Then:  the cells do not accept new input for the duration of the request
</content>
