# Today dashboard — Product scope

Status: Current

Visibility: Engineering

Owner: YUTA product and engineering

Last updated: 2026-08-06

## User goal

An authenticated restaurant user quickly understands the establishment's
booking activity and supported customer-attention items for the current local
day, then navigates to the relevant Backoffice workflow.

The page is an operational summary, not an analytics dashboard and not a local
POS control surface.

## Current approved capabilities

The first integrated scope may present only current repository capabilities:

- a greeting using the authenticated user's display name;
- the current date in the establishment timezone and locale;
- today's reservations and reservation-status summaries;
- today's enabled booking service periods;
- a persisted booking configuration or unavailable state;
- feedback requiring attention when `reputation.enabled` and
  `reputation.read` apply;
- navigation to current reservation, booking-settings, and reviews routes;
- a capability-filtered reservation creation link or action already supported
  by the repository;
- truthful loading, empty, forbidden, unavailable, and error states.

## Current data boundaries

- Every query uses server-derived organization and establishment context.
- Booking sections require the booking entitlement and current booking
  permissions.
- Reputation sections require the reputation entitlement and current
  reputation permissions.
- Dates and service times use the establishment timezone.
- The dashboard returns only fields it renders.

## Deferred capabilities

The reference image contains concepts without current dashboard-ready domain
support:

- daily task counters, lists, completion, priority, and assignee behavior;
- team schedules and shift summaries;
- generic unread email;
- marketing content approval;
- operational preparation, cleaning, opening, or closing blocks;
- reservation cut-off and last-arrival fields;
- cross-module contextual add actions beyond current routes;
- dashboard analytics events, polling, or realtime subscriptions.

These concepts are omitted, not represented as zero, disabled, or
not-configured. A not-configured state is valid only for an implemented module
that actually has configuration semantics.

## Explicitly out of scope

- revenue, sales, margin, average basket, payment, invoice, checkout, till,
  cash, transaction, or financial KPIs;
- local POS ordering, kitchen, printing, payment, or cash-management data;
- sidebar or application-shell redesign;
- navigation copied from the mockup;
- new product modules created only to populate this dashboard;
- schema, contract, permission, or migration changes without separate approval.

## Success criteria

- No fixture value is presented as real operational data.
- Supported summary values reconcile with their linked modules.
- A partial booking or reputation failure does not make another supported
  section misleading.
- The primary content is understandable at desktop, tablet, and mobile widths.
- Unsupported and local operational product scope remains absent.
