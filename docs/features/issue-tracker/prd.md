# Issue Tracker — Resident Issues and Status Workflow

## Problem and Goal

Residents of Raiymbek Park have no way inside the app to report a problem — a basement leak, a
stalled lift, late-night noise, a rules violation — to the management company, and no way to follow
what happens next. This feature gives residents a place to open an **issue** and track its status, and
gives the management company a place to triage issues and move them through a status workflow to
resolution. Roles decide who may open, react to, moderate, and re-status an issue.

The service operates as a pilot: every signed-in person is a **Resident**, so residents can open
issues immediately. Confirming real owners and granting elevated roles is a slower, document-based
process handled outside the app; it is not part of this feature, which only defines and enforces the
role permissions.

## Users

- **Residents** — open issues, follow their status, and react. This is the default role for everyone.
- **Owners** — the same as Residents for everything in this feature.
- **Managers** — triage new issues and change their status.
- **Administration** — full moderation: edit, delete, and re-status any issue, and keep the board
  clear of spam and abuse.
- **Viewers** — accounts downgraded from Resident; they can browse but cannot act.

## Roles and Permissions

Five roles. Everyone is a **Resident by default**; promotion and downgrade happen outside the app.
Permissions are enforced **on the server** for every action, not merely hidden in the interface.

| Capability | Viewer | Resident | Owner | Manager | Administration |
|---|:--:|:--:|:--:|:--:|:--:|
| View issue list and detail | ✓ | ✓ | ✓ | ✓ | ✓ |
| Open an issue | — | ✓ | ✓ | — | ✓ |
| Edit or delete an issue you opened *(while New)* | — | ✓ | ✓ | — | ✓ |
| Like / dislike any issue | — | ✓ | ✓ | ✓ | ✓ |
| Change any issue's status | — | — | — | ✓ | ✓ |
| Edit or delete **any** issue *(moderation, while New)* | — | — | — | — | ✓ |
| See the author's phone number | — | — | — | ✓ | ✓ |

Everyone sees the author's name, block, and apartment on an issue. The author's **phone** is shared
only with Managers, Administration, and the issue's own author — no other role receives it, and the
server omits it from the payload rather than hiding it in the interface.

A Manager changes status only — never edits or deletes an issue. Editing and deletion are possible
only while an issue is New: once a Manager takes it into work — the first status change away from
New — the issue is locked, and no one (author or Administration) can edit or delete it; only its
status keeps changing.

The onboarding owner/tenant choice is stored only as a label; it grants no elevated role — everyone is
a Resident. Administration uses that label to contact and verify a claimed owner and, once confirmed,
assigns the Owner role in addition to the label.

*Rights that belong to other features (named only so the role model reads whole): authoring private
announcements (Resident, Owner, Administration), publishing official announcements and notifications
(Manager, Administration), and leaving written reviews on issues and private announcements. None of
these are built here.*

## Scope

### In scope

- **Issue list** — status-filter tabs (All, New, In progress, Blocked, Done, Rejected, Under resident
  review, Planned) with New active by default, a text search over the filtered issues, and issue cards
  showing the category, current status, classification tags, author, reaction counts, and comment
  count. A card whose issue carries media shows its first photo as a collapsed preview that expands to
  full height when the card is expanded. While the list loads, skeleton cards stand in for it; an empty
  state appears when the active filter and search together hold no issues.
- **Open an issue** — a Resident or Owner picks a category, optionally marks it Urgent, enters a title
  and a description, optionally attaches media, and submits. A new issue starts as **New**.
- **Edit or delete your own issue while it is New** — the author opens an actions menu on their
  issue to edit it (the same category/title/description/media form used to open it) or to delete it
  behind a confirmation step. Administration may do this to any New issue. Once a Manager takes
  the issue into work, editing and deletion are disabled for everyone.
- **Issue detail and status change** — a Manager opens an issue, sets a new status, and may add
  classification tags (Under warranty, Needs clarification, Duplicate), media, and a comment.
- **Reactions** — a Resident or higher role leaves a single like or dislike on any issue; a Viewer
  cannot.
- **Role-based permission enforcement**, with **Resident** as the default role.

### Not included

- **Announcements** (private and official) and **written reviews** — separate future features. The
  role model names these rights; no screen or flow for them is built here.
- **Role-management interface** — assigning roles, an owner excluding a resident by matching block and
  apartment, multiple apartments per owner, and blocking accounts. All handled outside the app.
- **Owner verification by documents** — the formal process; out of scope.
- **Resident voting or tallied decisions** — "Under resident review" is a status a Manager sets by
  hand; reactions are individual feedback, not a vote count.
- Any language other than the shipped interface language, and keyboard accessibility (mobile-only).

## Issue Model

- **Category** (one of): Repair, Replacement, Complaint, Violation, Other — plus an **Urgent** flag.
- **Classification tags** (added by a Manager on the detail screen): Under warranty, Needs
  clarification, Duplicate — zero or more of the three may be applied.
