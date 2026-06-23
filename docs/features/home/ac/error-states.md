# Home — Error States

## Scenario 1: A content block's query fails
  Given: the changes, services, or contacts endpoint returns an error
  When:  home loads
  Then:  that block shows a non-blocking fallback
         the rest of the screen still renders

## Scenario 2: Profile query fails
  Given: the profile endpoint returns an error
  When:  home loads
  Then:  the hero and greeting show a graceful fallback (no name or location)
         the screen does not crash
         the rest of the screen renders

## Scenario 3: A block is still loading
  Given: an endpoint is still pending
  When:  home renders
  Then:  that block shows a loading state
         the other blocks render independently
