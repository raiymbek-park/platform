# i18n — Edge Cases

## Scenario 1: navigator.language is undefined
  Given: `navigator.language` is `undefined` (rare webview)
  When:  the locale is resolved
  Then:  the resolved locale is `ru`

## Scenario 2: Interpolation renders per locale
  Given: a message containing a name placeholder
  When:  the string renders under each active locale
  Then:  the correct localized template is used
         the value is injected in the right position for that locale

## Scenario 3: No fallback leakage on a fully-translated screen
  Given: the active locale is `en`
         a screen whose strings are all translated
  When:  the screen renders
  Then:  no Cyrillic copy appears

## Scenario 4: CI catalog gate fails on missing translations
  Given: any catalog (`ru`, `kk`, or `en`) has an empty or missing translation
  When:  the `compile --strict` check runs in CI
  Then:  the build fails

## Scenario 5: navigator.language undefined pre-selects Russian on the selection screen
  Given: no locale choice is stored in `localStorage`
         `navigator.language` is `undefined` (rare webview)
  When:  the app boots
  Then:  the language-selection screen is shown with Russian pre-selected

## Scenario 6: Reaching a later onboarding step with no language chosen routes back to the selection screen
  Given: no locale choice is stored in `localStorage`
  When:  the resident reaches a later onboarding step (e.g. the registration form) without having confirmed a language
  Then:  the app routes to the language-selection screen instead of showing that step
