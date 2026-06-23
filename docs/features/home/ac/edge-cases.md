# Home — Edge Cases

## Scenario 1: Empty changes feed
  Given: the changes endpoint returns no rows
  When:  the welcome card loads
  Then:  it shows the greeting only
         the changes list is omitted

## Scenario 2: Empty services or contacts list
  Given: a list endpoint (services or contacts) returns no items
  When:  its section loads
  Then:  the section header still renders
         the section body is empty and does not crash

## Scenario 3: Long name or location
  Given: an unusually long resident name or location string
  When:  the hero and greeting render
  Then:  the text wraps or truncates
         the layout is not broken

## Scenario 4: Returning to home preserves the nav
  Given: the resident navigated to a placeholder tab
  When:  they tap Home
  Then:  `/home` re-renders with its data
         the Home tab is marked active
