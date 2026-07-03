# Issue Tracker — Edge Cases

Boundary conditions around fields, reactions, and status filtering. Values refer to `prd.md`.

## Scenario 1: Title at the exact bounds

  Given: a Resident on the create-issue form
  When:  the trimmed title is exactly 3 characters, then exactly 80 characters
  Then:  both are accepted (the bounds are inclusive)

## Scenario 2: Description at the exact bounds

  Given: a Resident on the create-issue form
  When:  the trimmed description is exactly 10 characters, then exactly 1000 characters
  Then:  both are accepted (the bounds are inclusive)

## Scenario 3: Whitespace-only title or description

  Given: a Resident on the create-issue form
  When:  the title or description contains only whitespace
  Then:  it is treated as empty and fails the required check

## Scenario 4: Toggling a reaction off

  Given: a Resident who has already liked an issue
  When:  they tap like again
  Then:  their like is removed and the like count decreases by one

## Scenario 5: Switching a reaction from like to dislike

  Given: a Resident who has already liked an issue
  When:  they tap dislike
  Then:  the like is removed and a dislike is recorded (one reaction per user at a time)

## Scenario 6: Reacting to your own issue

  Given: a Resident viewing an issue they opened
  When:  they tap like or dislike
  Then:  the reaction is recorded (an author may react to their own issue)

## Scenario 7: Setting the status an issue already has

  Given: a Manager on the detail screen of a Planned issue
  When:  they select Planned again and save (optionally with a new comment)
  Then:  the status stays Planned; any new tags or comment are still applied

## Scenario 8: All classification tags at once

  Given: a Manager on the detail screen
  When:  they apply Under warranty, Needs clarification, and Duplicate together and save
  Then:  all three tags are applied to the issue

## Scenario 9: Editing or deleting an issue that has moved past New is blocked

  Given: a Resident whose own issue is now In progress
  When:  they open the actions menu on it
  Then:  the edit and delete actions are unavailable
  When:  an edit or delete is attempted anyway (by the author or Administration)
  Then:  the server rejects it; the issue is unchanged and still moves only by status

## Scenario 10: A filter with a single issue then that issue changes status

  Given: an New filter showing exactly one issue
  When:  a Manager moves that issue to In progress and the Resident's list refreshes
  Then:  the New filter shows the empty state and the issue appears under In progress

## Scenario 11: Long author name or many tags on a card

  Given: an issue whose author name is long and that carries several classification tags
  When:  its card renders in the list
  Then:  the author name does not overflow the card — it is truncated (with an ellipsis) or wraps
         within the name's own line
         every applied tag remains fully visible on the card, none clipped or hidden behind another
         element

## Scenario 12: Search with no matches

  Given: a signed-in user on the issue list
  When:  the query matches no issue in the active filter
  Then:  the empty state is shown (not skeleton cards), and clearing the query restores the list

## Scenario 13: Search by issue number

  Given: a list containing Issue #118
  When:  the user types "118"
  Then:  Issue #118 is shown; typing a number that no issue carries shows the empty state

## Scenario 14: Media at the exact limits

  Given: a Resident attaching media to an issue
  When:  they attach exactly 10 items totalling exactly 200 MB
  Then:  the attachment is accepted (the bounds are inclusive)
  When:  they add an 11th item, or the total exceeds 200 MB
  Then:  the addition is rejected

## Scenario 15: Switching filters while a list request is in flight

  Given: a signed-in user on `/issues` who switches from one status tab to another before the first
         tab's list request has resolved
  When:  the first tab's request resolves after the switch
  Then:  the list shown corresponds to the newly selected tab, not the abandoned request's results
