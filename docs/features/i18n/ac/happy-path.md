# i18n — Happy Path

## Scenario 1: First launch detects the browser language
  Given: no locale is stored in `localStorage`
         `navigator.language` resolves to `"kk-KZ"`
  When:  the app boots
  Then:  the `kk` catalog is activated before the first screen paints
         every static UI string renders in Kazakh
         `"kk"` is persisted to `localStorage`

## Scenario 2: Unsupported browser language falls back to Russian
  Given: no locale is stored in `localStorage`
         `navigator.language` resolves to `"fr-FR"`
  When:  the app boots
  Then:  the `ru` catalog is activated
         the UI renders in Russian
         `"ru"` is persisted to `localStorage`

## Scenario 3: Persisted locale wins on later launch
  Given: `localStorage` holds `"en"`
  When:  the app boots
  Then:  the `en` catalog is activated regardless of `navigator.language`
         the UI renders in English

## Scenario 4: Active locale reaches the API
  Given: the active locale is `"kk"`
  When:  any tRPC request is made
  Then:  the request carries the header `x-locale: kk`

## Scenario 5: Only the active catalog loads
  Given: the active locale is `"en"`
  When:  the app boots
  Then:  only the `en` compiled catalog is fetched
         the `ru` and `kk` catalogs are not in the initial chunk
