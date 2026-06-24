# Home — Happy Path

## Scenario 1: Home renders for a signed-in resident
  Given: a resident with a valid session opens the app
  When:  `/home` loads
  Then:  the header (logo + language switcher) renders
         the building hero with location badge renders
         the welcome card renders
         the services section renders
         the contacts section renders
         the bottom nav renders with the Главная tab marked active

## Scenario 2: Profile drives hero and greeting
  Given: the profile endpoint returns the resident's name, block, and apartment
  When:  home loads
  Then:  the location badge shows that resident's block and apartment
         when there are no new events, the welcome card greets them by their first name

## Scenario 3: "What's new since your last visit" feed renders
  Given: there are events created after the resident's last recorded visit
  When:  the welcome card loads
  Then:  each event renders as a change row with its icon and text
         the events appear newest first

## Scenario 4: First-time resident sees recent events
  Given: the resident has no recorded last visit and recent events exist
  When:  the welcome card loads
  Then:  the most recent events render as change rows

## Scenario 5: Services list renders
  Given: home loads
  When:  the services section renders
  Then:  five service items render — Объявления, Быстрая заявка, Заявка с медиа, Статус заявки, Чат дома в WhatsApp
         each item renders with its icon, title, and description

## Scenario 6: Contacts render from the API
  Given: the contacts endpoint returns one or more contacts
  When:  the contacts section loads
  Then:  each contact renders with name, role, and icon
         contacts appear in the order returned by the API
         contacts are separated by dividers

## Scenario 7: Bottom nav navigates between top-level destinations
  Given: home is shown with the Главная tab active
  When:  the resident taps Объявления or Настройки
  Then:  the app navigates to `/announcements` or `/settings` respectively
         the tapped tab is marked active
         tapping Главная returns to `/home`
