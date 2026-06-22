# Onboarding — Happy Path

## Scenario 1: Filling the form enables "Next"

  Given: the user is on the welcome screen, the form is empty, "Next" is disabled
  When:  they enter a valid name, a valid phone, pick a block, enter an apartment number within
         that block's range, and pick a role
  Then:  every field is valid and "Next" becomes enabled
         the header scrolls with the content while "Next" stays fixed at the bottom

## Scenario 2: Submitting the form requests a code and opens the code screen

  Given: the form on the welcome screen is fully valid
  When:  the user taps "Next"
  Then:  a code is requested for the number and a 60-second resend wait begins
         the details the user entered are remembered for this number
         the app moves to the code screen

## Scenario 3: The code screen shows the number and empty cells

  Given: the user reached the code screen after a code was sent
  When:  the screen loads
  Then:  the entered phone number is shown in the format `+7 707 123 45 67`

  Given: the user reached the code screen after a code was sent
  When:  the screen loads
  Then:  4 empty code cells are shown, with focus on the first cell

  Given: the user reached the code screen after a code was sent
  When:  the screen loads
  Then:  a "Resend in M:SS" countdown and a "Paste code from clipboard" action are visible

## Scenario 4: Focus auto-advances between cells while typing

  Given: focus is on the first cell and the cells are empty
  When:  the user types digits one by one
  Then:  after each digit, focus moves automatically to the next cell
         after the fourth digit, focus stays on the fourth

## Scenario 5: The correct code signs the resident in

  Given: 3 of the 4 digits are entered on the code screen, and this code's attempt hasn't been used
  When:  the user enters the fourth digit, forming the correct code
  Then:  the code is checked automatically (no button tap required)

  Given: the correct code is entered on the code screen
  When:  the check succeeds
  Then:  the resident is registered with the details from the registration form

  Given: registration succeeds after the code is confirmed
  When:  the session is issued
  Then:  the session is saved so it survives a relaunch
         the app moves to home

## Scenario 6: A returning resident with a valid session lands on home

  Given: the resident has a valid, unexpired session and launches the app
  When:  the app starts
  Then:  the session is renewed and the app opens home, skipping onboarding

## Scenario 7: Pasting the code from the clipboard triggers the check

  Given: a resend wait is running on the code screen and the clipboard holds `1234`
  When:  the user taps the enabled "Paste code from clipboard"
  Then:  the 4 cells fill with the digits `1234`

  Given: the 4 cells were filled by pasting a valid 4-digit clipboard value
  When:  the cells are full
  Then:  the code is checked automatically
         the app moves to home on the correct code

## Scenario 8: "Next" cannot be submitted twice while the request is in flight

  Given: the form on the welcome screen is fully valid and the user taps "Next"
  When:  the code request is still in flight (the response has not yet arrived)
  Then:  "Next" is disabled for the duration of the request
         the form cannot be submitted a second time

## Scenario 9: Cells are non-interactive while the check is in flight

  Given: 4 digits have been entered on the code screen and the check is in flight
  When:  the response has not yet arrived
  Then:  the cells do not accept new input for the duration of the request
         the user cannot modify the code while the check is pending

## Scenario 10: Backspace moves focus to the previous cell

  Given: focus is on the second, third, or fourth cell on the code screen
  When:  the user presses backspace on an empty cell
  Then:  focus moves to the previous cell

  Given: focus is on the first cell
  When:  the user presses backspace
  Then:  focus stays on the first cell
