# Infrastructure — Edge Cases

## Scenario 1: Cold-start latency within budget

  Given: the function has idled to zero instances
  When:  the first request after idle arrives
  Then:  it responds within 5 s
         subsequent warm requests respond within 500 ms

## Scenario 2: Profile read for an unknown uid

  Given: no `residents` document exists for the request's `uid`
  When:  the home screen requests the resident profile
  Then:  an empty profile (zeroed block and apartment, empty name) is returned
         no error is raised

## Scenario 3: Home content with empty collections

  Given: `serviceContacts` and `events` contain no documents
  When:  the home screen loads
  Then:  the contacts list is empty
         the changes list is empty
         no error is raised

## Scenario 4: First visit has no last-visit filter

  Given: the request's `uid` has no resident document, so there is no `lastVisit`
  When:  the home screen requests changes
  Then:  recent events are returned without a last-visit filter
         the result is ordered by `createdAt` descending and limited to 10

## Scenario 5: Changes are capped at ten events

  Given: more than ten `events` documents exist after the resident's last visit
  When:  the home screen requests changes
  Then:  exactly the ten most recent events (by `createdAt` descending) are returned

## Scenario 6: Stored profile survives a redeploy

  Given: a `residents/{uid}` document was written and the function is redeployed
  When:  the same `uid` is read after the redeploy
  Then:  the profile is read back from Firestore unchanged
         the redeploy does not reset or drop the stored data

## Scenario 7: Documents with unknown glyph or tone fall back to defaults

  Given: a `serviceContacts` or `events` document carries a glyph or tone outside the known set
  When:  the home screen reads that document
  Then:  the glyph falls back to `megaphone` and the tone falls back to `brand`
         the item is still returned rather than dropped
