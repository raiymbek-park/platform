# User Profile — Happy Path

## Scenario 1: Profile screen opens pre-filled
  Given: a signed-in registered resident with a saved profile
  When:  they open «Настройки» from the bottom navigation
  Then:  the screen shows avatar, name, phone, phone visibility, block, apartment, role,
         car plates, interface language, and a «Сохранить» button
         every field is pre-filled with the resident's current profile values
         the phone is rendered in `+7 707 123 45 67` format

## Scenario 2: Edit name and save
  Given: the profile screen is open
  When:  the resident replaces the name with a valid value and taps «Сохранить»
  Then:  a success toast is shown and the resident stays on the screen
         after a full reload the screen shows the new name

## Scenario 3: Toggle phone visibility and save
  Given: the profile screen is open with visibility «Скрыть» selected
  When:  the resident selects «Открыть» and taps «Сохранить»
  Then:  a success toast is shown
         after a full reload «Открыть» is selected

## Scenario 4: Change block, apartment, and role and save
  Given: the profile screen is open
  When:  the resident selects a different block, enters an apartment valid for that block,
         selects the other role, and taps «Сохранить»
  Then:  a success toast is shown
         after a full reload the new block, apartment, and role are selected

## Scenario 5: Add a car plate and save
  Given: the profile screen is open with no saved plates
  When:  the resident enters a valid plate (e.g. `A 123 BC 01`) and taps «Сохранить»
  Then:  a success toast is shown
         after a full reload the plate is listed

## Scenario 6: Remove a car plate and save
  Given: the profile screen is open with one saved plate
  When:  the resident removes the plate and taps «Сохранить»
  Then:  a success toast is shown
         after a full reload no plates are listed

## Scenario 7: Add another plate input
  Given: the profile screen is open with one filled plate input
  When:  the resident taps «Добавить ещё один номер машины»
  Then:  a second empty plate input appears

## Scenario 8: Switch interface language
  Given: the profile screen is open with «Русский» active
  When:  the resident taps «English»
  Then:  the UI switches to English immediately, without tapping «Сохранить»
         after a full reload the UI is still in English

## Scenario 9: Pick an avatar and save
  Given: the profile screen is open with no avatar (initials placeholder)
  When:  the resident picks a photo
  Then:  the preview replaces the placeholder immediately
  When:  the resident taps «Сохранить»
  Then:  a success toast is shown
         after a full reload the photo is displayed as the avatar

## Scenario 10: Switching language refreshes already-loaded localized content
  Given: a resident with «Русский» active has opened the announcements feed, whose cards
         are showing titles and descriptions in Russian
  When:  the resident opens «Настройки», taps «English», and returns to the announcements feed
  Then:  the feed cards render their titles and descriptions in English
         they no longer show the previously loaded Russian text

## Scenario 11: A newly registered resident starts with the phone hidden
  Given: a resident who has just completed registration
  When:  they open «Настройки» for the first time
  Then:  visibility shows «Скрыть» selected
         the profile stored at registration carries the phone as hidden — the resident's
         number is never exposed to other residents until they choose «Открыть» themselves
