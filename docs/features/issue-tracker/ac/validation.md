# Issue Tracker — Validation and Permission Rules

Field bounds refer to the **Field Rules** section of `prd.md`. Permission rules refer to the
**Roles and Permissions** matrix. Every permission rule is enforced on the server; hiding a control in
the interface is not sufficient.

## Field validation — open / edit an issue

## Scenario 1: Category is required

  Given: a Resident on the create-issue screen with no category selected
  When:  they try to submit
  Then:  submission is blocked and the category is flagged as required

## Scenario 2: Title length bounds

  Given: a Resident filling the create-issue form
  When:  the trimmed title is shorter than 3 characters or longer than 80 characters
  Then:  submission is blocked and the title is flagged as invalid

## Scenario 3: Description length bounds

  Given: a Resident filling the create-issue form
  When:  the trimmed description is shorter than 10 characters or longer than 1000 characters
  Then:  submission is blocked and the description is flagged as invalid

## Scenario 4: A valid form submits

  Given: a Resident with a category selected, a 3–80 character title, and a 10–1000 character
         description
  When:  they submit
  Then:  the issue is created (media and Urgent are optional and do not block submission)

## Scenario 5: Media is optional and bounded

  Given: a Resident on the create-issue form
  When:  they attach between 0 and 10 photos or videos whose combined size is at most 200 MB
  Then:  submission is allowed and the media is stored
  When:  they attach an 11th item, or the combined size exceeds 200 MB
  Then:  the extra media is rejected and submission is blocked until it is within the limits

## Field validation — change status

## Scenario 6: A status is required to save a change

  Given: a Manager on the detail screen with no new status selected
  When:  they try to save
  Then:  saving is blocked until exactly one status is chosen

## Scenario 7: Tags and comment are optional

  Given: a Manager who has selected a status
  When:  they save without any classification tag and with an empty comment
  Then:  the status change is saved; no tag is applied and no comment is recorded

## Scenario 8: Comment length bound

  Given: a Manager on the detail screen
  When:  the trimmed comment is longer than 1000 characters
  Then:  saving is blocked and the comment is flagged as invalid

## Permission rules

## Scenario 9: Viewer is read-only

  Given: a Viewer
  When:  they attempt to open an issue, react, change a status, edit, or delete
  Then:  the server rejects every one of these actions
         they can still view the issue list and detail

## Scenario 10: Resident and Owner may open, react, and manage their own New issues

  Given: a Resident (or Owner)
  When:  they open an issue, react to any issue, or edit/delete an New issue they opened
  Then:  each action succeeds

## Scenario 11: Resident cannot change status

  Given: a Resident
  When:  they attempt to change any issue's status
  Then:  the server rejects the action

## Scenario 12: Resident cannot touch another resident's issue

  Given: a Resident viewing an issue opened by a different user
  When:  they attempt to edit or delete it
  Then:  the server rejects the action

## Scenario 13: Manager changes status but cannot open, edit, or delete

  Given: a Manager
  When:  they change an issue's status, or react to an issue
  Then:  the status change and the reaction succeed
  When:  they attempt to open a new issue, or edit or delete any issue
  Then:  the server rejects those actions

## Scenario 14: Administration may do everything, within the editing window

  Given: an Administration user
  When:  they open an issue, react, or change any issue's status
  Then:  each action succeeds
  When:  they edit or delete an New issue (including one opened by someone else)
  Then:  the action succeeds

## Scenario 15: Editing and deletion are locked once an issue leaves New

  Given: an issue whose status has changed away from New
  When:  the author, or an Administration user, attempts to edit or delete it
  Then:  the server rejects the action for everyone
         changing the issue's status is still allowed for a Manager or Administration

## Default role

## Scenario 16: A signed-in account with no assigned role acts as a Resident

  Given: a signed-in account whose profile has no role, or an unrecognized role value
  When:  its permissions are resolved
  Then:  it is treated as a Resident (may open, react, and manage its own issues; may not change
         status or moderate)

## Search rules

## Scenario 17: Search matches title or number, case-insensitively

  Given: a signed-in user on the issue list
  When:  a word in the issue's title begins with the query, or the query matches the issue's number, in
         any letter case and ignoring surrounding whitespace
  Then:  that issue is shown; issues matching neither the title nor the number are hidden

## Scenario 18: A query below three characters applies no filter narrowing

  Given: a signed-in user with the In progress filter active and a query that is empty, whitespace-only,
         or shorter than three characters
  When:  the list is computed
  Then:  no search narrowing is applied and the full In progress list is shown, with no empty state

## Reaction rules

## Scenario 19: Rapid double-tap on a reaction is not sent twice

  Given: a Resident who taps like on an issue with no reaction from them
  When:  they tap like again before the first tap has finished processing
  Then:  the second tap has no additional effect — the issue ends with exactly one recorded like and
         the count increased by one, not two

## Search and filter interaction

## Scenario 20: Search query persists when the status filter changes

  Given: a signed-in user on `/issues` with a non-empty search query and a status filter active
  When:  they switch to a different status tab
  Then:  the query remains in the search field and continues to narrow the issues shown under the
         newly selected filter

## Follow rules

## Scenario 22: Any signed-in resident may follow or unfollow

  Given: a signed-in resident of any role, including a Viewer
  When:  they follow or unfollow an issue
  Then:  the action succeeds — following is a personal subscription available to every role that can
         view issues, and does not fall under the Viewer read-only restriction

## Scenario 23: Follow targets an existing issue

  Given: a follow or unfollow request
  When:  the target issue id does not exist
  Then:  the server rejects it

## Scenario 24: Auto-follow is applied only when its action succeeds

  Given: a resident creating an issue or posting a comment on one
  When:  the create or comment succeeds
  Then:  the resident follows the issue as part of the same operation
  When:  the create or comment fails
  Then:  no follow is recorded

## Author phone visibility

## Scenario 21: The author's phone is visible only to Managers, Administration, and the author

  Given: an issue opened by one user
  When:  a Resident, Owner, or Viewer who is not the author views it
  Then:  the payload carries no phone number for the author
  When:  the issue's own author, a Manager, or an Administration user views it
  Then:  the author's phone number is included
         the phone is omitted by the server, not merely hidden in the interface
