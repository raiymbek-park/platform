# Push Notifications — Edge Cases

## Scenario 1: Quiet hours hold the digest

  Given: a resident with a registered device and an event arising at 23:10 Asia/Almaty
  When:  the runs at 00:00 through 07:00 execute
  Then:  no digest is delivered

## Scenario 2: The morning digest carries the whole night

  Given: three events arising between 22:00 and 08:00 Asia/Almaty for a resident with a registered
         device
  When:  the first run after 08:00 executes
  Then:  one digest is delivered
         it covers all three events
         none of the three is dropped

## Scenario 3: The boundary hours are covered

  Given: a resident with a registered device and one event in the window
  When:  the run at 22:00 Asia/Almaty executes
  Then:  no digest is delivered
  And when: the run at 08:00 Asia/Almaty executes
  Then:  the digest is delivered

## Scenario 4: A resident with no recorded last visit

  Given: a resident who has never opened Home, with a registered device and recent activity
  When:  the hourly run computes their window
  Then:  the window is anchored on `lastNotifiedAt` alone
         the digest covers the most recent activity, capped at ten events

## Scenario 5: A resident with neither marker

  Given: a resident with a registered device, no recorded last visit, and no delivered digest
  When:  the hourly run computes their window
  Then:  the digest covers the most recent activity, capped at ten events
         `lastNotifiedAt` advances, so the next run does not repeat it

## Scenario 6: A newer digest replaces an unread one

  Given: a device showing an undismissed digest from the previous hour
  When:  a new digest is delivered to that device
  Then:  the device shows one digest, not two
         the shown digest is the newer one

## Scenario 7: A resident opens Home between the send and the tap

  Given: a delivered digest, and a resident who opens Home directly — recording a visit — before
         tapping it
  When:  the next hourly run executes with no further activity
  Then:  no digest is sent

## Scenario 8: The same device is reused by another resident

  Given: a device registered for resident A that changes hands to resident B, who signs in on it and
         grants permission
  When:  the hourly run sends digests
  Then:  the device receives resident B's digest
         the device receives no digest for resident A

## Scenario 9: The token rotates

  Given: a registered device whose push token is replaced by the delivery service
  When:  `/home` loads and the new token is registered
  Then:  the resident holds a registration for the new token
         the old token's registration is removed once the delivery service rejects it

## Scenario 10: An event whose author is unknown

  Given: a window whose newest event is a post whose author cannot be resolved
  When:  the digest is built
  Then:  the event still counts toward the digest's total
         the digest names the post's title
         the run does not fail

## Scenario 11: Exactly ten events

  Given: a resident whose window holds exactly ten events
  When:  the digest is built
  Then:  its remaining count is 9
         no event is dropped from the count

## Scenario 12: A resident downgraded to viewer keeps receiving the feed's events

  Given: a viewer with a registered device and a new announcement after their anchor
  When:  the hourly run computes their window
  Then:  the announcement is in their window
         the digest is delivered

## Scenario 13: A resident opens Home while the run is building their digest

  Given: a resident whose window holds one event, who opens Home — recording a visit — after the run
         has computed their window and before the digest reaches their device
  When:  the digest is delivered and the next hourly run executes with no further activity
  Then:  the resident receives exactly one digest for that window
         the next run sends no digest for the same event

## Scenario 14: An event's post is deleted after the window is computed

  Given: a resident whose window's newest event is an announcement titled "Отключение воды 15 июля",
         deleted after the run computed their window
  When:  the digest is sent and the resident taps it
  Then:  the run does not fail
         the app opens at `/home`
         the feed lists the activity that still exists, without the deleted announcement
         no error is shown

## Scenario 15: A language change on a device without notification permission changes nothing

  Given: a resident who declined the permission prompt
  When:  they switch the interface language
  Then:  no permission prompt is requested
         no registration is written
         no error is shown

## Scenario 16: Quiet hours follow the complex's time, not the device's

  Given: a resident with a registered device whose own time zone is not Asia/Almaty, and one event in
         the window
  When:  the run at 23:00 Asia/Almaty executes
  Then:  no digest is delivered
  And when: the run at 09:00 Asia/Almaty executes
  Then:  the digest is delivered, whatever hour the device's own clock reads

## Scenario 17: A language change heals an allowed device whose registration is missing

  Given: a resident whose device has notification permission granted but holds no registration —
         its earlier registration attempt failed
  When:  they switch the interface language
  Then:  no permission prompt is requested
         the device holds exactly one registration, recording the new locale

## Scenario 18: An untranslated event is named in the author's original wording

  Given: a device registered with locale `kk`, and a window holding one event — an announcement
         written in Russian as "Велик" with no Kazakh translation stored
  When:  the hourly run builds and sends the digest
  Then:  the digest's body names "Велик"
         the copy around the title is Kazakh
         the digest is delivered, rather than withheld or sent with an unnamed event

## Scenario 19: An event authored in the device's own language is named as written

  Given: a device registered with locale `ru`, and a window holding one event — an announcement
         written in Russian as "Велик"
  When:  the hourly run builds and sends the digest
  Then:  the digest's body names "Велик"

## Scenario 20: A stale translation is not preferred over the original

  Given: a device registered with locale `kk`, and a window holding one announcement whose title was
         edited after its Kazakh translation was stored, so the stored translation no longer matches
         the current title
  When:  the hourly run builds and sends the digest
  Then:  the digest names the announcement's current title as its author wrote it
         it does not name the superseded Kazakh translation
