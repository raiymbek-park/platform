# Issue Tracker — Error States

External failures — network and server errors while loading or mutating issues. Field and permission
rules live in `validation.md`.

## Scenario 1: Issue list fails to load

  Given: a signed-in user on `/issues`
  When:  the list request fails (network or server error)
  Then:  an error state with a retry action is shown instead of the list
         retrying re-requests the list and, on success, renders it

## Scenario 2: Opening an issue fails

  Given: a Resident who submitted a valid create-issue form
  When:  the create request fails
  Then:  an error message is shown, the form keeps the entered values, and submit is available to
         retry
         no issue is created

## Scenario 3: Status change fails

  Given: a Manager who saved a status change
  When:  the save request fails
  Then:  an error message is shown, the selected status/tags/comment are preserved, and save is
         available to retry
         the issue keeps its previous status

## Scenario 4: Reaction fails

  Given: a Resident whose like was applied optimistically
  When:  the reaction request fails
  Then:  the optimistic like is rolled back to the previous count and reaction

## Scenario 5: Edit fails

  Given: an author who saved an edit to their own issue
  When:  the update request fails
  Then:  an error message is shown, the edited values are preserved, and save is available to retry
         the stored issue is unchanged

## Scenario 6: Delete fails

  Given: an author who deleted their own issue
  When:  the delete request fails
  Then:  an error message is shown and the issue remains in the list

## Scenario 7: Some media fail to upload

  Given: a Resident submitting a valid create-issue form with several photos or videos attached
  When:  some attachments fail to upload while others succeed
  Then:  the issue is created with the successfully uploaded media attached
         the attachments that failed are dropped — not stored and not retried
         a message reports how many attachments did not upload
  When:  every attachment fails to upload
  Then:  the issue is still created from its text alone, with no media, and the failure count is
         reported

## Scenario 8: Acting on an issue that no longer exists

  Given: a user viewing an issue that has since been deleted
  When:  they react, edit, delete, or change its status
  Then:  the server reports the issue is gone and the interface returns to the list

## Scenario 9: Issue list succeeds after a delay

  Given: a signed-in user on `/issues`
  When:  the list request takes longer than usual but eventually succeeds
  Then:  skeleton cards remain shown for the full wait, with no error state shown before the response
         arrives
         once the response arrives, the skeleton cards are replaced by the issue cards as usual
