# Issue Tracker — Happy Path

Status names (New, In progress, Planned, Blocked, Under resident review, Done, Rejected) and
category names refer to the values fixed in `prd.md`.

## Scenario 1: See the issue list grouped by status

  Given: a signed-in user of any role on `/issues`
  When:  the list loads with the default filter (New)
  Then:  issues with status New are shown, newest first
         each card shows the category, current status, any classification tags, the author, the
         like/dislike counts, and the comment count
         a card whose issue has media shows its first photo as a collapsed preview
         the status-filter tabs are visible, with New active
         the bottom navigation shows the Issues tab as active

## Scenario 2: Switch the status filter

  Given: a signed-in user on `/issues` with the New filter active
  When:  they tap the "In progress" tab
  Then:  only issues with status In progress are shown
         the "In progress" tab becomes active
         the active filter is reflected in the URL search parameter

## Scenario 3: Empty state for a filter with no issues

  Given: a signed-in user on `/issues`
  When:  they select a status tab that holds no issues
  Then:  the empty state ("no issues") illustration and message are shown in place of the list
         the status-filter tabs remain visible and usable

## Scenario 4: Open an issue

  Given: a Resident on the create-issue screen
  When:  they pick the category Repair, enter a valid title and description, and submit
  Then:  the issue is created with status New
         the author is set from the signed-in profile (name, phone, block, apartment)
         the issue is assigned the next sequential number
         the app returns to the issue list and the new issue appears under the New filter
         a confirmation that the issue was submitted is shown

## Scenario 5: Open an urgent issue with media

  Given: a Resident on the create-issue screen
  When:  they pick a category, mark it Urgent, enter a valid title and description, attach one or more
         photos or videos (up to 10 items, 200 MB total), and submit
  Then:  the issue is created with status New, the Urgent flag set, and the media attached

## Scenario 6: Manager changes an issue's status

  Given: a Manager on the detail screen of an New issue
  When:  they select the status Planned, add the tag "Under warranty" and a comment, and save
  Then:  the issue's status becomes Planned
         the tag "Under warranty" is applied and the comment is recorded
         the comment appears as a message in the issue's comment thread and the comment count
         on the issue card increments
         a Resident viewing the same issue sees the status Planned

## Scenario 7: Change status in any direction

  Given: a Manager on the detail screen of a Done issue
  When:  they select the status In progress and save
  Then:  the issue's status becomes In progress
         (any status may be set from any status — there is no fixed transition order)

## Scenario 8: React to an issue

  Given: a Resident viewing an issue with no reaction from them
  When:  they tap like
  Then:  the like count increases by one and their reaction is recorded as a like

## Scenario 9: Edit your own New issue

  Given: a Resident viewing an New issue they opened
  When:  they reopen it in the form, change the description to another valid value, and save
  Then:  the issue's description is updated
         the issue's status, number, and author are unchanged

## Scenario 10: Delete your own New issue

  Given: a Resident viewing an New issue they opened
  When:  they delete it (confirming the prompt)
  Then:  the issue is removed and no longer appears in any status filter
         a confirmation that the issue was deleted is shown

## Scenario 11: Administration moderates another user's New issue

  Given: an Administration user viewing an New issue opened by someone else
  When:  they edit its title to a valid value and save, or delete it
  Then:  the edit or deletion succeeds

## Scenario 12: Search the issue list

  Given: a signed-in user on `/issues` with a status filter active
  When:  they type a query of at least three characters into the search field
  Then:  only issues whose title has a word beginning with the query, or whose number matches, are shown
         only issues within the active status filter are shown
         clearing the query restores the full filtered list

## Scenario 13: Skeletons while the list loads

  Given: a signed-in user opening `/issues`
  When:  the list request is still pending
  Then:  skeleton (ghost) cards are shown in place of the list
         once the issues arrive, the skeletons are replaced by the issue cards

## Scenario 14: Infinite scroll loads more issues

  Given: a signed-in user on `/issues` with a filter that holds more issues than one page
  When:  they scroll to the end of the loaded list
  Then:  the next page of issues is requested and appended below the current ones
         a loading placeholder is shown while the next page is in flight

## Scenario 15: Media preview expands with the card

  Given: a signed-in user viewing an issue with one or more photos, shown collapsed
  When:  they expand the card
  Then:  the media preview grows from its collapsed height to the photo's full height
  When:  they collapse the card again
  Then:  the preview returns to its collapsed height

## Scenario 16: The All tab shows issues of every status

  Given: a signed-in user on `/issues` with issues existing across several statuses
  When:  they select the "All" filter tab
  Then:  issues of every status are shown together, newest first
         the "All" tab becomes active
         the active filter is reflected in the URL search parameter

## Scenario 17: A search shows loading placeholders, not the empty state, while it resolves

  Given: a signed-in user typing a query of at least three characters that no already-loaded issue
         matches
  When:  the search request is still in flight
  Then:  skeleton loading placeholders are shown in place of the list
         the empty state is not shown while the request is in flight