- **Title**, **description**, and **optional media** (photos and/or videos).
- **Author** — name, phone, block, and apartment taken from the signed-in profile. Name, block, and
  apartment show to everyone; the phone reaches only Managers, Administration, and the author (see
  Roles and Permissions).
- **Status** (one at a time): **New** (initial), then any of In progress, Planned, Blocked, Under
  resident review, Done, Rejected. A Manager or Administration may move an issue to any status at any
  time — there is no fixed transition order.
- **Reactions** — like and dislike counts.
- **Comment count** — the number of comments left on the issue.
- **Number** (Issue #NNN, assigned in order of creation) and a **creation timestamp**.

## Search and Loading

- **Search** — a text field over the issue list. A query matches an issue's **title** (any word that
  begins with the query) or its **number** (the digits of Issue #NNN), case-insensitively and ignoring
  surrounding whitespace. Narrowing begins at three characters — a shorter or empty query applies no
  narrowing and the full filtered list is shown. Search is resolved on the server across the whole
  status filter, not only the issues already loaded, and a matching issue must satisfy both the active
  filter and the query. While the server result loads, the list narrows instantly by projecting the
  query over the issues already on screen, then the authoritative result replaces it. While that
  request is in flight and no already-loaded issue matches, loading placeholders are shown rather than
  the empty state; the empty state appears only once the search resolves with no matches.
- **Loading** — while the list request is pending, skeleton (ghost) cards are shown in place of the
  list. The empty state appears only once the request resolves with no matching issues.
- **Pagination** — the list loads in pages and extends automatically as the resident scrolls to the
  end, with a loading placeholder while the next page arrives.

## Field Rules

- **Category** — required; exactly one of Repair, Replacement, Complaint, Violation, Other.
- **Urgent** — optional flag (off by default).
- **Title** — required; trimmed length 3–80 characters.
- **Description** — required; trimmed length 10–1000 characters.
- **Media** — optional; up to 10 photos and/or videos combined, total size at most 200 MB. Applies to
  opening an issue and to a status change.
- **Editing window** — an issue may be edited or deleted only while its status is New; after the
  first status change it is locked for editing and deletion for everyone.
- **Status** (status change) — required; exactly one of the seven statuses.
- **Classification tags** (status change) — optional; zero or more of Under warranty, Needs
  clarification, Duplicate.
- **Comment** (status change) — optional; trimmed length up to 1000 characters.

## User Journey

A Resident opens the Issues tab; while the list loads, skeleton cards stand in, then issues appear
grouped by status, newest first. They can switch the status tabs or type in the search field to find
an issue by its title or number. To report a problem they tap the create button, choose
a category such as Repair, optionally mark it Urgent, write a short title and a description, optionally
attach media, and submit — the issue appears as New. While it is still New they can open the
actions menu on their own issue to edit or delete it behind a confirmation; once a Manager takes it into
work it can no longer be edited or deleted. A Manager opens the issue, sets its status
(for example, Planned), optionally tags it (Under warranty), and leaves a comment; residents following
the issue see the new status. Residents and higher roles can leave a like or dislike as feedback.
Administration can edit, delete, or re-status anything to keep the board clean. A Viewer can browse
everything but cannot act.

## Success Metrics

- A Resident can open an issue from start to finish, see it listed as New, and edit or delete it
  while it is still New.
- A Manager can move an issue through its statuses, and residents see each change.
- The server rejects unauthorized actions: a Viewer cannot open an issue, a Resident cannot change a
  status or touch another resident's issue, and a Manager cannot edit or delete.

## Non-functional Requirements

- Mobile-only; a single interface language this iteration; no manual keyboard accessibility.
- Permissions are enforced on the server, never only in the interface.
- State boundaries: server data through TanStack Query; the active status filter in a URL search
  parameter; transient interface state (optimistic reactions, form input) in Zustand overlays.

## Dependencies

- The existing Firebase authentication and resident profile (id, name, phone, block, apartment, role).
- A new issue router and an issue collection on the server.
- Existing design-system components — the post-card variants, filter tabs, select options, status
  tags, the create button, and the bottom navigation.
- The resident profile carries a `role` field holding one of the five roles; an absent or unrecognized
  value resolves to Resident.

## Terminology

Canonical names used in code, routes, and stored data. Display labels are Russian; these identifiers
are not. Do not introduce synonyms (request, task, ticket) in code — the entity is an **issue**.

- **Entity / route** — `issue`; the list route is `/issues`.
- **Statuses** — `new`, `in-progress`, `planned`, `blocked`, `resident-review`, `done`,
  `rejected`.
- **Categories** — `repair`, `replacement`, `complaint`, `violation`, `other`; plus the boolean
  `urgent` flag.
- **Classification tags** — `warranty`, `needs-clarification`, `duplicate`.
- **Roles** — `viewer`, `resident`, `owner`, `manager`, `administration`.

## Open Questions

None — every role, right, and rule is fixed above.
