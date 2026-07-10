# Content Translation — Edge Cases

## Scenario 1: Editing the source text invalidates stale translations
  Given: a post with source language `ru` and existing `kk`/`en` translations
  When:  the author edits the title or description
  Then:  a Kazakh-locale viewer fetching before retranslation completes sees the edited
         Russian original, never the stale Kazakh translation
  When:  retranslation completes (within 60 seconds of the edit)
  Then:  the Kazakh-locale viewer sees the translation of the edited text

## Scenario 2: An edit that does not touch the source text keeps translations
  Given: a post with existing translations
  When:  the author changes only a field outside title/description (e.g. category)
  Then:  the existing translations remain in place
         no retranslation happens
         a Kazakh-locale viewer never sees an original-language window

## Scenario 3: Detected source language overrides the author's locale
  Given: a resident whose active locale is `ru` writes a post in Kazakh
  When:  translation completes
  Then:  the post's recorded source language is `kk`
         a Russian-locale viewer sees the Russian translation with a "translated from Kazakh"
         indicator
         a Kazakh-locale viewer sees the original without an indicator

## Scenario 4: Comment translate corrects a wrong recorded language
  Given: a comment created by a resident with active locale `kk`, written in Russian
         (recorded source language is `kk`)
  When:  a Russian-locale viewer taps "Translate"
  Then:  the returned text is shown and the comment's recorded source language becomes `ru`
         Russian-locale viewers no longer see the "Translate" action on this comment

## Scenario 5: Comment in the viewer's own language shows no translate action
  Given: a comment with recorded source language `en`
         the viewer's active locale is `en`
  When:  the thread renders
  Then:  the comment shows no "Translate" action

## Scenario 6: Backfilled legacy content is translated
  Given: a post created before this feature existed, containing Russian text
  When:  the backfill script has run and a Kazakh-locale resident opens the feed
  Then:  the post shows the Kazakh title and description
         its detail view shows the "translated from Russian" indicator
