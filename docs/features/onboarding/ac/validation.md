# Onboarding — Validation & State Transitions

## Scenario 1: An incomplete required field keeps "Next" disabled

  Given: the user is on `/onboarding/welcome`
  When:  any field (name, phone, block, apartment, role) is empty or invalid
  Then:  the "Next" button is disabled
         the form doesn't submit

## Scenario 2: Name validation

  Given: the "Name" field is focused
  When:  a value shorter than 2 or longer than 60 characters (after trim) is entered
  Then:  the name is invalid and "Next" is disabled

## Scenario 3: Phone validation by mask

  Given: the "Phone" field with the mask `+7 (___) ___-__-__`
  When:  fewer than 10 digits are entered after `+7`
  Then:  the phone is invalid and "Next" is disabled
  When:  all 10 digits are entered
  Then:  the phone is valid and normalized to `+7XXXXXXXXXX`

## Scenario 4: Apartment number validation by block range

  Given: a block is selected and the "Apartment number" field is in focus
  When:  a non-numeric value, an empty value, or a number outside the selected block's range
         is entered (block 1 → 1–70, block 2 → 71–139, block 3 → 1–63, block 4 → 64–126)
  Then:  the field is invalid and "Next" is disabled
  When:  a number within the selected block's range is entered
  Then:  the field is valid

## Scenario 5: Single choice of block and role

  Given: the "Choose a block" group (4 cards) and the "Who are you?" group (2 options)
  When:  the user picks a block and a role
  Then:  exactly one option is selected in each group
         picking another option clears the previous one

## Scenario 6: A code cell takes only one digit

  Given: the user is on `/onboarding/verify`
  When:  a non-digit character is typed into a cell
  Then:  the character is ignored and the cell stays empty
  When:  a new digit is typed into a filled cell
  Then:  the cell keeps exactly one digit

## Scenario 7: The clipboard button is enabled only with 4 digits in the clipboard

  Given: a cooldown is running on `/onboarding/verify`, "Paste code from clipboard" is visible
  When:  the clipboard is empty or doesn't hold exactly 4 digits (no match for `^\d{4}$`)
  Then:  the "Paste code from clipboard" button is disabled
  When:  the clipboard holds a string of exactly 4 digits
  Then:  the button becomes enabled

## Scenario 8: The resend control swaps when the timer ends

  Given: a cooldown is running on `/onboarding/verify`, "Paste code from clipboard" is visible
  When:  the timer reaches 0:00
  Then:  "Paste code from clipboard" disappears
         a `<Button variant="secondary">Resend</Button>` appears
