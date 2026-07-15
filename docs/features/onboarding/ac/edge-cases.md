# Onboarding — Edge Cases

## Scenario 1: The resend control enables when the cooldown reaches zero

  Given: the resident is on the verification screen and the resend cooldown is counting down
  When:  the countdown reaches 0:00
  Then:  the resend control "Запросить код повторно" becomes enabled

## Scenario 2: Escalating resend cooldown

  Given: the resident is on the verification screen and the cooldown after the previous send has
         elapsed
  When:  they tap the resend control and a new code is sent (1st resend)
  Then:  the cooldown restarts and counts down from 2:00 (120 s)

  Given: the 120 s cooldown has elapsed
  When:  the resident taps the resend control again and a new code is sent (2nd resend)
  Then:  the cooldown restarts and counts down from 5:00 (300 s)

  Given: the 300 s cooldown has elapsed
  When:  the resident taps the resend control again and a new code is sent (3rd resend)
  Then:  the cooldown restarts and counts down from 10:00 (600 s)

  Given: the cooldown has reached its cap
  When:  any further resend succeeds
  Then:  the cooldown restarts and counts down from 10:00 (600 s)

## Scenario 3: A successful resend clears the entered code

  Given: the resident has typed some digits on the verification screen and the resend cooldown has
         elapsed
  When:  they tap the resend control and a new code is sent
  Then:  the field clears
         focus returns to the code field

## Scenario 4: The sign-in method screen requires a language choice

  Given: no language has been chosen (e.g. a direct visit)
  When:  the resident navigates to the sign-in method screen
  Then:  the app redirects to the language screen

## Scenario 5: The registration form requires a chosen sign-in method

  Given: no sign-in method has been chosen (e.g. a direct visit)
  When:  the resident navigates to the registration form
  Then:  the app redirects to the sign-in method screen

## Scenario 6: A social channel without a session cannot reach the registration form

  Given: the sign-in method is Google but no session was established (the sign-in never completed)
  When:  the resident navigates to the registration form
  Then:  the app redirects to the sign-in method screen

## Scenario 7: Verification screen without a pending code request redirects to the form

  Given: there is no pending code request (e.g. a direct visit or a relaunch)
  When:  the resident navigates to the verification screen
  Then:  the app redirects to the registration form

## Scenario 8: A signed-in, registered resident is kept out of onboarding

  Given: the resident is signed in and has a saved profile
  When:  the resident navigates to any onboarding screen
  Then:  the app redirects to home
         the onboarding screens are not shown

## Scenario 9: A signed-in resident without a profile resumes on the registration form

  Given: the resident signed in with Google, abandoned the registration form without typing a name,
         and closed the app
  When:  the resident reopens the app
  Then:  the app opens the registration form — not home and not the sign-in method screen
         the name is pre-filled from the Google profile again

  Given: the resident signed in with Google, typed their own name over the prefilled one, abandoned
         the form, and closed the app
  When:  the resident reopens the app
  Then:  the registration form carries the name they typed — the Google profile name does not
         overwrite it on the way back

  Given: the resident is signed in with no saved profile
  When:  the resident navigates directly to home
  Then:  the app redirects into onboarding — a session alone does not unlock home

## Scenario 10: Unauthenticated direct navigation to home redirects into onboarding

  Given: the resident is not signed in
  When:  the resident navigates directly to the home screen
  Then:  the app redirects into onboarding
         the home screen content is not shown

## Scenario 11: A returning resident's registration details are pre-filled

  Given: the resident previously entered registration details and returns to the registration form
  When:  the form loads
  Then:  the name, phone, block, apartment, and role are pre-filled with the previously entered
         values

## Scenario 12: The locked screen requires a phone number in the registration draft

  Given: there is no phone number in the in-progress registration draft (e.g. a direct visit)
  When:  the resident navigates to the "Доступ заблокирован" (Access locked) screen
  Then:  the app redirects to the registration form

## Scenario 13: A provider that supplies no name leaves the field empty

  Given: the resident signs in with a provider account that carries no name
  When:  the registration form loads
  Then:  the name field is empty and editable
         the resident enters a name and the form submits normally

## Scenario 14: Re-authenticating on an existing identity keeps a single resident record

  Given: a resident record already exists under the caller's verified Firebase user id
  When:  the resident completes the registration form and confirms an SMS code again
  Then:  no new resident record is created
         the stored profile (name, avatar, cars, role) is preserved and not overwritten by
         the re-submitted form values

## Scenario 15: A resident with an existing SMS account who picks Google lands on a separate account

  Given: a resident registered over SMS, has issues, offers, and car plates on that account, and is
         signed out
  When:  they pick "Google" on the sign-in method screen, choose a Google account, and complete the
         registration form with the same phone
  Then:  a new resident is registered under the Google identity
         it carries none of the SMS account's issues, offers, comments, reactions, or car plates
         both accounts hold the same phone
         the SMS account is left untouched and is reached again by completing an SMS code on it

## Scenario 16: Google and Facebook accounts are separate residents

  Given: a resident registered over the Google channel and is signed out
  When:  they pick "Facebook" and register with a Facebook account
  Then:  a new resident is registered under the Facebook identity, carrying none of the Google
         account's history
         the Google account is left untouched

## Scenario 17: A social channel grants no elevated role

  Given: a person whose SMS account holds the `manager` or `administration` role
  When:  they register over the Google or Facebook channel
  Then:  the new resident holds only the role picked on the form (owner or tenant)
         it resolves to a plain resident — no manager or administration permission is granted

## Scenario 18: A resident with no phone is displayed without one

  Given: a resident registered over a social channel with an empty phone field
  When:  a surface that shows a resident's phone renders that resident
  Then:  the absent phone is handled without error
         no placeholder implies a phone that was never given

## Scenario 19: A signed-in resident without a profile is sent to the form from the method screen

  Given: the resident signed in with Google and has no saved profile
  When:  the resident navigates to the sign-in method screen
  Then:  the app redirects to the registration form
         the sign-in method screen is not shown

## Scenario 20: The resend cooldown starts at 60 s each time the verification screen opens

  Given: the resident resent the code twice (the cooldown had escalated to 5:00), tapped back to the
         registration form, and submitted it again
  When:  the verification screen opens
  Then:  the resend control is disabled and counts down from 1:00 — the cooldown starts active at
         60 s whenever the screen opens
