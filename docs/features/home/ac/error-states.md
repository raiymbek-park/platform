# Home — Error States

## Scenario 1: The events feed fails to load
  Given: the events feed endpoint returns an error
  When:  home loads
  Then:  the welcome card shows a non-blocking "failed to load latest events" message
         the rest of the screen still renders

## Scenario 2: The contacts query fails
  Given: the contacts endpoint returns an error
  When:  home loads
  Then:  the contacts section shows a non-blocking failure message
         the rest of the screen still renders

## Scenario 3: Profile query fails
  Given: the profile endpoint returns an error
  When:  home loads
  Then:  the hero and greeting show a graceful fallback (no name or location)
         the screen does not crash
         the rest of the screen renders

## Scenario 4: The events feed is still loading
  Given: the events feed endpoint is still pending
  When:  home renders
  Then:  the welcome card shows a loading message for the latest events
         the other blocks render independently

## Scenario 5: The contacts list is still loading
  Given: the contacts endpoint is still pending
  When:  home renders
  Then:  the contacts section shows a loading state
         the other blocks render independently
