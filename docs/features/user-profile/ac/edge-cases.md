# User Profile — Edge Cases

## Scenario 1: Legacy profile without new fields
  Given: a resident whose stored profile has no visibility flag, no plates, and no avatar
  When:  they open the profile screen
  Then:  visibility shows «Скрыть» selected
         the plates section shows one empty input
         the avatar shows the initials placeholder

## Scenario 2: Leaving without saving discards edits
  Given: the profile screen is open and the resident has changed the name without saving
  When:  they navigate to another screen and return to «Настройки»
  Then:  the screen shows the saved profile values, not the discarded edits
         no prompt is shown on leaving

## Scenario 3: Save without changes
  Given: the profile screen is open and untouched
  When:  the resident taps «Сохранить»
  Then:  a success toast is shown and the profile is unchanged

## Scenario 4: Empty plate inputs are ignored
  Given: the profile screen is open with one filled plate and one empty plate input
  When:  the resident taps «Сохранить»
  Then:  the save succeeds and only the filled plate is stored

## Scenario 5: Name whitespace is trimmed
  Given: the profile screen is open
  When:  the resident enters a name with leading and trailing spaces and taps «Сохранить»
  Then:  the stored name has no leading or trailing spaces

## Scenario 6: Avatar picked but not saved
  Given: the profile screen is open and the resident picked a new photo without saving
  When:  they leave the screen and return
  Then:  the previous avatar (or initials placeholder) is shown

## Scenario 7: Name at length boundaries is accepted
  Given: the profile screen is open
  When:  the resident enters a 2-character name and taps «Сохранить»
  Then:  a success toast is shown and the name is saved
  When:  the resident enters a 60-character name and taps «Сохранить»
  Then:  a success toast is shown and the name is saved

## Scenario 8: Plate at length boundaries is accepted
  Given: the profile screen is open with an empty plate input
  When:  the resident enters a plate whose space-stripped value is 5 characters
         (e.g. `A1234`) and taps «Сохранить»
  Then:  a success toast is shown and the plate is saved
  When:  the resident enters a plate whose space-stripped value is 10 characters
         (e.g. `A123456789`) and taps «Сохранить»
  Then:  a success toast is shown and the plate is saved

## Scenario 9: Plate exceeding the maximum length is rejected
  Given: the profile screen is open
  When:  the resident enters a plate whose space-stripped value is 11 characters
         and taps «Сохранить»
  Then:  an error toast about the plate is shown
         nothing is saved

## Scenario 10: Apartment at the selected block's range boundaries is accepted
  Given: the profile screen is open with block 1 selected (range 1–70)
  When:  the resident enters apartment 1 and taps «Сохранить»
  Then:  a success toast is shown and the apartment is saved
  When:  the resident enters apartment 70 and taps «Сохранить»
  Then:  a success toast is shown and the apartment is saved

## Scenario 11: Replacing an existing avatar keeps only the latest photo
  Given: the profile screen is open with a previously saved avatar
  When:  the resident picks a new photo and taps «Сохранить»
  Then:  a success toast is shown
         after a full reload only the new photo is displayed as the avatar

## Scenario 12: Removing the avatar
  Given: the profile screen is open with a previously saved avatar
  When:  the resident taps «Удалить фото» and taps «Сохранить»
  Then:  the initials placeholder replaces the photo immediately
         after a full reload the initials placeholder is shown
