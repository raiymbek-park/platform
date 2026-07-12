# Home — Edge Cases

## Scenario 1: No new events since last visit
  Given: there are no events created after the resident's last recorded visit
  When:  the welcome card loads
  Then:  it shows the greeting by first name
         it shows a "no news" message
         no change rows are listed

## Scenario 2: Feed caps the number of events
  Given: more than ten events — across new announcements, new private offers, and activity on issues
         the resident follows — were created after the resident's last visit
  When:  the welcome card loads
  Then:  at most ten change rows are listed
         they are the ten most recent across all kinds, newest first

## Scenario 3: Already-seen events drop off on a full page reload
  Given: the resident saw events in the feed and the visit was recorded on this page load
  When:  the resident does a full page reload
  Then:  the feed is re-read against the now-advanced last visit
         the previously-seen events no longer appear in the feed

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

## Scenario 7: Activity on an unfollowed issue is not in the feed
  Given: an issue the resident does not follow has a status change or a new comment after their last
         visit
  When:  the welcome card loads
  Then:  that issue's activity does not appear in the feed

## Scenario 8: A resident who follows nothing still sees global events
  Given: the resident follows no issues, and new announcements or private offers exist since their last
         visit
  When:  the welcome card loads
  Then:  the new announcements and offers appear as change rows
         no issue activity appears

## Scenario 9: The resident's own actions never appear in their feed
  Given: since their last visit the resident published a post, wrote a comment on an issue they follow,
         or created a new issue
  When:  the welcome card loads
  Then:  none of those own actions appear as change rows
         only actions by others appear — others' posts, others' comments, and staff status changes
         (a manager changing the status of the resident's own issue does appear)
