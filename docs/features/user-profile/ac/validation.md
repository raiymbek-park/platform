# User Profile — Validation

## Scenario 1: Name too short
  Given: the profile screen is open
  When:  the resident enters a 1-character name and taps «Сохранить»
  Then:  an error toast about the name is shown
         nothing is saved (reload shows the previous name)

## Scenario 2: Name too long
  Given: the profile screen is open
  When:  the resident enters a 61-character name and taps «Сохранить»
  Then:  an error toast about the name is shown
         nothing is saved

## Scenario 3: Apartment outside the selected block's range
  Given: the profile screen is open with block 1 selected (range 1–70)
  When:  the resident enters apartment 71 and taps «Сохранить»
  Then:  an error toast about the apartment range is shown
         nothing is saved

## Scenario 4: Apartment cleared
  Given: the profile screen is open
  When:  the resident clears the apartment field and taps «Сохранить»
  Then:  an error toast about the apartment is shown
         nothing is saved

## Scenario 5: Plate too short
  Given: the profile screen is open
  When:  the resident enters a plate whose space-stripped value is 4 characters
         (e.g. `A 123`) and taps «Сохранить»
  Then:  an error toast about the plate is shown
         nothing is saved

## Scenario 6: Plate without a letter or without a digit
  Given: the profile screen is open
  When:  the resident enters `12345` or `ABCDE` as a plate and taps «Сохранить»
  Then:  an error toast about the plate is shown
         nothing is saved

## Scenario 7: Plate is auto-uppercased
  Given: the profile screen is open with an empty plate input
  When:  the resident types `a 123 bc 01`
  Then:  the input displays `A 123 BC 01`

## Scenario 8: Duplicate plates rejected
  Given: the profile screen is open with plate `A 123 BC 01` filled
  When:  the resident adds a second plate `a123bc01` and taps «Сохранить»
  Then:  an error toast about duplicate plates is shown
         nothing is saved

## Scenario 9: Plate limit
  Given: the profile screen is open with 3 filled plate inputs
  When:  the resident looks for «Добавить ещё один номер машины»
  Then:  a fourth plate cannot be added

## Scenario 10: Phone is read-only
  Given: the profile screen is open
  When:  the resident taps the phone field and tries to type
  Then:  the value does not change

## Scenario 11: Apartment zero or negative is rejected
  Given: the profile screen is open
  When:  the resident enters apartment `0` (or a negative number) and taps «Сохранить»
  Then:  an error toast about the apartment is shown
         nothing is saved

## Scenario 12: An unverified phone is marked and stays undisclosed
  Given: the profile screen is open for a resident who registered with Google
  When:  the phone section renders
  Then:  the number is shown, marked «Номер не подтверждён»
         it is still read-only

  Given: the profile screen is open for a resident who registered with Google
  When:  the resident sets phone visibility to «Открыть» and taps «Сохранить»
  Then:  the setting saves
         the section states the number stays hidden from other residents until it is verified
