# Onboarding — Validation & State Transitions

## Scenario 1: "Далее" stays enabled and invalid fields surface as toasts

  Given: the registration form has an empty or invalid field
  When:  the form is shown
  Then:  the "Далее" button is enabled

  Given: the registration form has an empty or invalid field
  When:  the resident taps "Далее"
  Then:  the form does not submit
         no code is sent and no profile is saved
         a toast reports the validation error

## Scenario 2: A valid field shows an inline success check

  Given: the registration form is shown
  When:  the resident enters a valid value in a field
  Then:  that field shows its inline success check

  Given: the resident has interacted with a field
  When:  its value is invalid
  Then:  that field shows its error state

## Scenario 3: Name at the lower boundary

  Given: the "Имя" (Name) field on the registration form
  When:  a value with a trimmed length of exactly 2 characters is entered
  Then:  the name is valid

  Given: the "Имя" field on the registration form
  When:  a value with a trimmed length of exactly 1 character is entered
  Then:  the name is invalid

## Scenario 4: Name at the upper boundary

  Given: the "Имя" field on the registration form
  When:  a value with a trimmed length of exactly 60 characters is entered
  Then:  the name is valid

  Given: the "Имя" field on the registration form
  When:  a value with a trimmed length of exactly 61 characters is entered
  Then:  the name is invalid

## Scenario 5: Whitespace-only name is invalid

  Given: the "Имя" field on the registration form
  When:  the resident enters only whitespace (its trimmed length is 0)
  Then:  the name is invalid

## Scenario 6: A prefilled provider name obeys the same length rules

  Given: the resident signed in with Google and the name field is pre-filled from the provider
  When:  the resident clears it down to a single character and taps "Далее"
  Then:  the name is invalid and the form does not submit — the prefilled source grants no exemption

## Scenario 7: Domestic Kazakhstan phone normalizes to "+7"

  Given: the "Телефон" (Phone) field on the registration form
  When:  a valid Kazakhstan domestic number is entered as `8XXXXXXXXXX` (no `+`)
  Then:  the phone is valid
         the number is stored in canonical `+7…` E.164 form when the form is submitted

## Scenario 8: An incomplete phone is invalid

  Given: the "Телефон" field on the registration form
  When:  `+7 701 23` is entered — too few digits to be a valid Kazakhstan number
  Then:  the phone is invalid

## Scenario 9: An explicit international phone is accepted

  Given: the "Телефон" field on the registration form
  When:  a valid number with an explicit country code (e.g. `+1`, `+44`) is entered
  Then:  the phone is valid
         the number is stored in its E.164 form when the form is submitted

## Scenario 10: The phone is required on the phone method

  Given: the resident picked the phone method and every field except the phone is valid
  When:  the phone field is left empty and the resident taps "Далее"
  Then:  the phone is invalid and the form does not submit
         no code is sent

## Scenario 11: The phone is optional on the social channels

  Given: the resident signed in with Google and every field except the phone is valid
  When:  the phone field is left empty and the resident taps "Далее"
  Then:  the phone is valid and the form submits — an empty value passes on this channel

  Given: the resident signed in with Facebook and every field except the phone is valid
  When:  the phone field is left empty and the resident taps "Далее"
  Then:  the phone is valid and the form submits

## Scenario 12: A non-empty social-channel phone must still be a valid number

  Given: the resident signed in with Google
  When:  `+7 701 23` is entered on the registration form — too few digits to be a valid number
  Then:  the phone is invalid and the form does not submit — optional means "empty or valid"

## Scenario 13: A Kcell/Activ prefix carries no warning

  Given: the resident picked the phone method
  When:  a valid number whose prefix is 701, 702, 775, or 778 is entered
  Then:  no carrier warning is shown

## Scenario 14: A prefix outside Kcell/Activ warns but does not block

  Given: the resident picked the phone method
  When:  a valid number whose prefix is outside 701/702/775/778 (e.g. `+7 705…`) is entered
  Then:  a warning says the code may not arrive and that Google or Facebook is more reliable
         the phone is still valid

  Given: the registration form is otherwise valid and carries a `+7 705…` number on the phone method
  When:  the resident taps "Далее"
  Then:  the code is sent and the app moves to the verification screen — the warning never blocks

## Scenario 15: The prefix is not checked on the social channels

  Given: the resident signed in with Google
  When:  a valid number whose prefix is outside 701/702/775/778 is entered
  Then:  no carrier warning is shown — no code is sent on this channel

## Scenario 16: An empty apartment number is invalid

  Given: a block is selected on the registration form
  When:  the "Номер квартиры" (Apartment number) field is left empty
  Then:  the apartment field is invalid

## Scenario 17: Apartment field accepts digits only

  Given: the "Номер квартиры" field on the registration form
  When:  the resident types non-digit characters
  Then:  the non-digit characters are ignored and only digits remain in the field

## Scenario 18: Apartment boundary exact values per block

  Given: a block is selected and the "Номер квартиры" field is on the registration form
  When:  the apartment number equals the first valid value for the block
         (block 1 → 1, block 2 → 71, block 3 → 1, block 4 → 64)
  Then:  the apartment field is valid

  Given: a block is selected and the "Номер квартиры" field is on the registration form
  When:  the apartment number equals one below the first valid value for the block
         (block 1 → 0, block 2 → 70, block 3 → 0, block 4 → 63)
  Then:  the apartment field is invalid

  Given: a block is selected and the "Номер квартиры" field is on the registration form
  When:  the apartment number equals the last valid value for the block
         (block 1 → 70, block 2 → 139, block 3 → 63, block 4 → 126)
  Then:  the apartment field is valid

  Given: a block is selected and the "Номер квартиры" field is on the registration form
  When:  the apartment number equals one above the last valid value for the block
         (block 1 → 71, block 2 → 140, block 3 → 64, block 4 → 127)
  Then:  the apartment field is invalid

## Scenario 19: Changing block re-validates the apartment number

  Given: the resident has selected block 1 and entered apartment 70 (valid for block 1)
  When:  the resident switches to block 2 (whose range starts at 71)
  Then:  apartment 70 is no longer valid for block 2
         the apartment field becomes invalid

## Scenario 20: Single choice of block and role

  Given: the block group (4 options) and the role group (2 options) on the registration form
  When:  the resident picks a block and a role
  Then:  exactly one option is selected in each group

  Given: a block or role is already selected
  When:  the resident picks a different option in that group
  Then:  the previous selection is cleared and the new one is selected — exactly one stays selected

## Scenario 21: The code field accepts digits only

  Given: the resident is on the verification screen
  When:  characters are typed into the code field
  Then:  only digits are kept (non-digits are ignored), capped at six

## Scenario 22: "Выбрать" cannot start a second provider sign-in while one is in flight

  Given: the resident selected "Google" on the sign-in method screen, tapped "Выбрать", and the
         provider sign-in has not yet settled
  When:  the resident taps "Выбрать" again
  Then:  no second provider window is opened
         "Выбрать" stays disabled until the sign-in settles

## Scenario 23: The resend control cannot be tapped twice while a request is in flight

  Given: the resend cooldown has elapsed and the resident tapped the resend control
  When:  the resident taps it again while the code request is still in flight
  Then:  only one code request is made
         the resend control stays disabled until the request settles
