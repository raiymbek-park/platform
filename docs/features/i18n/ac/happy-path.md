# i18n — Happy Path

## Scenario 1: First launch shows the language screen with the browser language pre-selected
  Given: no locale choice is stored in `localStorage`
         `navigator.language` resolves to `"kk-KZ"`
  When:  the app boots
  Then:  the `kk` catalog is activated before the first screen paints
         the language-selection screen is shown with Kazakh pre-selected
         every static UI string on it renders in Kazakh
         nothing is yet persisted to `localStorage`

## Scenario 2: Unsupported browser language pre-selects Russian
  Given: no locale choice is stored in `localStorage`
         `navigator.language` resolves to `"fr-FR"`
  When:  the app boots
  Then:  the `ru` catalog is activated
         the language-selection screen is shown with Russian pre-selected

## Scenario 3: Confirming the default language persists it and continues
  Given: the language-selection screen is shown with the pre-selected default
  When:  the resident taps "Далее" without changing the selection
  Then:  the pre-selected locale is persisted to `localStorage`
         the app continues to the registration form

## Scenario 4: Choosing a different language switches, persists, and continues
  Given: the language-selection screen is shown with Russian pre-selected
  When:  the resident selects English and taps "Далее"
  Then:  the `en` catalog is activated and the UI re-renders in English
         `"en"` is persisted to `localStorage`
         the app continues to the registration form

## Scenario 5: A stored choice skips the selection screen on later launch
  Given: `localStorage` holds the choice `"en"`
  When:  the app boots
  Then:  the `en` catalog is activated regardless of `navigator.language`
         the selection screen is skipped
         the UI renders in English

## Scenario 6: Active locale reaches the API
  Given: the active locale is `"kk"`
  When:  the app sends any request to the backend
  Then:  the request carries the header `x-locale: kk`

## Scenario 7: Only the active language's translations load
  Given: the active locale is `"en"`
  When:  the app boots
  Then:  only the English translations are fetched
         the Russian and Kazakh translations are not downloaded at startup
