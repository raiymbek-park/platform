# Home — Edge Cases

## Scenario 1: No new events since last visit
  Given: there are no events created after the resident's last recorded visit
  When:  the welcome card loads
  Then:  it shows the greeting by first name
         it shows a "no news" message
         no change rows are listed

## Scenario 2: Feed caps the number of events
  Given: more than ten events were created after the resident's last visit
  When:  the welcome card loads
  Then:  at most ten change rows are listed
         they are the most recent events, newest first

## Scenario 3: Already-seen events drop off on the next visit
  Given: the resident saw events in the feed and the visit was recorded
  When:  the resident opens home in a new app session
  Then:  the previously-seen events no longer appear in the feed

## Scenario 4: Empty contacts list
  Given: the contacts endpoint returns no contacts
  When:  the contacts section loads
  Then:  the section header still renders
         the section shows no contact rows and does not crash

## Scenario 5: Long name or location
  Given: an unusually long resident name or location string
  When:  the hero and greeting render
  Then:  the text wraps or truncates
         the layout is not broken

## Scenario 6: Returning to home preserves the nav
  Given: the resident navigated to the Объявления or Настройки tab
  When:  they tap Главная
  Then:  `/home` re-renders with its data
         the Главная tab is marked active
