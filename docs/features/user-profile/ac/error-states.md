# User Profile — Error States

## Scenario 1: Profile update fails
  Given: the profile screen is open with valid edits
  When:  the resident taps «Сохранить» and the update request fails (network or server error)
  Then:  an error toast is shown
         the form keeps the entered values and stays editable
         after a full reload the previous profile values are intact

## Scenario 2: Avatar upload fails
  Given: the profile screen is open with a newly picked photo
  When:  the resident taps «Сохранить» and the file upload fails
  Then:  an error toast is shown
         no partial save happens (after reload the previous avatar and fields are intact)

## Scenario 3: Save in flight
  Given: the profile screen is open with valid edits
  When:  the resident taps «Сохранить» and the request is in flight
  Then:  the save button shows a loading state and repeated taps do not fire duplicate requests

## Scenario 4: Session missing
  Given: a visitor without a signed-in resident session
  When:  they navigate to `/settings`
  Then:  they are redirected to onboarding (session guard behavior)

## Scenario 5: Profile fails to load
  Given: a signed-in registered resident opens «Настройки»
  When:  the profile request fails (network or server error)
  Then:  an error state is shown instead of the form
         no partial or stale profile data is rendered
