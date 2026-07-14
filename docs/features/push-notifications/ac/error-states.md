# Push Notifications — Error States

## Scenario 1: Declining permission leaves the app fully working

  Given: the permission prompt is shown on `/home`
  When:  the resident declines it
  Then:  no device is registered
         no error is shown
         the events feed, services, contacts, and navigation render and behave as before

## Scenario 2: A declined device is never asked again

  Given: a device on which the resident has declined or dismissed the prompt
  When:  `/home` loads again
  Then:  the app does not request permission again

## Scenario 3: A browser that cannot deliver push degrades silently

  Given: a browser with no support for the push or notification capability
  When:  `/home` loads
  Then:  no prompt is requested
         no device is registered
         no error is shown and every screen renders normally

## Scenario 4: Failing to obtain a token does not break Home

  Given: a resident who grants permission
  When:  obtaining the device's push token fails
  Then:  no registration is written
         no error is shown
         `/home` renders and behaves normally

## Scenario 5: A rejected token is pruned

  Given: a resident with two registered devices, one of whose tokens the delivery service reports as
         no longer registered
  When:  the hourly run sends their digest
  Then:  the rejected token's registration is removed
         the other device receives the digest
         `lastNotifiedAt` advances

## Scenario 6: One resident's failure does not stop the run

  Given: three residents due a digest, the second of whom fails during send
  When:  the hourly run executes
  Then:  the first and third residents receive their digests
         the second resident's `lastNotifiedAt` does not advance
         the run completes

## Scenario 7: A failed run is covered by the next one

  Given: a resident with events in the window, and a run that fails before sending their digest
  When:  the next hourly run executes
  Then:  the digest covers the same window plus anything that arose since
         the resident receives one digest, not two

## Scenario 8: A missing delivery credential degrades to silence

  Given: a deployment in which the delivery credential is absent
  When:  `/home` loads and the hourly run executes
  Then:  no device is registered and no digest is sent
         no screen shows an error
         the Home feed continues to show all activity

## Scenario 9: Registering a token fails without surfacing to the resident

  Given: a resident who grants permission
  When:  the registration request fails
  Then:  no error is shown
         `/home` renders normally
         a later Home load registers the device

## Scenario 10: A registration whose resident no longer exists is skipped

  Given: a registered device whose resident's record is gone, and two other residents due a digest
  When:  the hourly run executes
  Then:  no digest is sent for the missing resident
         the two other residents receive their digests
         the run completes

## Scenario 11: A device that fails for any other reason keeps its registration

  Given: a resident with two registered devices, and a run in which the delivery service accepts the
         digest for the first device and rejects it for the second for a reason other than the
         registration being unknown
  When:  the hourly run sends their digest
  Then:  the second device's registration is kept
         the first device receives the digest

## Scenario 12: A slow registration never blocks Home

  Given: a resident who grants permission on `/home`
  When:  obtaining and registering the device's token takes longer than the feed takes to render
  Then:  the events feed, services, contacts, and navigation stay interactive throughout
         no loading indicator and no blocked screen appears
         the device is registered once the request completes
