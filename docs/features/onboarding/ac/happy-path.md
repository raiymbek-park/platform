# Onboarding — Happy Path

## Scenario 1: The sign-in method screen opens with the phone method preselected

  Given: the resident has chosen a language and reaches the sign-in method screen
  When:  the screen loads
  Then:  a welcome hero with a greeting title and a description of the app is shown
         three methods are listed: "По номеру телефона", "Google", and "Facebook"
         "По номеру телефона" is selected and "Выбрать" is enabled

  Given: the sign-in method screen is shown
  When:  the screen loads
  Then:  the phone method carries the label "Только для операторов Kcell/Activ"
         the Google and Facebook methods carry the label "Быстрый вход с аккаунтом"

## Scenario 2: Picking a method leaves exactly one selected

  Given: "По номеру телефона" is selected on the sign-in method screen
  When:  the resident picks "Google"
  Then:  "Google" is selected and "По номеру телефона" is cleared — exactly one stays selected

## Scenario 3: The phone method opens the registration form with an editable phone field

  Given: "По номеру телефона" is selected on the sign-in method screen
  When:  the resident taps "Выбрать"
  Then:  the app moves to the registration form
         no provider sign-in window is opened
         the phone field is editable, empty, and shows the placeholder "+7 701 123 44 55"

  Given: the resident is on the registration form and has not touched the phone field
  When:  they type the first digit
  Then:  the placeholder disappears and only what they typed is in the field — the placeholder was
         never a value

## Scenario 4: Submitting the form on the phone method sends a code

  Given: the registration form is filled with a valid name, a valid Kcell phone (`+7 701…`), a block,
         an apartment number within that block's range, and a role, on the phone method
  When:  the resident taps "Далее"
  Then:  an SMS code is sent to the entered number
         the app moves to the verification screen

## Scenario 5: The verification screen shows the number and an empty code field

  Given: the resident reached the verification screen after a code was sent
  When:  the screen loads
  Then:  the entered phone number is shown in the format `+7 707 123 45 67`

  Given: the resident reached the verification screen after a code was sent
  When:  the screen loads
  Then:  an empty code field with the `xxx - xxx` mask is shown and focused

  Given: the resident reached the verification screen after a code was sent
  When:  the screen loads
  Then:  the resend control shows "Запросить код повторно через 1:00" and is disabled

## Scenario 6: The verification screen carries no social sign-in control

  Given: the resident reached the verification screen on the phone method
  When:  the screen loads
  Then:  no "Продолжить с Google" control and no Facebook control are shown
         the only way off the screen without a code is the back control

## Scenario 7: The code field masks the digits as "xxx - xxx"

  Given: the resident is on the verification screen
  When:  the resident types digits
  Then:  the field groups them as "xxx - xxx" (e.g. "12345" shows as "123 - 45")

## Scenario 8: The correct code registers and signs the resident in

  Given: 5 of the 6 digits are entered on the verification screen
  When:  the resident enters the sixth digit, forming the correct code
  Then:  the code is checked automatically — no button tap is required

  Given: the correct code is entered on the verification screen
  When:  the check succeeds
  Then:  the resident's profile is saved with the details from the registration form
         the resident is signed in

  Given: the resident's profile is saved after the code is confirmed
  When:  the save succeeds
  Then:  the app moves to home

## Scenario 9: The Google method signs in first and prefills the name

  Given: "Google" is selected on the sign-in method screen and the name field is empty
  When:  the resident taps "Выбрать" and chooses a Google account
  Then:  the resident is signed in on that Google account
         the app moves to the registration form
         the name field is pre-filled with the name from the Google profile and stays editable
         the phone field is empty

## Scenario 10: The Google method registers without a code

  Given: the resident signed in with Google and the registration form is filled with a valid name, a
         block, an apartment number within that block's range, and a role
  When:  the resident taps "Далее"
  Then:  the resident's profile is saved with the details from the form
         no SMS code is sent and the verification screen is never shown
         the app moves to home

## Scenario 11: The Facebook method behaves as the Google method does

  Given: "Facebook" is selected on the sign-in method screen
  When:  the resident taps "Выбрать" and chooses a Facebook account
  Then:  the resident is signed in on that Facebook account
         the app moves to the registration form
         the name field is pre-filled with the name from the Facebook profile and stays editable

  Given: the resident signed in with Facebook and the registration form is otherwise valid
  When:  the resident taps "Далее"
  Then:  the resident's profile is saved and the app moves to home

## Scenario 12: A resident registers over a social channel with no phone

  Given: the resident signed in with Google and left the phone field empty, with every other field
         valid
  When:  the resident taps "Далее"
  Then:  the profile is saved with no phone
         the app moves to home

## Scenario 13: A social-channel phone is stored in canonical form

  Given: the resident signed in with Google and entered a valid phone on the registration form
  When:  the profile is saved
  Then:  the stored phone is the number entered on the form, in canonical E.164 form

## Scenario 14: "Далее" cannot be submitted twice while the request is in flight

  Given: the registration form is fully valid and the resident taps "Далее"
  When:  the request is still in flight
  Then:  "Далее" is disabled and shows a loading state for the duration of the request
         the form cannot be submitted a second time

## Scenario 15: The field and actions are disabled while the check is in flight

  Given: 6 digits have been entered on the verification screen and the check is in flight
  When:  the response has not yet arrived
  Then:  a progress notice ("Ваш код отправляется на проверку…") is shown
         the code field, the back control, and the resend control are disabled

## Scenario 16: A resident whose carrier delivers no SMS reaches home over a social channel

  Given: a resident picked the phone method, submitted the form, reached the verification screen, and
         no code arrives
  When:  they tap the back control, return to the sign-in method screen, pick "Google", and choose a
         Google account
  Then:  the app moves to the registration form carrying the name they typed themselves — the Google
         profile name does not overwrite it
         completing the form registers them and the app moves to home
