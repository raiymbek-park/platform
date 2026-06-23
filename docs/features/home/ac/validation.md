# Home — Validation

## Scenario 1: Session required to reach home
  Given: there is no session (no persisted token pair)
  When:  `/home` is opened
  Then:  the resident is redirected to `/onboarding/welcome`

## Scenario 2: Expired access token is silently refreshed, then data loads
  Given: the access token is expired but the refresh token is still valid
  When:  `/home` is opened
  Then:  the session is silently refreshed (the refresh token is rotated, a fresh token pair is stored)
         the guard admits the resident to `/home` without a redirect
         the home queries run against the fresh token and the screen renders its data

## Scenario 3: Expired refresh token redirects to login
  Given: the access token is expired and the refresh token is also expired (cannot renew the session)
  When:  `/home` is opened
  Then:  no refresh call is made
         the stored session is cleared
         the resident is redirected to `/onboarding/welcome` (login)

## Scenario 4: Refresh attempt fails redirects to login
  Given: the access token is expired and the refresh token is unexpired but rejected by the server
  When:  `/home` is opened and the silent refresh is attempted
  Then:  the refresh fails
         the stored session is cleared
         the resident is redirected to `/onboarding/welcome` (login)

## Scenario 5: Tapping a contact opens the dialer
  Given: the contacts section is shown
  When:  the resident taps a contact
  Then:  the device phone dialer opens pre-filled with that contact's number (`tel:`)

## Scenario 6: Service items open their destination
  Given: the services section is shown
  When:  the resident taps a service item
  Then:  Объявления opens the in-app `/announcements` screen (same tab)
         the other items open their external URL in a new tab (Быстрая заявка, Заявка с медиа, Статус заявки, Чат дома в WhatsApp)

## Scenario 7: Language switcher is inert
  Given: the header is shown
  When:  the resident taps a KZ, RU, or EN chip
  Then:  the app language does not change
         the UI stays in Russian
