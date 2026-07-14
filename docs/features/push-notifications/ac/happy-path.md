# Push Notifications — Happy Path

## Scenario 1: The app requests permission once on Home

  Given: a resident with a valid session and a device with no notification decision recorded
  When:  `/home` loads and the events feed has finished loading
  Then:  the browser's notification permission prompt is requested
         the rest of the screen renders and behaves exactly as it does without the prompt

## Scenario 2: Granting permission registers the device

  Given: the permission prompt is shown on `/home`
  When:  the resident grants permission
  Then:  the device's push token is registered against the resident
         the registration records the locale the app is running in
         no visible change occurs on the screen

## Scenario 3: Registration is idempotent across Home loads

  Given: a device already registered for a resident
  When:  `/home` loads again and the token is registered again
  Then:  the resident holds exactly one registration for that token
         the registration's locale reflects the app's current locale

## Scenario 4: A single event produces a digest naming it

  Given: a resident with a registered device, whose window holds exactly one event — an announcement
         titled "Отключение воды 15 июля"
  When:  the hourly run builds and sends digests, outside quiet hours
  Then:  the device receives exactly one digest
         its body names "Отключение воды 15 июля"
         its body states no remaining count
         the resident's `lastNotifiedAt` advances to the end of that window

## Scenario 5: Several events produce one digest with the newest event and a count

  Given: a resident with a registered device, whose window holds three events, the newest an
         announcement titled "Лифт не работает"
  When:  the hourly run builds and sends digests, outside quiet hours
  Then:  the device receives exactly one digest, not three
         its body names "Лифт не работает"
         its body states that 2 further events wait

## Scenario 6: Tapping the digest opens Home

  Given: a delivered digest on the device
  When:  the resident taps it
  Then:  the app opens at `/home`
         the digest's events are listed there as change rows

## Scenario 7: The digest reaches every registered device of one resident

  Given: a resident with two registered devices and at least one event in the window
  When:  the hourly run sends the digest
  Then:  both devices receive the same digest

## Scenario 8: Silence produces no digest

  Given: a resident with a registered device whose window holds no events
  When:  the hourly run executes
  Then:  no message is sent to that resident
         the resident's `lastNotifiedAt` does not advance

## Scenario 9: A digest covers the same events as the Home feed

  Given: an announcement, a private offer, a status change on an issue the resident follows, and a
         comment from another resident on that issue, all dated after the resident's anchor
  When:  the hourly run builds the resident's digest
  Then:  all four count toward the digest's event total
         the digest names the newest of them

## Scenario 10: Staff receive issue activity across all issues

  Given: a manager with a registered device, and a status change on an issue the manager does not
         follow, dated after their anchor
  When:  the hourly run builds the manager's digest
  Then:  the status change counts toward the digest

## Scenario 11: Registering a device for a new resident ends the previous registration

  Given: a device registered for resident A, and resident B holding a valid session on that same
         device
  When:  `/home` loads for resident B and the device's token is registered
  Then:  the token's registration under resident A is removed
         resident B holds exactly one registration for that token
         a later run sends resident A no digest on that device
         resident A's other registered devices keep receiving digests

## Scenario 12: The digest is written in the device's locale

  Given: two devices registered for one resident — one with locale `ru`, one with locale `en` — and
         one event in the window
  When:  the hourly run sends the digest
  Then:  the `ru` device's copy is Russian
         the `en` device's copy is English
