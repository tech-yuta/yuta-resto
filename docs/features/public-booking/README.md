# YuTa public booking — Phase 0/1

Status: Current

Owner: YUTA engineering

Last updated: 2026-08-05

## Implemented scope

`apps/booking-web` is the independent, mobile-first public booking application.
It resolves a restaurant by the globally unique establishment slug and is
intended for `https://reservation.yutapro.fr/<establishment-slug>`. It does not
share a browser session with the back-office and never accepts organization or
establishment IDs from a public client.

The interface uses Geist Sans throughout, with `Inter, sans-serif` as the
fallback stack. Serif typography is not used.

Phase 1 includes:

- a mobile-first five-step interface for party size, date, time, guest details,
  and confirmation, with a downloadable calendar event; on phone-sized
  viewports the booking experience fills the complete dynamic viewport without
  a surrounding card or page gutter;
- a compact party-size screen with step progress, accessible 48 px quantity
  controls, large-group contact guidance, and a CTA kept in the content flow;
- establishment branding uses the configured `logoUrl`; until a restaurant
  uploads its own logo, the public flow displays the YuTa logo as the default;
- server-authoritative availability in the establishment timezone;
- weekly service periods and dated exceptions;
- manual or automatic confirmation;
- public creation, token-protected detail, and cancellation;
- source attribution for direct, social, Google, website, and QR links;
- PostgreSQL transaction/advisory-lock protection against overbooking;
- idempotency keys, privacy-safe rate limiting, audit history, and an email
  notification outbox;
- day/week back-office lists, manual creation, lifecycle actions, internal
  notes, service periods, exceptions, and booking settings.

Waitlists, table assignment, floor plans, deposits, SMS, widgets, custom
domains, and channel synchronization are intentionally outside Phase 1.

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
notification event.

Weekly day numbers follow JavaScript/PostgreSQL convention: Sunday is `0` and
Saturday is `6`. Overnight periods are rejected in Phase 1.

## Notifications

`booking_notification_deliveries` is a provider-neutral email outbox. Booking
transactions enqueue events but do not claim delivery. A production email
adapter/worker must atomically claim `PENDING` records, send them, and update
their status to `SENT` or `FAILED`. No provider is configured in Phase 1, so
production launch must either add that worker or explicitly accept that only
the back-office reflects confirmation state.

## Local setup

```bash
pnpm db:cloud:migrate
pnpm db:cloud:seed
pnpm dev:booking
```

The development seed enables booking for `luna` and `luna-poitiers`, uses
manual confirmation, and creates lunch/dinner periods Monday through Saturday.
Open `http://localhost:3005/luna-poitiers`.

Required production variables for `apps/booking-web`:

```env
CLOUD_DATABASE_URL=...
CLOUD_DATABASE_SSL=true
PUBLIC_BOOKING_BASE_URL=https://reservation.yutapro.fr
BOOKING_RATE_LIMIT_SECRET=at-least-32-random-characters
```

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
