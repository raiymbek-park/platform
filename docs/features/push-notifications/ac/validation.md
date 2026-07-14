# Push Notifications — Validation

## Scenario 1: The window anchor is the later of last visit and last digest

  Given: a resident whose `lastVisit` is 10:00 and whose `lastNotifiedAt` is 12:00
  When:  the hourly run computes their window
  Then:  the window covers events dated after 12:00
         an event dated 11:00 is not in the digest

## Scenario 2: An event already seen on Home is never pushed

  Given: a resident whose `lastNotifiedAt` is 09:00, who opens Home at 14:00 — recording a visit —
         reading an event dated 13:00
  When:  the 15:00 run computes their window
  Then:  the window covers events dated after 14:00
         the event dated 13:00 is not pushed

## Scenario 3: An event already pushed is never pushed twice

  Given: a resident who received a digest covering an event dated 13:00, and who has not opened Home
         since
  When:  the next hourly run executes and no further event has arisen
  Then:  no digest is sent
         the event dated 13:00 is not sent again

## Scenario 4: A resident's own actions never notify them

  Given: a resident who published an offer, wrote a comment on an issue they follow, and opened an
         issue — all after their anchor, with no other activity
  When:  the hourly run computes their window
  Then:  the window holds no events
         no digest is sent to them

## Scenario 5: Issue activity requires a follow for a non-staff resident

  Given: a resident who does not follow issue #14, and a status change on issue #14 after their anchor
  When:  the hourly run computes their window
  Then:  the status change is not in their window

## Scenario 6: A resident without a registered device is never considered

  Given: a resident who has never granted permission, and new activity after their anchor
  When:  the hourly run executes
  Then:  no message is sent for that resident
         their `lastNotifiedAt` does not advance

## Scenario 7: The digest reports at most ten events

  Given: a resident whose window holds fourteen events
  When:  the hourly run builds their digest
  Then:  the digest names the newest event
         its remaining count is 9, not 13
         the events beyond the tenth are read on Home rather than in a later digest

## Scenario 8: `lastNotifiedAt` advances only on a delivered digest

  Given: a resident with one event in the window and a registered device
  When:  the run sends the digest and the delivery service accepts it for at least one token
  Then:  `lastNotifiedAt` advances to the end of that window
  And given: a run in which the delivery service accepts the digest for no token
  Then:  `lastNotifiedAt` does not advance
         the next run covers the same window

## Scenario 9: The digest body carries no private content

  Given: a window whose newest event is a comment on issue #14 by another resident, whose text
         mentions an apartment number and a phone number
  When:  the digest is built
  Then:  its body names the issue by number only
         its body carries no comment text, no phone number, no apartment, and no author contact

## Scenario 10: Each event kind has a defined headline

  Given: a window whose newest event is each kind in turn
  When:  the digest body is built
  Then:  an `announcement` or `offer` is named by its stored title
         an `issue-status` is named by the issue's number and its new status
         an `issue-comment` is named as a new comment on the issue's number

## Scenario 11: A registration carries a supported locale

  Given: a device registering with a locale the app does not support
  When:  the token is registered
  Then:  the registration records the default locale
         the digest to that device is written in the default locale
