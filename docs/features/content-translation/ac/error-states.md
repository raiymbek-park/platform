# Content Translation — Error States

## Scenario 1: AI provider is unavailable when a post is created
  Given: the translation provider returns errors
  When:  a resident creates a post
  Then:  the post is published immediately, exactly as without this feature
         the author sees no error
         viewers in other locales see the original text
  When:  the provider recovers and the translation retry succeeds
  Then:  viewers in other locales see the translation on their next fetch

## Scenario 2: On-demand comment translation fails
  Given: the translation provider returns errors
  When:  a viewer taps "Translate" on a comment
  Then:  a localized error message is shown
         the comment keeps displaying its original text
         the "Translate" action remains available for retry

## Scenario 3: A failed translation never corrupts the document
  Given: a translation attempt failed mid-way
  When:  any resident fetches the affected post or issue
  Then:  the document renders its original text normally
         reactions, comments, and search by the original title keep working
