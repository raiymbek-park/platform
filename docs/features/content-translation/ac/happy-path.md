# Content Translation — Happy Path

## Scenario 1: Feed shows a post translated into the viewer's locale
  Given: a post with source language `ru` has `kk` and `en` translations available
         the resident's active locale is `kk`
  When:  the resident opens the announcements feed
  Then:  the post card shows the Kazakh title and description
         the card shows no translation indicator

## Scenario 2: Post detail shows the indicator and toggles to the original
  Given: the same post is open in detail view with active locale `kk`
  When:  the screen renders
  Then:  the title and description are in Kazakh
         a "translated from Russian" indicator is shown
  When:  the resident taps show original
  Then:  the exact stored Russian title and description are shown
  When:  the resident taps the toggle again
  Then:  the Kazakh translation is shown again
         no additional API request is made for the toggle

## Scenario 3: Same-locale viewer sees the original without an indicator
  Given: a post with source language `ru`
         the resident's active locale is `ru`
  When:  the resident opens the feed and the post detail
  Then:  the stored original text is shown in both places
         no translation indicator is shown

## Scenario 4: Issues are localized the same way as posts
  Given: an issue with source language `ru` has a `kk` translation
         the resident's active locale is `kk`
  When:  the resident opens the issues list and the issue detail
  Then:  the list card shows the Kazakh title without an indicator
         the detail shows Kazakh text with a "translated from Russian" indicator and a working
         show-original toggle

## Scenario 5: Comment is translated on demand
  Given: a comment with recorded source language `ru` in an issue thread
         the viewer's active locale is `en`
         no `en` translation is cached on the comment
  When:  the viewer taps the "Translate" action on the comment
  Then:  the comment text is shown in English
         the action becomes a show-original toggle
         the English translation is stored on the comment

## Scenario 6: Cached comment translation is reused
  Given: the comment from Scenario 5 already holds a cached `en` translation
  When:  another resident with locale `en` taps "Translate" on it
  Then:  the cached English text is shown
         no new AI translation call is made

## Scenario 7: Search matches a translated title
  Given: a post authored in Russian whose Kazakh translation title contains the word "жарнама"
  When:  a resident searches the feed for "жарнама"
  Then:  the post appears in the results

## Scenario 8: A new post publishes immediately, the translation arrives asynchronously
  Given: a resident creates a post in Russian
  When:  a Kazakh-locale resident fetches the feed before translation completes
  Then:  the post is visible with its Russian original text
  When:  the feed is fetched again after translation completes (within 60 seconds of creation)
  Then:  the post shows the Kazakh title and description
