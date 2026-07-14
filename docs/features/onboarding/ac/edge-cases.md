# Onboarding — Edge Cases

## Scenario 1: Resend cooldown starts active on the verification screen

  Given: the user has just reached the verification screen after a code was sent
  When:  the screen loads
  Then:  the resend control is disabled and counts down from 1:00 (60 s)

## Scenario 2: The resend control enables when the cooldown reaches zero

  Given: the user is on the verification screen and the resend cooldown is counting down
  When:  the countdown reaches 0:00
  Then:  the resend control "Запросить код повторно" becomes enabled

## Scenario 3: Escalating resend cooldown

  Given: the user is on the verification screen and the cooldown after the previous send has elapsed
  When:  they tap the resend control and a new code is sent (1st resend)
  Then:  the cooldown restarts and counts down from 2:00 (120 s)

  Given: the 120 s cooldown has elapsed
  When:  the user taps the resend control again and a new code is sent (2nd resend)
  Then:  the cooldown restarts and counts down from 5:00 (300 s)

  Given: the 300 s cooldown has elapsed
  When:  the user taps the resend control again and a new code is sent (3rd resend)
  Then:  the cooldown restarts and counts down from 10:00 (600 s)

  Given: the cooldown has reached its cap
  When:  any further resend succeeds
  Then:  the cooldown restarts and counts down from 10:00 (600 s)

## Scenario 4: A successful resend clears the entered code

  Given: the user has typed some digits on the verification screen and the resend cooldown has
         elapsed
  When:  they tap the resend control and a new code is sent
  Then:  the field clears
         focus returns to the code field

## Scenario 5: Verification screen without a pending code request redirects to welcome

  Given: there is no pending code request (e.g. a direct visit or a relaunch)
  When:  the user navigates to the verification screen
  Then:  the app redirects to the welcome screen

## Scenario 6: Unauthenticated direct navigation to home redirects to welcome

  Given: the user is not signed in
  When:  the user navigates directly to the home screen
  Then:  the app redirects to the welcome screen
         the home screen content is not shown

## Scenario 7: A signed-in resident is kept out of onboarding

  Given: the resident is signed in
  When:  the user navigates to any onboarding screen
  Then:  the app redirects to home
         the onboarding screens are not shown

## Scenario 8: A returning user's registration details are pre-filled

  Given: the user previously entered registration details and returns to the welcome screen
  When:  the form loads
  Then:  the name, phone, block, apartment, and role are pre-filled with the previously entered
         values

## Scenario 9: The locked screen requires a phone number in the registration draft

  Given: there is no phone number in the in-progress registration draft (e.g. a direct visit)
  When:  the user navigates to the "Доступ заблокирован" (Access locked) screen
  Then:  the app redirects to the welcome screen

## Scenario 10: Re-authenticating on an existing identity keeps a single resident record

  Given: a resident record already exists under the caller's verified Firebase user id
  When:  the resident completes the registration form and confirms an SMS code again
  Then:  no new resident record is created
         the stored profile (name, avatar, cars, role) is preserved and not overwritten by
         the re-submitted form values

## Scenario 11: A resident with an existing SMS account who taps Google lands on a separate account

  Given: a resident registered over SMS, has issues, offers, and car plates on that account, and is
         signed out
  When:  they fill in the registration form with the same phone, reach the verification screen, and
         continue with Google
  Then:  a new resident is registered under the Google identity
         it carries none of the SMS account's issues, offers, comments, reactions, or car plates
         both accounts hold the same phone
         the SMS account is left untouched and is reached again by completing an SMS code on it

## Scenario 12: The Google channel grants no elevated role

  Given: a person whose SMS account holds the `manager` or `administration` role
  When:  they register over the Google channel
  Then:  the new resident holds only the role picked on the form (owner or tenant)
         it resolves to a plain resident — no manager or administration permission is granted

## Scenario 13: The Google control is unreachable without a registration draft

  Given: there is no verification started from the registration form (e.g. a direct visit)
  When:  the user navigates to the verification screen
  Then:  the app redirects to the welcome screen
         the Google control is not reachable, so no registration can start without form details
