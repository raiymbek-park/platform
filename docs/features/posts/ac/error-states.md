# Posts — Error States

External failures: network, API, storage.

## Scenario 1: Feed query fails
  Given: the member opens `/posts`
  When:  the feed request fails
  Then:  an error state shows in the list block only
         the header, tabs, and nav remain usable
         a single failing block never blanks the screen

## Scenario 2: Next page fails
  Given: the feed has loaded a first page
  When:  fetching the next page fails
  Then:  the already-loaded posts remain visible
         the pagination placeholder resolves to a retry affordance rather than blanking the feed

## Scenario 3: Media upload fails on save
  Given: a post (or comment) with attached media is submitted
  When:  the storage upload fails
  Then:  the create/update does not proceed
         the failure is surfaced and the entered content is preserved for retry

## Scenario 4: Post mutation fails
  Given: a create, edit, or delete post request
  When:  the server request fails
  Then:  the failure is surfaced
         a delete that failed leaves the post in the feed
         an edit that failed preserves the form input for retry

## Scenario 5: Reaction mutation fails
  Given: an optimistic like/dislike was applied
  When:  the reaction request fails
  Then:  the optimistic overlay rolls back to the pre-action state on settle

## Scenario 6: Comment thread query fails
  Given: the member opens a comment thread
  When:  the thread request fails
  Then:  an error state shows in the thread
         the input bar and back navigation remain usable

## Scenario 7: Comment mutation fails
  Given: a send, edit, or delete comment request
  When:  the server request fails
  Then:  the failure is surfaced
         the comment count is not left inconsistent after settle

## Scenario 8: Post creation failure preserves entered input
  Given: a create post request
  When:  the server request fails
  Then:  the failure is surfaced
         the entered title, description, category, and attached media selection remain in the form for retry

## Scenario 9: Comment mutation failure preserves content and state
  Given: a send, edit, or delete comment request
  When:  the server request fails
  Then:  a failed send preserves the entered text and media selection in the input bar for retry
         a failed edit preserves the edited text in edit mode for retry
         a failed delete leaves the message visible in the thread
</content>
