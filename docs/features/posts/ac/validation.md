# Posts — Validation

Input rules and permission gating. Field limits reuse the issues conventions.

## Scenario 1: Title length
  Given: the create/edit form (either kind)
  When:  the trimmed title is shorter than 3 or longer than 80 characters
  Then:  the form blocks submission and flags the title

## Scenario 2: Description length
  Given: the create/edit form
  When:  the trimmed description is shorter than 10, or longer than the kind's maximum
         (1000 characters for an offer, 3000 for an announcement)
  Then:  the form blocks submission and flags the description

## Scenario 3: Category required
  Given: the create/edit form
  When:  no category is selected
  Then:  submission is blocked until exactly one category from the kind's set is chosen

## Scenario 4: Media limits
  Given: the create/edit form
  When:  the member attaches more than 10 items, or the combined size exceeds 200 MB
  Then:  the excess is rejected and the limit is surfaced

## Scenario 5: Comment message requires content
  Given: a comment input bar
  When:  the member sends with empty text and no media
  Then:  the send is blocked

## Scenario 5a: Comment text length
  Given: a comment input bar
  When:  the trimmed text is longer than 1000 characters
  Then:  the send is blocked and the excess is flagged

## Scenario 6: Search minimum characters
  Given: the feed search field
  When:  the query is empty or a single character
  Then:  no narrowing is applied and the full active-tab list shows
  And:   narrowing begins at two characters (`SEARCH_MIN_CHARS` = 2)

## Scenario 6a: Markdown is a safe GFM subset
  Given: body or comment text containing raw HTML, a `<script>` tag, or an `on*` handler attribute
  When:  it renders
  Then:  the raw HTML/script is not rendered as live markup
         only the safe GFM subset (text, headings, lists, task lists, links, code, blockquotes) renders
  And:   the character limit is measured against the raw Markdown source, not the rendered output

## Scenario 7: Kind is fixed
  Given: an existing post
  When:  the author edits it
  Then:  every field may change except the kind, which is not editable

## Scenario 8: Create-kind gating by role
  Given: the create FAB
  When:  a Resident or Owner opens it → only the **offer** form is reachable
         a Manager opens it → only the **announcement** form is reachable
         an Administration member opens it → either kind is selectable
         a Viewer → no create entry is available

## Scenario 9: Server enforces post permissions
  Given: a request to create, edit, or delete a post
  When:  the caller lacks the right (Viewer creating; Resident publishing an announcement; a
         non-author, non-Administration member editing/deleting another's post)
  Then:  the server rejects it, independent of the interface

## Scenario 10: Server enforces comment permissions
  Given: a request to write, edit, or delete a comment
  When:  a Viewer writes; a non-author, non-Administration member edits/deletes another's comment
  Then:  the server rejects it

## Scenario 11: Save is disabled while a post mutation is in flight
  Given: a create or edit post form has been submitted
  When:  the mutation is still in flight
  Then:  the save action is disabled until the request settles
         a second tap does not send a duplicate request

## Scenario 12: Canceling the delete confirmation preserves the post
  Given: the bottom-drawer delete confirmation is open for a post
  When:  the member cancels instead of confirming
  Then:  no delete request is sent
         the post remains in the feed

## Scenario 13: Comment media limits
  Given: a comment input bar
  When:  the member attaches more than 10 items, or the combined size exceeds 200 MB
  Then:  the excess is rejected and the limit is surfaced

## Scenario 14: Send is disabled while a comment mutation is in flight
  Given: a send, edit, or delete comment request has been submitted
  When:  the mutation is still in flight
  Then:  the action is disabled until the request settles
         a second tap does not send a duplicate request

## Scenario 15: Canceling the delete confirmation preserves the comment
  Given: the delete confirmation is open for a comment
  When:  the member cancels instead of confirming
  Then:  no delete request is sent
         the message remains in the thread
</content>
