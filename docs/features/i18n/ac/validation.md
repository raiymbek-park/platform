# i18n — Validation (locale mapping)

## Scenario 1: Regional variants map to the base locale
  Given: `navigator.language` is a regional variant of a supported locale
  When:  the locale is resolved
  Then:  `ru-RU` maps to `ru`
         `kk-KZ` maps to `kk`
         `en-US` and `en-GB` map to `en`

## Scenario 2: Mapping is case-insensitive
  Given: `navigator.language` is `"EN"` or `"en-us"`
  When:  the locale is resolved
  Then:  both map to `en`

## Scenario 3: Malformed or empty browser language falls back
  Given: `navigator.language` is `""` or a malformed value
  When:  the locale is resolved
  Then:  the resolved locale is `ru`

## Scenario 4: Invalid stored value is treated as no choice
  Given: `localStorage` holds a value outside `{ru, kk, en}` (e.g. `"de"` or garbage)
  When:  the app boots
  Then:  the stored value is treated as absent, not as a choice
         the locale is re-detected from `navigator.language`, activated, but not persisted
         the language-selection screen is shown, pre-selected with the re-detected locale

## Scenario 5: Supported union is exactly {ru, kk, en}
  Given: any locale code that is not `ru`, `kk`, or `en`
  When:  the locale is resolved
  Then:  it resolves to `ru`

## Scenario 6: Each of the three language options is individually selectable
  Given: the language-selection screen is shown
  When:  the resident taps the Kazakh, Russian, or English option
  Then:  the tapped option becomes the selected option
         the previously selected option is no longer marked selected

## Scenario 7: Switching the selection re-renders live, before confirming
  Given: the language-selection screen is shown with Russian pre-selected, not yet confirmed
  When:  the resident selects Kazakh without tapping "Далее"
  Then:  the UI immediately re-renders in Kazakh
         nothing is yet persisted to `localStorage`
