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
</content>
