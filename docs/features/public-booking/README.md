# YuTa public booking — Phase 0/1

Status: Current

Visibility: Engineering

Owner: YUTA engineering

Last updated: 2026-08-08

## Implemented scope

`apps/booking-web` is the independent, mobile-first public booking application.
It resolves a restaurant by the globally unique establishment slug and is
intended for `https://reservation.yutapro.fr/<establishment-slug>`. It does not
share a browser session with the back-office and never accepts organization or
establishment IDs from a public client.

The interface uses Geist Sans throughout, with `Inter, sans-serif` as the
fallback stack. Serif typography is not used.

Phase 1 includes:

- a public root landing page that explains how guests access a restaurant's
  direct booking link and provides a concise, secondary introduction to YUTA;
- a mobile-first five-step interface for party size, date, time, required guest
  name/phone/email, one optional special-requirements field, and confirmation,
  with a downloadable calendar event; on phone-sized viewports the booking
  experience fills the complete dynamic viewport without a surrounding card or
  page gutter;
- a compact party-size screen with step progress, accessible 48 px quantity
  controls, large-group contact guidance, and a CTA kept in the content flow;
- establishment name, logo, welcome copy, visible phone/address, and booking
  policy come from canonical establishment and booking settings; until a
  restaurant configures `logoUrl`, the public flow displays the YuTa logo as
  the default;
- server-authoritative availability in the establishment timezone;
- weekly service periods and dated exceptions;
- manual or automatic confirmation;
- public creation, token-protected detail, and cancellation;
- bounded source attribution for direct, social, Google, website, and QR links
  through the `source` query value;
- PostgreSQL transaction/advisory-lock protection against overbooking;
- idempotency keys, privacy-safe rate limiting, audit history, and an email
  notification outbox;
- day/week back-office lists, capacity-checked manual creation for an
  establishment with public booking enabled, lifecycle actions, internal
  notes, service periods, exceptions, and booking settings;
- route-level loading and recovery states for the public flow and reservation
  management link, with a privacy-safe unavailable state for invalid or expired
  links;
- back-office reservation loading, empty, load-error, inaccessible-detail, and
  direct settings-access forbidden states.

In the Backoffice, weekly service periods, service summaries, and dated
exceptions are managed under `/etablissement/horaires-services`. Global
booking rules are managed independently under
`/reservations/parametres`. Reservation lists and details use the canonical
`/reservations` route group. Permanent redirects preserve former
`/operations/reservations/*` URLs.

Waitlists, table assignment, floor plans, deposits, SMS, widgets, custom
domains, and channel synchronization are intentionally outside Phase 1.

## Current implementation limits

- Guest email is required by the current contract and persistence model even
  though the master specification describes it as optional.
- Cover image and visible public email are resolved but not rendered in the
  current public flow. Custom themes and multilingual content are not
  implemented.
- Source attribution does not persist UTM parameters, referrer, or campaign
  details.
- Manual Backoffice creation hardcodes source `BACK_OFFICE`, follows public
  booking eligibility and online capacity, and has no capacity override.
- Existing service periods and exceptions can be deleted and recreated but are
  not edited in place.
- Playwright/Axe covers the current browser flow, mobile overflow, keyboard,
  focus, labels, and automated accessibility rules. It does not replace manual
  screen-reader, launch-volume load, or production acceptance evidence.

`STATUS.md` is the authoritative feature-by-feature release reconciliation.

## Public eligibility

The public page returns unavailable unless all of the following are true:

1. the organization is active;
2. the establishment is active;
3. the establishment has the enabled `booking.enabled` entitlement;
4. `booking_settings.enabled` is true.

The slug is resolved on the server. Every reservation and back-office query is
scoped with both `organization_id` and `establishment_id`.

## Availability and capacity

Dates and times are persisted as local values plus `start_at`/`end_at` UTC
instants and the IANA timezone snapshot. `PENDING`, `CONFIRMED`, and `SEATED`
reservations consume service-period capacity. The create transaction obtains a
PostgreSQL advisory lock for establishment/date/time, recalculates capacity,
and only then inserts the reservation, initial status history, audit event, and
notification event. Guarded database integration coverage races competing
requests for the same last-capacity slot and verifies that only the reservation
that fits is committed.

The guarded booking-web API integration suite additionally verifies enabled and
disabled establishment resolution, availability, automatic/manual creation,
transactional history/audit/outbox writes, valid and invalid management tokens,
cancellation, and database-backed rate limiting. It is skipped unless the
documented database integration flag is explicitly enabled.

Weekly day numbers follow JavaScript/PostgreSQL convention: Sunday is `0` and
Saturday is `6`. Overnight periods are rejected in Phase 1.

## Notifications

`booking_notification_deliveries` is a provider-neutral email outbox. Booking
transactions enqueue events but do not claim delivery. A production email
adapter/worker must atomically claim `PENDING` records, send them, and update
their status to `SENT` or `FAILED`. No provider is configured in Phase 1, so
production launch must either add that worker or explicitly accept that only
the back-office reflects confirmation state. `apps/booking-web` has no email
provider runtime dependency and must not be described as sending confirmation
emails while this worker is absent.

The current external dependency, operational owner, and launch-evidence
register is maintained in `STATUS.md`.

## Local setup

```bash
pnpm db:cloud:migrate
pnpm db:cloud:seed
pnpm dev:booking
```

The development seed enables booking for `luna` and `luna-poitiers`, uses
manual confirmation, and creates lunch/dinner periods Monday through Saturday.
Open `http://localhost:3005/luna-poitiers`.

Run isolated browser acceptance against the local cloud database with:

```bash
YUTA_ALLOW_DATABASE_INTEGRATION_TESTS=true pnpm test:booking-web:e2e
```

Local runs use an installed Chrome channel and a temporary browser profile. CI
must install Playwright Chromium before running the same command. The suite
creates unique automatic, manual, and disabled establishments and removes all
associated data afterward.

Required production variables for `apps/booking-web`:

```env
CLOUD_DATABASE_URL=...
CLOUD_DATABASE_SSL=true
PUBLIC_BOOKING_BASE_URL=https://reservation.yutapro.fr
BOOKING_RATE_LIMIT_SECRET=at-least-32-random-characters
```

The app validates all four variables at server startup and during the
production build. Missing or malformed values fail closed before deployment;
there is no production fallback URL or rate-limit secret.

## Back-office permissions

- `OWNER`: read, operate, and manage settings;
- `MANAGER`: read, operate, and manage settings;
- `STAFF`: read and operate, but cannot manage settings.

Platform/system roles never bypass restaurant membership checks.

## Operational checks

Before launch, verify `/api/health`, migrate the cloud database, configure the
production domain and variables, test a concurrent last-capacity booking, and
confirm that reservation URLs are not indexed. Public tokens are stored only
as SHA-256 hashes and cannot be recovered from the database.
