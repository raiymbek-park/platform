# Onboarding — Validation & State Transitions

## Scenario 1: An incomplete required field keeps "Next" disabled

  Given: the user is on the welcome screen
  When:  any field (name, phone, block, apartment, role) is empty or invalid
  Then:  the "Next" button is disabled
         the form doesn't submit

## Scenario 2: Name validation

  Given: the "Name" field is focused
  When:  a value shorter than 2 or longer than 60 characters (after trimming) is entered
  Then:  the name is invalid and "Next" is disabled

## Scenario 3: Phone validation by mask

  Given: the "Phone" field with the mask `+7 (___) ___-__-__`
  When:  fewer than 10 digits are entered after `+7`
  Then:  the phone is invalid and "Next" is disabled
  When:  all 10 digits are entered
  Then:  the phone is valid and stored in its canonical `+7` form

## Scenario 4: Apartment number validation by block range

  Given: a block is selected and the "Apartment number" field is in focus
  When:  a non-numeric value, an empty value, or a number outside the selected block's range is
         entered (block 1 → 1–70, block 2 → 71–139, block 3 → 1–63, block 4 → 64–126)
  Then:  the field is invalid and "Next" is disabled
  When:  a number within the selected block's range is entered
  Then:  the field is valid

## Scenario 5: Single choice of block and role

  Given: the "Choose a block" group (4 options) and the "Who are you?" group (2 options)
  When:  the user picks a block and a role
  Then:  exactly one option is selected in each group
         picking another option clears the previous one

## Scenario 6: A code cell takes only one digit

  Given: the user is on the code screen
  When:  a non-digit character is typed into a cell
  Then:  the character is ignored and the cell stays empty
  When:  a new digit is typed into a filled cell
  Then:  the cell keeps exactly one digit

## Scenario 7: The paste action is enabled only with exactly 4 digits in the clipboard

  Given: a resend wait is running on the code screen and "Paste code from clipboard" is visible
  When:  the clipboard is empty or doesn't hold exactly 4 digits
  Then:  the "Paste code from clipboard" action is disabled
  When:  the clipboard holds exactly 4 digits
  Then:  the action becomes enabled

## Scenario 8: The resend control swaps when the timer ends

  Given: a resend wait is running on the code screen and "Paste code from clipboard" is visible
  When:  the timer reaches 0:00
  Then:  "Paste code from clipboard" disappears
         a "Resend" button appears in its place

## Scenario 9: Tapping the already-selected block or role keeps it selected

  Given: the user is on the welcome screen and a block or role is already selected
  When:  the user taps the same selected option again
  Then:  the selection does not change
         the group still shows exactly one selected item

## Scenario 10: Name at the lower boundary

  Given: the "Name" field on the welcome screen
  When:  exactly 2 characters (after trimming) are entered
  Then:  the name is valid and does not block "Next"
  When:  exactly 1 character (after trimming) is entered
  Then:  the name is invalid and "Next" is disabled

## Scenario 11: Name at the upper boundary

  Given: the "Name" field on the welcome screen
  When:  exactly 60 characters (after trimming) are entered
  Then:  the name is valid and does not block "Next"
  When:  exactly 61 characters (after trimming) are entered
  Then:  the name is invalid and "Next" is disabled

## Scenario 12: Whitespace-only name is invalid

  Given: the "Name" field on the welcome screen
  When:  the user enters only whitespace (its trimmed length is 0)
  Then:  the name is invalid and "Next" is disabled

## Scenario 13: Apartment boundary exact values per block

  Given: a block is selected and the "Apartment number" field is on the welcome screen
  When:  the apartment number equals the last valid value for the selected block
         (block 1 → 70, block 2 → 139, block 3 → 63, block 4 → 126)
  Then:  the field is valid
  When:  the apartment number equals one above the last valid value for the selected block
         (block 1 → 71, block 2 → 140, block 3 → 64, block 4 → 127)
  Then:  the field is invalid and "Next" is disabled
  When:  the apartment number equals the first valid value for the selected block
         (block 1 → 1, block 2 → 71, block 3 → 1, block 4 → 64)
  Then:  the field is valid
  When:  the apartment number equals one below the first valid value for the selected block
         (block 1 → 0, block 2 → 70, block 3 → 0, block 4 → 63)
  Then:  the field is invalid and "Next" is disabled

## Scenario 14: Changing block re-validates the apartment number

  Given: the user has selected block 1 and entered apartment 70 (valid for block 1)
  When:  the user switches to block 2 (whose range starts at 71)
  Then:  apartment 70 is no longer valid for block 2
         the apartment field becomes invalid and "Next" is disabled
