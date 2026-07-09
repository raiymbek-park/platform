# Posts — Happy Path

Scenarios are grouped by the three task slices. Task 1 unblocks the others.

## Task 1 — Post feed & cards

## Scenario 1: Feed loads with all posts
  Given: a signed-in member opens `/posts`
  When:  the feed query resolves
  Then:  the **Все** tab is active
         posts render newest-first as cards
         each card shows category icon, title, "date · author", and a collapsed body
         the reaction bar shows like, dislike, and comment count

## Scenario 2: Filter by kind
  Given: the member is on `/posts` with **Все** active
  When:  they tap **Уведомления**
  Then:  the `tab` search param becomes `announcements`
         only announcement posts are shown
         tapping **Частные объявления** switches `tab` to `offers` and shows only offers

## Scenario 3: Search by title
  Given: the feed holds posts
  When:  the member types a query of two or more characters into the search field
  Then:  the list narrows to posts whose title has a word beginning with the query, within the active tab
         results resolve on the server across the whole active tab, newest-first

## Scenario 4: Expand a post
  Given: a card is collapsed
  When:  the member taps "Подробнее"
  Then:  the full body shows, rendered as Markdown (safe GFM subset)
         any media expands to full height (a gallery when several)
         the author contact block shows (for an offer: name, block/apartment, phone)
         "Свернуть" collapses it again

## Scenario 4a: Markdown renders in the body
  Given: a post whose body contains Markdown (headings, lists, bold/italic, links, task lists, code)
  When:  the body renders
  Then:  the Markdown displays formatted through the shared renderer
         task-list items (`- [ ]` / `- [x]`) render as read-only checkboxes that do nothing on tap
         raw HTML or scripts in the source are not rendered as markup
         links carry `rel="noopener noreferrer"` and open in a new tab

## Scenario 5: React to a post
  Given: a Resident (or higher) views a post
  When:  they tap like (or dislike)
  Then:  the reaction applies immediately (optimistic)
         tapping the same reaction again removes it
         the count reflects server truth after settle

## Scenario 6: Paginate
  Given: the feed has more posts than one page (20)
  When:  the member scrolls to the end
  Then:  the next page loads with a placeholder, appended newest-first

## Scenario 7: Nav and home entry points reach posts
  Given: the member is on `/home`
  When:  they tap the "Объявления" bottom-nav tab or a home "Объявления" service card
  Then:  they land on `/posts` with the tab marked active in the bottom nav

## Task 2 — Create, edit, delete posts

## Scenario 8: Resident publishes an offer
  Given: a Resident taps the create FAB
  When:  they pick a category (e.g. Услуги), enter a title and description, optionally attach photos, and save
  Then:  a notice on the form states the phone will be visible to everyone
         the offer is created with kind `offer`
         it appears in the feed and under **Частные объявления** with its category tag

## Scenario 9: Manager publishes an announcement
  Given: a Manager taps the create FAB
  When:  they pick a category (e.g. Управляющая компания), enter a title and description, and save
  Then:  the announcement is created with kind `announcement`
         it appears in the feed and under **Уведомления** with its source label

## Scenario 10: Opening edit pre-fills the kind-specific form
  Given: the author expands their own post
  When:  they open edit
  Then:  the same kind-specific form opens, pre-filled with the post's current field values

## Scenario 10a: Author saves an edited post
  Given: the author is on the pre-filled edit form for their post
  When:  they change fields (not the kind) and save
  Then:  the updated post reflects the change in the feed

## Scenario 11: Author deletes their post
  Given: the author expands their own post
  When:  they tap delete and confirm in the bottom-drawer confirmation
  Then:  the post is removed from the feed

## Scenario 12: Administration moderates a post
  Given: an Administration member expands any post
  When:  they edit or delete it
  Then:  the action succeeds regardless of authorship

## Task 3 — Comments (posts + issues)

## Scenario 13: Open a comment thread
  Given: a member views a post (or an issue)
  When:  they tap the comment count
  Then:  the thread screen opens at `/posts/{postId}/comments` (or `/issues/{issueId}/comments`)
         their own messages align right, others align left with avatar, name, and time
         messages with images show them

## Scenario 14: Write a comment
  Given: a Resident (or higher) is on a thread
  When:  they enter text (Markdown allowed) and/or attach an image and send
  Then:  the comment appears at the end of the thread, its text rendered as Markdown (safe GFM subset)
         the post's (or issue's) comment count increases by one

## Scenario 15: Opening edit loads the message into the input bar
  Given: the author is on a thread with their own message
  When:  they open the message actions and choose edit
  Then:  the input bar enters edit mode, pre-filled with the message's current text

## Scenario 15a: Author saves an edited comment
  Given: the author is on the input bar in edit mode for their message
  When:  they change the text and save
  Then:  the message updates in place

## Scenario 16: Delete own comment
  Given: the author is on a thread with their own message
  When:  they choose delete and confirm
  Then:  the message is removed
         the comment count decreases by one

## Scenario 17: Administration deletes any comment
  Given: an Administration member is on a thread
  When:  they delete another member's message
  Then:  the message is removed regardless of authorship
</content>
