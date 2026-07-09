# User Profile

## Problem and Goal

After onboarding, a resident's profile is frozen: the app offers no way to change the name, block,
apartment, or role; no control over whether other residents can see the phone number; no place to
register car plate numbers; and the interface language can only be chosen before registration.

The goal is a profile screen where a signed-in resident reviews and updates personal data, controls
phone-number visibility, manages car plate numbers, and switches the interface language.

Car plates exist so neighbors can reach a car's owner when a vehicle blocks the driveway: a resident
registers their plates and opens phone visibility so a neighbor can call.

## Users

Signed-in registered residents (owners and tenants). One profile per resident; a resident edits only
their own profile.

## Scope

### In scope

- **Profile screen** (`/settings`) — opened from the bottom-navigation «Настройки» tab, available
  only to a signed-in registered resident, pre-filled with the current profile. Sections top to
  bottom, per `design/user-profile-screen.pen`: avatar, name, phone, phone visibility, block,
  apartment, role, car plates, interface language, save button.
- **Avatar** — the resident picks a photo; the preview replaces the placeholder immediately; the
  file is compressed client-side by the shared media pipeline (longest edge 1600 px, WebP quality
  0.8) and uploaded as part of save. One avatar per resident — a new upload replaces the previous.
- **Name** — editable; valid when 2–60 characters after trimming (registration rule).
- **Phone** — read-only display of the verified number in `+7 707 123 45 67` format. Changing the
  number is not offered.
- **Phone visibility** — two options: «Открыть» (contact number visible to other residents) and
  «Скрыть» (hidden). Profiles without a stored flag default to hidden.
- **Block, apartment, role** — same options and validation as registration: block one of 1–4,
  apartment a positive integer within the selected block's range (block 1: 1–70, block 2: 71–139,
  block 3: 1–63, block 4: 64–126), role owner or tenant.
- **Car plates** — zero to 3 plates. Input auto-uppercases; a plate is valid when, ignoring spaces,
  it is 5–10 Latin letters and digits with at least one letter and at least one digit (covers KZ
  formats such as `A 123 BC 01` and `123 ABC 01`). Duplicates (compared ignoring case and spaces)
  are rejected. «Добавить ещё один номер машины» adds another input; a plate can be removed. The
  section carries a standing hint explaining plates let neighbors reach the owner via the phone
  number. Saving plates does not require visibility to be on.
- **Interface language** — Қазақша / Русский / English. Tapping an option applies the language to
  the whole UI immediately and persists it on the device; it does not depend on the save button and
  is not stored on the server.
- **Save** — a single «Сохранить» action persists all server-side fields (avatar, name, visibility,
  block, apartment, role, plates) in one operation. Validation errors surface as toasts (the
  registration pattern); on success a confirmation toast is shown and the resident stays on the
  screen. Leaving the screen without saving discards edits without a prompt.
- **API** — the resident API exposes an authenticated profile-update operation for the fields above
  (phone excluded), and `me` returns the full own profile (phone, visibility, plates, avatar
  included).

### What's NOT included

- Changing the phone number (re-verification flow).
- Storing the interface language on the server.
- Any surface displaying *another* resident's phone number or car plates — the visibility flag and
  plates are stored for future consumers.
- Sign out and account deletion.
- Administration editing residents' profiles.
- Keyboard accessibility (mobile-only).

## User Journey

The resident opens «Настройки» from the bottom navigation and sees their current profile. They
change any fields — retype the name, pick another block or role, toggle number visibility, add a
car plate, choose another interface language (the UI switches at once), or pick a new photo.
«Сохранить» validates the form; errors surface as toasts, otherwise changes are stored and confirmed
by a toast. After reload, the screen and the rest of the app reflect the saved profile.

## Success Metrics

- A profile edit round-trips: after save and a full reload, `me` returns the edited values and the
  screen renders them.
- Every profile field a resident can see is editable on this screen except the phone number.

## Non-functional Requirements

- Visual fidelity to `design/user-profile-screen.pen`.
- Localization: every new string exists in ru, kk, en (strict lingui compile passes).
- Single source for shared fields: the onboarding registration form and the profile screen render
  name/block/apartment/role/language controls from the same components — no forked copies.
- Mobile-shaped UI, touch targets per styling rules; no keyboard-accessibility work.

## Dependencies

- Firebase Auth session (`ensureResidentSession`) — the screen is gated.
- Resident API (`resident.me` plus the update mutation), Firestore `residents` collection.
- Firebase Storage and the shared media compression/upload pipeline (avatar).
- Design files: `design/user-profile-screen.pen`, `design/design-system.lib.pen`.
- i18n runtime (`activateLocale` / `persistLocale`) for the language section.

## Open Questions

None.
