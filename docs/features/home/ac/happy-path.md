# Home — Happy Path

## Scenario 1: Home renders for a signed-in resident
  Given: a resident with a valid session opens the app
  When:  `/home` loads
  Then:  the header (logo + language switcher) renders
         the building hero with location badge renders
         the welcome card renders
         the services section renders
         the contacts section renders
         the bottom nav renders with the Home tab marked active

## Scenario 2: Profile drives hero and greeting
  Given: the profile endpoint returns the resident's name, block, and apartment
  When:  home loads
  Then:  the location badge shows that resident's block and apartment
         the welcome card greets them by their first name

## Scenario 3: Changes feed renders
  Given: the changes endpoint returns one or more rows
  When:  the welcome card loads
  Then:  each change renders as a row with its icon and text
         rows appear in the order returned by the API

## Scenario 4: Services list renders from the API
  Given: the services endpoint returns one or more items
  When:  the services section loads
  Then:  each item renders with its icon, title, and description
         items appear in the order returned by the API

## Scenario 5: Contacts render from the API
  Given: the contacts endpoint returns one or more contacts
  When:  the contacts section loads
  Then:  each contact renders with name, role, and icon
         contacts are separated by dividers

## Scenario 6: Bottom nav navigates between top-level sections
  Given: home is shown with the Home tab active
  When:  the resident taps Announcements, Requests, or Settings
  Then:  the app navigates to `/announcements`, `/requests`, or `/settings` respectively
         the tapped tab is marked active
         tapping Home returns to `/home`
