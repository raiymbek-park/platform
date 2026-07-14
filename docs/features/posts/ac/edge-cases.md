# Posts — Edge Cases

Boundary conditions.

## Scenario 1: Empty feed / empty search
  Given: the active tab and search together hold no posts
  When:  the request resolves
  Then:  the empty state shows (not before the request resolves — placeholders show while in flight)

## Scenario 2: Offer phone is visible to all; announcement phone is never exposed
  Given: an expanded offer card
  When:  any signed-in member (including a Viewer) views it
  Then:  the author's phone is present in the payload and shown
  And:   for an announcement, no personal phone is present in the payload for anyone

## Scenario 3: Post with no media
  Given: a post created without media
  When:  it renders and is expanded
  Then:  no media preview or gallery shows; the card renders body, tag (offer), contacts, and footer

## Scenario 4: Announcement has no category tag; offer shows its tag
  Given: the feed renders both kinds
  When:  cards paint
  Then:  an offer card shows its category tag (e.g. ПРОДАМ)
         an announcement card shows its source label and category icon, no tag

## Scenario 5: `other` category
  Given: a post in the `other` category (either kind)
  When:  it renders
  Then:  an announcement `other` shows the author name as the source; an offer `other` shows the ПРОЧЕЕ tag

## Scenario 6: Author sees own-post actions only
  Given: the feed holds posts by different authors
  When:  a non-Administration member expands them
  Then:  edit/delete actions appear only on their own posts
         Administration sees edit/delete on every post

## Scenario 7: Comment thread reused identically on issues
  Given: the same thread component
  When:  it is opened from a post and from an issue
  Then:  behaviour (layout, write, edit own, delete own, moderation) is identical; only the parent entity differs

## Scenario 8: Deleting a post with comments
  Given: a post that has comments
  When:  its author (or Administration) deletes it
  Then:  the post is removed from the feed and its comment thread is no longer reachable

## Scenario 9: Refetch keeps optimistic reaction stable
  Given: an optimistic reaction overlay is applied
  When:  the feed refetches (e.g. tab switch back, invalidation)
  Then:  the ID-keyed overlay stays consistent across variants until server truth lands, then clears

## Scenario 10: Card system refactor is behaviour-neutral for issues
  Given: `IssueCard` now composes the shared `content-card` primitives
  When:  the issues feed and cards render
  Then:  issues behaviour and appearance are unchanged, except that the description now renders through
         the shared Markdown renderer (the intended shared-renderer outcome)

## Scenario 11: Shared Markdown renderer reused across surfaces
  Given: the shared Markdown renderer
  When:  it renders a post body, a comment (post or issue), and an issue description
  Then:  all render the same safe GFM subset with identical behaviour; only the source text differs

## Scenario 12: Title at the exact length boundary is accepted
  Given: the create/edit form (either kind)
  When:  the trimmed title is exactly 3 characters, or exactly 80 characters
  Then:  the form allows submission
         the title is not flagged

## Scenario 13: Description at the exact length boundary is accepted
  Given: the create/edit form
  When:  the trimmed description is exactly 10 characters, or exactly the kind's maximum
         (1000 characters for an offer, 3000 for an announcement)
  Then:  the form allows submission
         the description is not flagged

## Scenario 14: Media at the exact count and size boundary is accepted
  Given: the create/edit form
  When:  the member attaches exactly 10 media items whose combined size is exactly 200 MB
  Then:  the form allows submission
         no limit is surfaced

## Scenario 15: Comment text at the exact length boundary is accepted
  Given: a comment input bar
  When:  the trimmed text is exactly 1000 characters
  Then:  the send is not blocked
         the text is not flagged

## Scenario 16: Comment media at the exact count and size boundary is accepted
  Given: a comment input bar
  When:  the member attaches exactly 10 media items whose combined size is exactly 200 MB
  Then:  the send is not blocked
         no limit is surfaced

## Scenario 17: Member sees own-comment actions only
  Given: a thread holds comments by different authors
  When:  a non-Administration member taps a message
  Then:  tapping their own message opens its actions (edit and delete); others' messages are not
         actionable and tapping them opens nothing
         Administration can tap any message to open its actions, which include delete
