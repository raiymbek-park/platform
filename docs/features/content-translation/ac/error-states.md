# Content Translation — Error States

## Scenario 1: AI provider is unavailable when a post is created
  Given: the translation provider returns errors
  When:  a resident creates a post
  Then:  the post is published immediately, exactly as without this feature
         the author sees no error
         viewers in other locales see the original text
  When:  the provider recovers and the translation retry succeeds
  Then:  viewers in other locales see the translation on their next fetch

## Scenario 2: AI provider is unavailable when a comment is written
  Given: the translation provider returns errors
  When:  a resident writes a comment
  Then:  the comment appears in the thread immediately, exactly as without this feature
         the author sees no error
         viewers in other locales see the original text with no toggle
  When:  the provider recovers and the translation retry succeeds
  Then:  viewers in other locales see the translation on their next fetch

## Scenario 3: A failed translation never corrupts the document
  Given: a translation attempt failed mid-way
  When:  any resident fetches the affected post, issue, or comment
  Then:  the document renders its original text normally
         reactions, comments, and search by the original title keep working

## Scenario 4: Comment display stays stable while translation is in flight
  Given: a freshly written comment whose translation has not yet completed
  When:  a viewer in another locale opens the thread
  Then:  the comment shows its original text with no toggle and no loading state
  When:  translation completes and the thread data is fetched again
  Then:  the comment shows the translated text with a show-original toggle
