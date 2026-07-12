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
  Given: there is activity (new announcements, new private offers, or activity on issues the resident
         follows) dated after the resident's last recorded visit
  When:  the welcome card loads
  Then:  each event renders as a change row, newest first
         the row's icon, tone, and text are derived on the client from the event's semantic type — the
         API returns the type and its references (kind, ids, issue number and status, category, title),
         not a pre-rendered icon or sentence

## Scenario 4: First-time resident sees recent activity
  Given: the resident has no recorded last visit and recent activity exists
  When:  the welcome card loads
  Then:  the most recent events render as change rows, newest first

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

## Scenario 8: A new announcement appears for every resident
  Given: an announcement was published after the resident's last visit
  When:  the welcome card loads
  Then:  it appears as a change row, whether or not the resident follows anything
         the row is rendered on the client from the announcement's category and title

## Scenario 9: A new private offer appears for every resident
  Given: a private offer was published after the resident's last visit
  When:  the welcome card loads
  Then:  it appears as a change row for the resident

## Scenario 10: A status change on a followed issue appears
  Given: the resident follows an issue whose status changed after their last visit
  When:  the welcome card loads
  Then:  the status change appears as a change row showing the issue's number and its new status

## Scenario 11: A new comment from someone else on a followed issue appears
  Given: the resident follows an issue that received a new comment from another resident after their
         last visit
  When:  the welcome card loads
  Then:  the new-comment activity appears as a change row showing the issue's number
         a comment the resident wrote themselves does not produce a change row
