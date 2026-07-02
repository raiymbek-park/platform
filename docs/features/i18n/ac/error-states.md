# i18n — Error States (API locale-awareness)

## Scenario 1: Server error is localized to the session locale
  Given: a tRPC request carries `x-locale: kk`
  When:  the server rejects the request
  Then:  the returned error message is in Kazakh

## Scenario 2: Missing x-locale header defaults to Russian
  Given: a tRPC request has no `x-locale` header
  When:  the server resolves `ctx.locale`
  Then:  `ctx.locale` is `ru`
         a rejected request returns the Russian message

## Scenario 3: Unsupported x-locale value defaults to Russian
  Given: a tRPC request carries `x-locale: de`
  When:  the server resolves `ctx.locale`
  Then:  `ctx.locale` is `ru`

## Scenario 4: Missing key in the server message map falls back
  Given: an error is thrown with a key absent from the active locale's map
  When:  the error is formatted
  Then:  the `ru` string for that key is returned
         no crash occurs

## Scenario 5: Lazy catalog fetch failure degrades gracefully
  Given: the active locale is `en`
         the network request for the `en` compiled catalog fails
  When:  the app renders
  Then:  the UI renders with source / `ru` messages rather than blank
