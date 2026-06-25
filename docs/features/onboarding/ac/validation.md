# Onboarding — Validation & State Transitions

## Scenario 1: An incomplete required field keeps "Next" disabled

  Given: the user is on the welcome screen
  When:  any field (name, phone, block, apartment, role) is empty or invalid
  Then:  the "Далее" button is disabled
         the form does not submit

## Scenario 2: Name length validation

  Given: the "Имя" (Name) field on the welcome screen
  When:  a value whose trimmed length is shorter than 2 or longer than 60 characters is entered
  Then:  the name is invalid and "Далее" is disabled

## Scenario 3: Name at the lower boundary

  Given: the "Имя" field on the welcome screen
  When:  a value with a trimmed length of exactly 2 characters is entered
  Then:  the name is valid and does not block "Далее"

  Given: the "Имя" field on the welcome screen
  When:  a value with a trimmed length of exactly 1 character is entered
  Then:  the name is invalid and "Далее" is disabled

## Scenario 4: Name at the upper boundary

  Given: the "Имя" field on the welcome screen
  When:  a value with a trimmed length of exactly 60 characters is entered
  Then:  the name is valid and does not block "Далее"

  Given: the "Имя" field on the welcome screen
  When:  a value with a trimmed length of exactly 61 characters is entered
  Then:  the name is invalid and "Далее" is disabled

## Scenario 5: Whitespace-only name is invalid

  Given: the "Имя" field on the welcome screen
  When:  the user enters only whitespace (its trimmed length is 0)
  Then:  the name is invalid and "Далее" is disabled

## Scenario 6: Domestic Kazakhstan phone normalizes to "+7"

  Given: the "Телефон" (Phone) field on the welcome screen
  When:  a valid Kazakhstan domestic number is entered as `8XXXXXXXXXX` (no `+`)
  Then:  the phone is valid
         the number is stored in canonical `+7…` E.164 form when the form is submitted

## Scenario 7: An incomplete phone is invalid

  Given: the "Телефон" field on the welcome screen
  When:  an incomplete or otherwise invalid phone number is entered
  Then:  the phone is invalid and "Далее" is disabled

## Scenario 8: An explicit international phone is accepted

  Given: the "Телефон" field on the welcome screen
  When:  a valid number with an explicit country code (e.g. `+1`, `+44`) is entered
  Then:  the phone is valid
         the number is stored in its E.164 form when the form is submitted

## Scenario 9: Apartment number validation by block range

  Given: a block is selected and the "Номер квартиры" (Apartment number) field is on the welcome
         screen
  When:  a non-numeric value, an empty value, or a number outside the selected block's range is
         entered (block 1 → 1–70, block 2 → 71–139, block 3 → 1–63, block 4 → 64–126)
  Then:  the apartment field is invalid and "Далее" is disabled

  Given: a block is selected and the "Номер квартиры" field is on the welcome screen
  When:  a number within the selected block's range is entered
  Then:  the apartment field is valid

## Scenario 10: Apartment field accepts digits only

  Given: the "Номер квартиры" field on the welcome screen
  When:  the user types non-digit characters
  Then:  the non-digit characters are ignored and only digits remain in the field

## Scenario 11: Apartment boundary exact values per block

  Given: a block is selected and the "Номер квартиры" field is on the welcome screen
  When:  the apartment number equals the first valid value for the block
         (block 1 → 1, block 2 → 71, block 3 → 1, block 4 → 64)
  Then:  the apartment field is valid

  Given: a block is selected and the "Номер квартиры" field is on the welcome screen
  When:  the apartment number equals one below the first valid value for the block
         (block 1 → 0, block 2 → 70, block 3 → 0, block 4 → 63)
  Then:  the apartment field is invalid and "Далее" is disabled

  Given: a block is selected and the "Номер квартиры" field is on the welcome screen
  When:  the apartment number equals the last valid value for the block
         (block 1 → 70, block 2 → 139, block 3 → 63, block 4 → 126)
  Then:  the apartment field is valid

  Given: a block is selected and the "Номер квартиры" field is on the welcome screen
  When:  the apartment number equals one above the last valid value for the block
         (block 1 → 71, block 2 → 140, block 3 → 64, block 4 → 127)
  Then:  the apartment field is invalid and "Далее" is disabled

## Scenario 12: Changing block re-validates the apartment number

  Given: the user has selected block 1 and entered apartment 70 (valid for block 1)
  When:  the user switches to block 2 (whose range starts at 71)
  Then:  apartment 70 is no longer valid for block 2
         the apartment field becomes invalid and "Далее" is disabled

## Scenario 13: Single choice of block and role

  Given: the block group (4 options) and the role group (2 options) on the welcome screen
  When:  the user picks a block and a role
  Then:  exactly one option is selected in each group

  Given: a block or role is already selected
  When:  the user picks a different option in that group
  Then:  the previous selection is cleared and the new one is selected — exactly one stays selected

## Scenario 14: A code cell takes only one digit

  Given: the user is on the verification screen
  When:  a digit is typed into a cell
  Then:  the cell holds exactly one digit
</content>
