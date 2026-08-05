# YUTA Public Booking — Phase 0 & Phase 1 Implementation Specification

**Document type:** Technical implementation specification  
**Target:** Codex / development agent  
**Project:** YUTA  
**Application:** Public restaurant booking  
**Implementation scope:** Phase 0 Foundation + Phase 1 Core MVP only  
**Status:** Ready for repository inspection and implementation  
**Product language:** French first  
**Documentation language:** English  

---

## 1. Purpose

This document defines the exact implementation scope for the first production-usable version of the YUTA Public Booking application.

Codex must use this document to implement:

- **Phase 0 — Foundation**;
- **Phase 1 — Public Booking MVP**.

The complete long-term vision is defined in:

```text
YUTA_PUBLIC_BOOKING_APP_MASTER_SPEC.md
```

The current database and tenant model is defined in:

```text
YUTA_CURRENT_DATABASE_CONTEXT_FOR_AI.md
```

The post-login establishment selection flow is defined in:

```text
YUTA_POST_LOGIN_ESTABLISHMENT_SELECTION_SPEC.md
```

This implementation document is intentionally narrower than the master specification. Codex must understand the complete product vision from the master document but must implement only the scope explicitly authorized here.

---

## 2. Source-of-truth precedence

When documents, repository code, or earlier proposals differ, use this precedence:

1. current executable Drizzle schemas in `packages/db-cloud`;
2. current repository implementation and established package conventions;
3. `YUTA_CURRENT_DATABASE_CONTEXT_FOR_AI.md`;
4. `YUTA_POST_LOGIN_ESTABLISHMENT_SELECTION_SPEC.md` for authenticated establishment scope;
5. this Phase 0–1 implementation specification;
6. `YUTA_PUBLIC_BOOKING_APP_MASTER_SPEC.md` for long-term product direction;
7. older feature proposals or chat history.

If the current repository differs from this document, Codex must:

1. prefer the executable repository when the difference is an established architectural fact;
2. avoid silently redesigning the repository;
3. report the mismatch;
4. make the smallest safe adaptation;
5. request an architecture decision only when implementation would otherwise be unsafe or contradictory.

---

## 3. Mandatory architecture context

### 3.1 No persisted tenant entity

YUTA does not have a `tenants` table and does not use a generic `tenant_id` column.

The persisted cloud hierarchy is:

```text
organization
└── establishment
```

In application code, tenant means a validated runtime context, not a database entity.

For establishment-owned booking data, every record must contain:

```text
organization_id NOT NULL
establishment_id NOT NULL
```

Codex must not:

- create a `tenants` table;
- add `tenant_id` or `tenantId`;
- treat organization and establishment as interchangeable;
- trust browser-supplied organization or establishment scope;
- create a second booking-specific tenant model.

### 3.2 Cloud database ownership

Booking is a cloud SaaS module.

All booking schema and data access must belong to:

```text
packages/db-cloud
CLOUD_DATABASE_URL
```

Do not create an independent booking database for Phase 0–1.

### 3.3 Authenticated back-office scope

Back-office booking operations must use the current validated server session containing:

```ts
type ActiveEstablishmentScope = {
  organizationId: string;
  establishmentId: string;
};
```

The active scope must be revalidated against:

- active user;
- active organization;
- active establishment;
- active establishment-level membership;
- required booking entitlement;
- required booking permission or role rule.

The browser must not be allowed to select a trusted `organizationId` independently.

### 3.4 Public establishment scope

Public booking routes resolve the establishment from a globally unique establishment slug.

Example:

```text
reservation.yutapro.fr/luna
```

The server resolves:

```text
slug
→ active establishment
→ parent organization
→ booking entitlement
→ booking settings
→ public-safe establishment presentation
```

The public client must not send trusted scope identifiers.

### 3.5 Feature entitlement

Use the existing `tenant_entitlements` model.

Recommended key:

```text
booking.enabled
```

A public booking page is available only when all of the following are true:

- organization is active;
- establishment is active;
- establishment slug is valid;
- `booking.enabled` is enabled;
- booking settings are enabled.

Do not create a competing feature-flag table.

---

## 4. Authorized scope

Codex is authorized to implement only the following.

### 4.1 Phase 0 — Foundation

- create the independent `apps/booking-web` application;
- integrate it with existing monorepo conventions;
- create booking domain types and shared contracts;
- create booking database schema in `packages/db-cloud`;
- implement tenant-safe booking repositories;
- implement public establishment resolution by slug;
- implement public-safe establishment DTOs;
- enforce `booking.enabled` entitlement;
- establish typed errors and public error states;
- add baseline observability and audit structures;
- prepare an email-provider-neutral notification interface;
- add unit and integration test foundations;
- add development seed/configuration for the existing LUNA establishment without hardcoding LUNA into domain logic.

### 4.2 Phase 1 — Core MVP

#### Public guest experience

- branded public establishment booking page;
- party-size selection;
- date selection;
- available time-slot selection;
- guest name;
- guest phone number;
- optional guest email;
- optional guest note;
- limited special-requirement fields;
- reservation creation;
- automatic or manual confirmation mode;
- confirmed or pending result;
- secure public reservation page;
- guest cancellation when allowed;
- French interface;
- mobile-first responsive experience;
- basic SEO and sharing metadata for the public establishment page;
- `noindex` behavior for private reservation URLs.

#### Restaurant back-office

- reservation list;
- day view;
- basic week navigation or week grouping;
- reservation details;
- manual reservation creation;
- guest information editing;
- confirm pending reservation;
- decline pending reservation;
- cancel reservation;
- mark seated;
- mark completed;
- mark no-show;
- internal note;
- booking settings;
- weekly service periods;
- slot interval configuration;
- online capacity configuration;
- minimum advance time;
- maximum advance days;
- maximum online party size;
- automatic or manual confirmation mode;
- exceptional closure;
- modified service hours for a specific date;
- blocked slot;
- confirmation and operational email events.

#### Platform safeguards

- server-authoritative availability;
- transaction-safe creation;
- concurrency protection against overbooking;
- idempotent public submission;
- public endpoint rate limiting;
- duplicate-submission protection;
- secure public tokens;
- tenant isolation tests;
- audit history;
- privacy-safe logs;
- controlled error handling.

---

## 5. Explicitly excluded scope

Codex must not implement the following in this delivery:

- guest accounts;
- SMS confirmation or reminders;
- automated reminders;
- waitlist;
- guest self-service modification;
- multilingual public UI beyond French architecture readiness;
- table definitions;
- dining areas;
- floor plans;
- table assignment;
- table combinations;
- automatic table allocation;
- dynamic turn-time optimization;
- dynamic overbooking rules;
- custom booking domains;
- per-establishment booking subdomains;
- embeddable widget;
- Google booking integration;
- Facebook or Instagram integration;
- third-party booking marketplace synchronization;
- advanced booking analytics;
- predictive no-show scoring;
- AI capacity recommendations;
- group-event workflow;
- complex customer CRM profiles;
- generic workflow engine;
- broad notification platform unrelated to booking MVP.

Codex must not create unused schema, empty UI, placeholder services, or speculative abstractions for these excluded features unless a minimal extension point is explicitly required by this specification.

---

## 6. Delivery strategy

Phase 0 and Phase 1 form one product delivery, divided into controlled milestones.

Codex must not attempt to implement the entire application in one unreviewable change.

Recommended milestone order:

```text
Milestone 0 — Repository inspection and implementation map
Milestone 1 — Booking foundation and public resolution
Milestone 2 — Cloud schema and tenant-safe domain services
Milestone 3 — Availability engine
Milestone 4 — Reservation creation and lifecycle
Milestone 5 — Minimal back-office operations
Milestone 6 — Public booking UI
Milestone 7 — Notifications, safeguards, QA and pilot readiness
```

Each milestone must:

- build successfully;
- include relevant tests;
- avoid implementing later-phase features;
- report repository differences;
- leave the repository in a coherent state.

---

## 7. Milestone 0 — Repository inspection

Before structural changes, Codex must inspect and document:

1. monorepo workspace layout;
2. current Next.js application conventions;
3. current `apps/app` route organization;
4. existing server action and route-handler patterns;
5. `packages/db-cloud/src/schema` organization;
6. current Drizzle enum, table, relation and repository conventions;
7. current tenant context resolver;
8. current authenticated session resolver;
9. current membership and permission guards;
10. current entitlement access helpers;
11. current shared contract package structure;
12. current UI package and form patterns;
13. current logging and audit conventions;
14. current test framework and database test strategy;
15. current deployment configuration for independent apps;
16. current email or notification infrastructure, if any;
17. current rate-limiting infrastructure, if any;
18. current date/time library and timezone conventions.

### Required inspection output

Before broad implementation, Codex must produce a concise implementation map containing:

- existing components to reuse;
- new modules required;
- likely files to create or modify;
- detected conflicts with this specification;
- any security-critical uncertainty;
- the proposed milestone sequence.

Codex may proceed without waiting for additional approval when the repository supports the intended architecture and no critical conflict exists.

---

## 8. Target application and package structure

The final paths must follow actual repository conventions. The following structure is directional, not permission to duplicate existing packages.

```text
apps/
├── app/                         # Existing restaurant back-office
└── booking-web/                 # New public booking application

packages/
├── db-cloud/
│   └── src/
│       ├── schema/
│       │   └── booking/
│       └── repositories/
│           └── booking/
│
├── booking/
│   └── src/
│       ├── availability/
│       ├── reservations/
│       ├── policies/
│       ├── errors/
│       └── index.ts
│
├── contracts/
│   └── src/
│       └── booking/
│
├── tenant/
├── ui/
└── notifications/              # Reuse existing package if present
```

### 8.1 Package responsibilities

#### `apps/booking-web`

Responsible for:

- public routing;
- server rendering;
- public request orchestration;
- guest-facing components;
- SEO metadata;
- safe public route handlers;
- integration with shared booking services.

It must not own canonical booking business rules.

#### `apps/app`

Responsible for:

- authenticated booking screens;
- active-establishment context;
- staff actions;
- booking configuration UI;
- operational reservation management.

It must not duplicate availability or lifecycle rules.

#### `packages/booking`

Framework-independent domain logic:

- slot generation;
- availability computation;
- booking horizon validation;
- capacity rules;
- reservation status transitions;
- cancellation policy checks;
- source normalization;
- public token policy abstractions;
- typed domain errors.

It must not import React or Next.js.

#### `packages/contracts`

Shared Zod schemas and transport-safe types:

- public establishment DTO;
- availability query and result;
- reservation creation input and result;
- public reservation DTO;
- cancellation input and result;
- back-office mutation contracts;
- booking settings contracts.

#### `packages/db-cloud`

Owns:

- Drizzle schema;
- relations;
- database repositories;
- tenant-scoped persistence;
- transactional reservation creation;
- integration tests against PostgreSQL.

---

## 9. Database schema

Codex must adapt names and column conventions to current Drizzle patterns. Every booking-owned table must include explicit organization and establishment scope.

Recommended minimum tables:

```text
booking_settings
booking_service_periods
booking_capacity_rules
booking_exceptions
reservations
reservation_status_history
reservation_internal_notes
booking_audit_events
booking_notification_deliveries
```

If the repository already has a generic audit or notification-delivery mechanism, reuse it instead of creating redundant tables.

### 9.1 `booking_settings`

One row per establishment.

Recommended fields:

```text
organization_id uuid NOT NULL
establishment_id uuid NOT NULL
enabled boolean NOT NULL default false
confirmation_mode enum NOT NULL
slot_interval_minutes integer NOT NULL
minimum_advance_minutes integer NOT NULL
maximum_advance_days integer NOT NULL
maximum_online_party_size integer NOT NULL
default_reservation_duration_minutes integer NOT NULL
cancellation_allowed boolean NOT NULL
cancellation_deadline_minutes integer nullable
late_arrival_tolerance_minutes integer nullable
public_phone varchar nullable
public_email varchar nullable
public_address jsonb or existing address reference nullable
public_booking_message text nullable
cancellation_policy_text text nullable
created_at timestamptz NOT NULL
updated_at timestamptz NOT NULL
```

Primary or unique key:

```text
(organization_id, establishment_id)
```

Rules:

- `establishment_id` must belong to `organization_id`;
- all numeric configuration values must have database and Zod bounds;
- `enabled` does not replace the `booking.enabled` entitlement;
- public presentation should reuse existing establishment fields where available instead of duplicating canonical name, locale, timezone or slug.

### 9.2 `booking_service_periods`

Represents recurring weekly availability periods.

Recommended fields:

```text
id uuid PK
organization_id uuid NOT NULL
establishment_id uuid NOT NULL
day_of_week smallint NOT NULL
name varchar NOT NULL
start_local_time time NOT NULL
end_local_time time NOT NULL
online_capacity integer NOT NULL
enabled boolean NOT NULL
sort_order integer NOT NULL default 0
created_at timestamptz NOT NULL
updated_at timestamptz NOT NULL
```

Rules:

- `day_of_week` must use one documented convention;
- overnight service periods are excluded from Phase 1 unless already safely supported;
- overlapping service periods must be rejected or explicitly handled;
- capacity must be positive;
- time values are interpreted in the establishment timezone.

### 9.3 `booking_capacity_rules`

Use only when Phase 1 requires capacity that varies within a service period.

Recommended fields:

```text
id uuid PK
organization_id uuid NOT NULL
establishment_id uuid NOT NULL
service_period_id uuid NOT NULL
start_local_time time NOT NULL
end_local_time time NOT NULL
online_capacity integer NOT NULL
created_at timestamptz NOT NULL
updated_at timestamptz NOT NULL
```

If one capacity per service period is sufficient for the initial implementation, Codex may defer this table and calculate capacity from `booking_service_periods.online_capacity`.

Do not add schema merely because it appears in the master vision. Record the decision in the completion report.

### 9.4 `booking_exceptions`

Represents establishment-specific date exceptions.

Recommended exception kinds:

```text
CLOSED_ALL_DAY
CLOSED_SERVICE
MODIFIED_HOURS
BLOCKED_SLOT
CAPACITY_OVERRIDE
```

Recommended fields:

```text
id uuid PK
organization_id uuid NOT NULL
establishment_id uuid NOT NULL
local_date date NOT NULL
kind enum NOT NULL
service_period_id uuid nullable
start_local_time time nullable
end_local_time time nullable
capacity_override integer nullable
reason varchar nullable
enabled boolean NOT NULL
created_by_user_id uuid nullable
created_at timestamptz NOT NULL
updated_at timestamptz NOT NULL
```

Phase 1 UI is required for:

- full-day closure;
- service closure;
- modified hours;
- blocked slot.

Capacity override can be implemented when it follows naturally from the same model, but it must not delay the required exception flows.

### 9.5 `reservations`

Recommended fields:

```text
id uuid PK
organization_id uuid NOT NULL
establishment_id uuid NOT NULL
reservation_number varchar NOT NULL
public_token_hash varchar NOT NULL
status reservation_status NOT NULL
source reservation_source NOT NULL
local_date date NOT NULL
start_local_time time NOT NULL
end_local_time time nullable
start_at timestamptz NOT NULL
end_at timestamptz nullable
party_size integer NOT NULL
guest_name varchar NOT NULL
guest_phone varchar NOT NULL
guest_phone_normalized varchar NOT NULL
guest_email varchar nullable
guest_email_normalized varchar nullable
guest_locale varchar NOT NULL default 'fr-FR'
guest_note text nullable
special_requirements jsonb nullable
internal_summary text nullable
confirmation_mode_snapshot varchar NOT NULL
establishment_timezone_snapshot varchar NOT NULL
cancelled_at timestamptz nullable
cancelled_by_actor_type varchar nullable
cancellation_reason varchar nullable
idempotency_key_hash varchar nullable
created_by_actor_type varchar NOT NULL
created_by_user_id uuid nullable
created_at timestamptz NOT NULL
updated_at timestamptz NOT NULL
```

Required uniqueness or indexes:

```text
unique reservation_number within the chosen platform scope
unique public_token_hash
index organization_id + establishment_id + local_date + start_local_time
index organization_id + establishment_id + status + local_date
index organization_id + establishment_id + guest_phone_normalized
conditional or scoped uniqueness for idempotency where appropriate
```

Rules:

- raw public tokens must never be stored;
- use a cryptographically secure opaque token;
- store only a hash suitable for lookup and comparison;
- do not expose sequential database IDs publicly;
- preserve establishment timezone snapshot;
- store local date/time explicitly for stable restaurant operations;
- store UTC timestamps for absolute time ordering;
- guest data must never be used as metric labels or included in general logs.

### 9.6 `reservation_status_history`

Recommended fields:

```text
id uuid PK
organization_id uuid NOT NULL
establishment_id uuid NOT NULL
reservation_id uuid NOT NULL
from_status reservation_status nullable
to_status reservation_status NOT NULL
actor_type enum NOT NULL
actor_user_id uuid nullable
reason varchar nullable
metadata jsonb nullable
created_at timestamptz NOT NULL
```

Every lifecycle transition must append a history entry in the same transaction as the status change.

### 9.7 `reservation_internal_notes`

Recommended fields:

```text
id uuid PK
organization_id uuid NOT NULL
establishment_id uuid NOT NULL
reservation_id uuid NOT NULL
author_user_id uuid NOT NULL
content text NOT NULL
created_at timestamptz NOT NULL
updated_at timestamptz NOT NULL
```

Notes are staff-only and must never appear in public DTOs.

### 9.8 Audit events

Required auditable actions:

- settings changed;
- service period created, updated or deleted;
- exception created, updated or disabled;
- reservation manually created;
- reservation confirmed;
- reservation declined;
- reservation cancelled;
- guest data edited;
- reservation marked seated;
- reservation marked completed;
- reservation marked no-show;
- capacity override used;
- public cancellation performed.

Reuse a repository-wide audit mechanism where available.

---

## 10. Reservation status model

Required statuses:

```text
PENDING
CONFIRMED
DECLINED
CANCELLED
SEATED
COMPLETED
NO_SHOW
```

Use naming consistent with existing repository enum conventions.

### 10.1 Allowed transitions

Minimum allowed transition map:

```text
PENDING   → CONFIRMED | DECLINED | CANCELLED
CONFIRMED → CANCELLED | SEATED | NO_SHOW
SEATED    → COMPLETED
```

Staff correction may require controlled transitions, but must not be implemented as unrestricted status editing.

Recommended controlled correction cases:

```text
NO_SHOW   → CONFIRMED or SEATED only with explicit staff correction action
CANCELLED → CONFIRMED only with explicit restore action and fresh capacity check
DECLINED  → PENDING or CONFIRMED only with explicit reopen action and fresh capacity check
```

These correction cases are optional for Phase 1. If not implemented, the UI must not expose them.

### 10.2 Confirmation mode

```text
AUTOMATIC
MANUAL
```

Creation behavior:

- automatic mode creates `CONFIRMED` when capacity is valid;
- manual mode creates `PENDING` when capacity is valid;
- both modes consume booking capacity unless the final domain decision explicitly excludes pending reservations;
- for Phase 1, pending reservations should consume capacity to avoid accepting overlapping requests beyond configured capacity.

---

## 11. Availability model

Phase 1 uses capacity per time slot, not tables.

### 11.1 Inputs

Availability calculation must receive:

```ts
type AvailabilityQuery = {
  organizationId: string;
  establishmentId: string;
  localDate: string;
  partySize: number;
  now: Date;
};
```

Public callers derive scope from slug before invoking the service.

### 11.2 Authoritative configuration

Availability depends on:

- establishment timezone;
- booking entitlement;
- booking enabled setting;
- weekly service periods;
- slot interval;
- service-period capacity;
- date exceptions;
- minimum advance time;
- maximum advance days;
- maximum online party size;
- existing reservations consuming capacity.

### 11.3 Capacity-consuming statuses

For Phase 1, the following consume capacity:

```text
PENDING
CONFIRMED
SEATED
```

The following do not consume future capacity:

```text
DECLINED
CANCELLED
COMPLETED
NO_SHOW
```

Tests must document this behavior.

### 11.4 Slot generation

For each applicable service period:

1. resolve local opening and closing time;
2. apply date exceptions;
3. generate slots using configured interval;
4. reject slots violating booking horizon;
5. calculate consumed capacity;
6. return only slots able to accept the requested party size;
7. do not reveal exact remaining capacity publicly unless a future product requirement explicitly allows it.

Public response example:

```ts
type PublicAvailabilitySlot = {
  startsAt: string;
  localTime: string;
  available: boolean;
  servicePeriodId: string;
};
```

Prefer returning only available slots to the normal guest UI while retaining controlled reason codes internally.

### 11.5 Timezone rules

The establishment timezone is authoritative.

Never calculate reservation validity using the browser timezone.

Required test cases:

- guest in a different timezone;
- daylight-saving transition;
- booking near midnight;
- maximum advance boundary;
- minimum advance boundary;
- exception date;
- disabled service period;
- establishment timezone `Europe/Paris`.

### 11.6 Concurrency protection

Displaying an available slot does not reserve capacity.

At creation time, the server must:

1. begin a database transaction;
2. resolve and lock the relevant capacity boundary or use an equivalent serializable/advisory-lock strategy;
3. recalculate slot eligibility;
4. count capacity-consuming reservations;
5. reject when the new party size exceeds capacity;
6. create the reservation;
7. create status history;
8. persist idempotency state;
9. commit;
10. trigger notifications only after commit.

A naive read-then-insert without concurrency control is forbidden.

Codex must choose a PostgreSQL-safe strategy compatible with the repository and explain it in the completion report.

---

## 12. Reservation creation

### 12.1 Public input

Minimum input:

```ts
type CreatePublicReservationInput = {
  establishmentSlug: string;
  localDate: string;
  localTime: string;
  partySize: number;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  guestNote?: string;
  specialRequirements?: {
    highChair?: boolean;
    stroller?: boolean;
    reducedMobility?: boolean;
    allergyOrDietaryNote?: string;
  };
  source?: string;
  idempotencyKey: string;
};
```

The route slug is authoritative. Do not accept trusted organization or establishment IDs.

### 12.2 Validation

Validate with Zod and database constraints:

- supported local date format;
- valid offered slot;
- bounded party size;
- trimmed guest name;
- normalized French/international phone number;
- valid optional email;
- bounded notes;
- bounded allergy or dietary note;
- known source values;
- valid idempotency key format;
- no HTML or unsafe payload persistence.

### 12.3 Source attribution

Phase 1 may support:

```text
DIRECT
GOOGLE
FACEBOOK
INSTAGRAM
TIKTOK
QR_CODE
WEBSITE
PHONE
BACK_OFFICE
OTHER
```

Only use values required by the current product and naming conventions. Unknown query parameters must not become arbitrary persisted enum values.

Recommended public mapping:

```text
?utm_source=google → GOOGLE
?utm_source=instagram → INSTAGRAM
```

### 12.4 Creation result

Return a controlled DTO:

```ts
type CreatePublicReservationResult = {
  reservationNumber: string;
  status: "PENDING" | "CONFIRMED";
  publicToken: string;
  managementUrl: string;
  localDate: string;
  localTime: string;
  partySize: number;
};
```

The raw token may be returned only once in the successful creation response and notification link.

### 12.5 Idempotency

Multiple submissions with the same establishment scope and idempotency key must not create multiple reservations.

The same idempotency key with a materially different payload must return a controlled conflict.

Do not rely only on client-side button disabling.

---

## 13. Public reservation management

Route recommendation:

```text
/[establishmentSlug]/reservation/[publicToken]
```

The public token must be:

- cryptographically random;
- opaque;
- long enough to resist guessing;
- stored only as a hash;
- excluded from logs, analytics and error messages.

### 13.1 Public reservation DTO

May expose:

- restaurant public name;
- reservation number;
- local date and time;
- party size;
- guest display name or safe partial representation;
- current guest-facing status;
- cancellation availability;
- public policy text;
- public restaurant contact information.

Must not expose:

- internal database ID;
- organization ID;
- establishment ID;
- internal notes;
- staff user IDs;
- audit metadata;
- private operational comments;
- notification-provider details.

### 13.2 Guest cancellation

Cancellation requires:

1. valid public token;
2. reservation currently cancellable;
3. cancellation policy check;
4. transactional update;
5. status-history append;
6. post-commit notification.

Guest cancellation must be idempotent.

If already cancelled, return the current cancelled state rather than causing an uncontrolled error.

---

## 14. Public establishment page

### 14.1 Route

```text
/[establishmentSlug]
```

### 14.2 Required content

- establishment name;
- logo when configured;
- optional cover image when configured;
- concise booking message;
- public address;
- public phone;
- booking form;
- opening or booking-service information;
- cancellation or lateness policy summary;
- privacy and terms links;
- discreet YUTA attribution.

Reuse canonical establishment information where it exists. Do not duplicate canonical data solely for the booking page.

### 14.3 Booking flow

Recommended conceptual steps:

```text
1. Party size
2. Date and available time
3. Guest details
4. Review and submit
```

The implementation may use one route with progressive sections or multiple client states. Do not create unnecessary page transitions.

### 14.4 User experience states

Required states:

- initial loading;
- establishment unavailable;
- booking disabled;
- no service on date;
- no slots available;
- slot became unavailable;
- validation errors;
- submission pending;
- confirmed success;
- pending-confirmation success;
- network or server failure;
- duplicate-safe retry.

### 14.5 Accessibility

Required baseline:

- keyboard-accessible controls;
- correct labels;
- visible focus;
- screen-reader-friendly validation;
- no color-only status indication;
- sufficient contrast;
- touch targets suitable for mobile;
- semantic headings;
- localized date/time labels.

### 14.6 SEO

The public establishment page should support:

- title;
- description;
- canonical URL;
- Open Graph metadata;
- restaurant image when available;
- indexable booking purpose when appropriate.

Private reservation pages must:

- use `noindex`;
- be excluded from sitemap generation;
- contain no sensitive metadata.

---

## 15. Public API and server boundaries

Exact routes must follow repository conventions. Recommended logical operations:

```text
GET  public establishment by slug
GET  availability for slug/date/party size
POST create public reservation
GET  public reservation by token
POST cancel public reservation by token
```

Recommended route examples:

```text
GET  /api/public/booking/establishments/:slug
GET  /api/public/booking/establishments/:slug/availability
POST /api/public/booking/establishments/:slug/reservations
GET  /api/public/booking/reservations/:publicToken
POST /api/public/booking/reservations/:publicToken/cancel
```

Rules:

- scope is derived server-side;
- all inputs use shared Zod contracts;
- public errors are mapped to stable error codes;
- database errors are not exposed;
- private fields are not serialized;
- endpoints are rate-limited;
- creation uses idempotency;
- token routes are never cached publicly;
- establishment presentation may be safely cached with invalidation.

---

## 16. Back-office implementation

The back-office UI belongs inside the existing restaurant application and must use the active establishment session scope.

### 16.1 Recommended navigation

```text
Réservations
├── Aujourd’hui
├── Calendrier
├── Toutes les réservations
├── Disponibilités
├── Fermetures et exceptions
└── Paramètres
```

Adapt naming and grouping to the current application navigation.

### 16.2 Reservation list

Required fields:

- local time;
- guest name;
- party size;
- status;
- source;
- phone visibility according to role and existing privacy conventions;
- special-requirement indicator;
- internal-note indicator.

Required filters:

- date;
- status;
- search by reservation number, guest name or normalized phone;
- source when inexpensive to add.

Default view should prioritize the current establishment date in its timezone.

### 16.3 Reservation details

Required actions:

- edit guest name;
- edit phone;
- edit optional email;
- edit party size with fresh capacity validation;
- edit date/time with fresh capacity validation;
- edit guest note;
- add internal note;
- confirm;
- decline;
- cancel;
- mark seated;
- mark completed;
- mark no-show.

Every mutation must:

1. require authentication;
2. resolve active establishment context;
3. validate permission or role;
4. validate input with Zod;
5. query by ID **and** organization/establishment scope;
6. validate lifecycle transition;
7. append history/audit;
8. return a controlled result.

### 16.4 Manual reservation creation

Staff can create reservations received by phone or another direct channel.

Required input:

- date;
- time;
- party size;
- guest name;
- phone;
- optional email;
- optional note;
- source, default `PHONE` or `BACK_OFFICE`;
- optional controlled capacity override.

Normal manual creation must respect capacity.

If capacity override is included in Phase 1:

- require a specific permission or role rule;
- show a clear warning;
- require an optional or mandatory reason according to final UI design;
- record the override in audit history.

### 16.5 Booking settings UI

Required controls:

- online booking enabled;
- confirmation mode;
- slot interval;
- minimum advance time;
- maximum advance days;
- maximum online party size;
- default reservation duration;
- cancellation enabled;
- cancellation deadline when enabled;
- late-arrival tolerance when used;
- public booking message;
- cancellation policy text.

Only users with settings permission may edit these values.

### 16.6 Weekly service periods

Required operations:

- create;
- edit;
- enable/disable;
- delete when safe;
- configure day, name, start, end and capacity.

Deletion must not break historical reservations.

### 16.7 Exceptions UI

Required operations:

- close full day;
- close one service;
- modify opening period for a date;
- block a time slot;
- provide optional internal reason;
- list and remove future exceptions.

---

## 17. Permission model

Use the current repository authorization model. Do not build a separate ACL platform solely for booking.

Recommended logical permissions:

```text
booking.read
booking.create
booking.update
booking.confirm
booking.decline
booking.cancel
booking.mark_seated
booking.mark_completed
booking.mark_no_show
booking.override_capacity
booking.manage_settings
```

If fine-grained permissions do not yet exist, map safely to current roles and centralize the mapping.

Suggested minimum role behavior, subject to current YUTA role definitions:

```text
OWNER   → all Phase 1 booking permissions
MANAGER → operational permissions + settings where current policy permits
STAFF   → read and operational lifecycle actions; no structural settings by default
```

Do not scatter hardcoded role comparisons across UI components and route handlers.

System roles must not silently bypass establishment membership.

---

## 18. Notification scope

Phase 1 requires email-capable event handling, but must remain provider-neutral.

Required notification events:

```text
reservation.created_pending
reservation.created_confirmed
reservation.confirmed
reservation.declined
reservation.cancelled_by_guest
reservation.cancelled_by_restaurant
reservation.updated_materially
```

Minimum recipients:

- guest confirmation or pending acknowledgement when email is present;
- restaurant notification for a new pending reservation;
- guest notification when restaurant confirms, declines or cancels;
- restaurant notification when guest cancels when configured.

### 18.1 Transaction boundary

Notification sending must not occur before reservation transaction commit.

Preferred order:

```text
transaction commits
→ domain event recorded or emitted
→ notification delivery attempted asynchronously or post-commit
→ delivery status recorded
```

If no durable job infrastructure exists yet, implement a clean provider-neutral service and failure recording without pretending delivery is guaranteed.

Do not fail a committed reservation solely because email delivery failed.

### 18.2 Email content

French templates must clearly show:

- restaurant name;
- reservation status;
- reservation number;
- local date and time;
- party size;
- management link when applicable;
- cancellation policy summary;
- restaurant contact details.

Do not include internal notes.

---

## 19. Security and abuse protection

### 19.1 Required controls

- server-side input validation;
- scoped repository queries;
- cryptographically secure public tokens;
- hashed token storage;
- idempotency keys;
- rate limiting by privacy-safe request key;
- normalized phone duplicate checks;
- normalized email duplicate checks when email exists;
- bounded payload sizes;
- safe text rendering;
- secure headers;
- CSRF protection where applicable to the chosen request mechanism;
- no raw secrets in client bundles;
- no raw tokens in logs;
- no guest personal data in metrics;
- controlled public errors;
- audit logs for mutations.

### 19.2 Rate limiting

At minimum, protect:

- availability requests;
- reservation creation;
- public token lookup;
- cancellation.

Creation limits should consider:

- IP or privacy-safe derived key;
- normalized phone;
- normalized email when available;
- establishment scope;
- short-term request velocity.

Do not force CAPTCHA for every guest in the default flow.

A risk-based challenge is outside Phase 1 unless existing infrastructure makes it trivial.

### 19.3 Duplicate detection

Duplicate detection must not block legitimate separate bookings solely because the phone number matches.

Use a controlled rule such as:

- same establishment;
- same local date/time or nearby time window;
- same normalized phone;
- active capacity-consuming status;
- recent creation.

Return a safe conflict or the existing reservation result when idempotency proves it is the same submission.

### 19.4 Tenant isolation

Every authenticated reservation query must include:

```text
organization_id = active organization
AND establishment_id = active establishment
```

This remains mandatory even when reservation IDs are globally unique.

Required security test:

```text
A user scoped to establishment A cannot read, update, cancel, confirm,
or infer the existence of a reservation owned by establishment B.
```

---

## 20. Privacy and data minimization

Phase 1 must collect only data required to manage a reservation.

Required privacy principles:

- no guest account required;
- email optional;
- public token is the guest management credential;
- internal notes separated from guest notes;
- guest data excluded from generic analytics;
- logs use IDs and controlled metadata, not full personal details;
- public pages expose minimal data;
- staff access follows current role rules;
- retention and anonymization extension points are documented.

Required public links:

- privacy policy;
- terms or booking conditions where appropriate.

The final legal wording is outside the coding scope unless provided separately. Use clearly marked configurable content instead of inventing legal claims.

---

## 21. Error model

Create stable typed errors and safe transport mappings.

Recommended public error codes:

```text
ESTABLISHMENT_NOT_FOUND
BOOKING_NOT_ENABLED
BOOKING_CONFIGURATION_INCOMPLETE
INVALID_PARTY_SIZE
DATE_OUTSIDE_BOOKING_WINDOW
SERVICE_NOT_AVAILABLE
SLOT_NOT_AVAILABLE
RESERVATION_CONFLICT
DUPLICATE_SUBMISSION
INVALID_PUBLIC_TOKEN
CANCELLATION_NOT_ALLOWED
RATE_LIMITED
VALIDATION_ERROR
INTERNAL_ERROR
```

Rules:

- do not expose database exception messages;
- do not reveal whether a cross-tenant ID exists;
- provide a guest-friendly French message;
- provide a stable code for UI behavior;
- log internal correlation ID without personal data;
- for a slot conflict, refresh and offer current alternatives.

---

## 22. Caching rules

Safe to cache with controlled invalidation:

- public establishment presentation;
- booking-enabled status;
- non-sensitive booking settings used for display;
- weekly service periods where invalidation is reliable.

Do not publicly cache:

- reservation creation responses;
- public reservation management pages;
- public-token API responses;
- guest data;
- availability for long periods without correct invalidation.

Availability may use very short-lived server caching only when correctness remains protected by transactional revalidation.

Cache keys must include establishment identity and relevant query dimensions.

Switching establishment in the back-office must not retain previous establishment booking data.

---

## 23. Observability

Record structured technical signals without personal data.

Recommended events and metrics:

```text
booking_public_page_viewed
booking_availability_requested
booking_slot_selected
booking_submission_attempted
booking_created_pending
booking_created_confirmed
booking_creation_rejected_capacity
booking_creation_duplicate
booking_public_token_invalid
booking_cancelled_by_guest
booking_status_changed
booking_notification_failed
booking_rate_limited
booking_cross_scope_denied
```

Recommended contextual fields:

```text
requestId
organizationId
establishmentId
reservationId when internal
actorType
status
source
errorCode
```

Forbidden metric or log fields:

- guest name;
- raw phone;
- raw email;
- guest note;
- public token;
- full notification body.

---

## 24. Testing requirements

### 24.1 Unit tests — domain

Test at minimum:

1. slot generation for valid service period;
2. disabled service period;
3. full-day closure;
4. service closure;
5. modified hours;
6. blocked slot;
7. minimum advance boundary;
8. maximum advance boundary;
9. party size above maximum;
10. capacity with pending reservations;
11. capacity with confirmed reservations;
12. cancelled reservation excluded from capacity;
13. status transition validation;
14. cancellation policy validation;
15. timezone conversion;
16. daylight-saving boundary;
17. source normalization;
18. duplicate detection policy.

### 24.2 Database integration tests

Test at minimum:

1. all repositories require organization and establishment scope;
2. establishment A cannot access establishment B reservation;
3. public slug resolves correct establishment and organization;
4. disabled establishment fails closed;
5. missing entitlement fails closed;
6. disabled booking setting fails closed;
7. reservation creation appends status history;
8. status change and history are atomic;
9. guest cancellation and history are atomic;
10. idempotency prevents duplicate creation;
11. token lookup uses hash and does not store raw token;
12. concurrent final-capacity requests create only allowed reservations;
13. exception changes availability correctly;
14. editing party size revalidates capacity;
15. moving reservation revalidates capacity.

### 24.3 API or server-action tests

Test at minimum:

1. invalid public payload rejected;
2. browser-supplied scope ignored or rejected;
3. unknown slug returns safe result;
4. booking-disabled slug returns safe result;
5. available slots returned correctly;
6. stale selected slot returns conflict;
7. successful automatic confirmation;
8. successful manual pending creation;
9. invalid token returns safe not-found state;
10. guest cancellation succeeds when allowed;
11. guest cancellation is idempotent;
12. cancellation after deadline rejected;
13. rate limiting returns controlled response;
14. back-office mutation requires valid active scope;
15. unauthorized role cannot edit settings.

### 24.4 E2E flows

Required minimum flows:

#### Public automatic confirmation

```text
Open /luna
→ select party size
→ select date and available slot
→ enter guest details
→ submit
→ see confirmed state
→ open secure management link
→ cancel reservation
→ see cancelled state
```

#### Public manual confirmation

```text
Open enabled establishment
→ create booking
→ see pending state
→ staff opens back-office
→ confirms booking
→ guest-facing page shows confirmed state
```

#### Closure

```text
Staff closes a date
→ public page requests that date
→ no unavailable slot is offered
```

#### Cross-establishment isolation

```text
User active in establishment A
→ attempts reservation ID from establishment B
→ receives safe not-found/forbidden result
→ no B data is exposed
```

#### Concurrency

```text
Capacity remaining equals one accepted party
→ two simultaneous valid submissions
→ only one succeeds
→ the other receives slot conflict
```

### 24.5 UI tests

Verify:

- mobile widths;
- keyboard flow;
- screen-reader labels;
- loading states;
- empty states;
- validation messages;
- French copy;
- date and time formatting;
- no stale data after establishment switch;
- private reservation pages are noindex.

---

## 25. Development seed and pilot configuration

Use the existing development seed for:

```text
organization: LUNA
establishment: LUNA
slug: luna
```

Add booking entitlement and initial settings idempotently.

Suggested seed behavior:

```text
tenant_entitlements:
- organization_id: resolved LUNA organization
- establishment_id: resolved LUNA establishment
- key: booking.enabled
- enabled: true

booking_settings:
- enabled: true
- confirmation_mode: MANUAL or explicit pilot choice
- slot_interval_minutes: 15
- minimum_advance_minutes: configurable
- maximum_advance_days: configurable
- maximum_online_party_size: configurable
- establishment timezone inherited from LUNA
```

Do not hardcode LUNA IDs.

Do not hardcode production opening times in domain code.

Seed service periods should be clearly identified as development data and easy to modify.

---

## 26. Deployment requirements

### 26.1 Independent application

`apps/booking-web` must:

- build independently;
- deploy independently;
- use cloud server-only database access;
- contain no authenticated back-office bundle;
- expose health and error diagnostics according to repository conventions;
- support the production hostname `reservation.yutapro.fr`;
- support local slug testing.

### 26.2 Environment configuration

Use existing environment validation conventions.

Likely required configuration:

```text
CLOUD_DATABASE_URL
PUBLIC_BOOKING_BASE_URL
EMAIL provider configuration when implemented
rate-limit provider configuration when implemented
application logging/monitoring configuration
```

Do not expose server secrets through `NEXT_PUBLIC_*` variables.

### 26.3 Local development

Support an explicit development URL such as:

```text
http://localhost:<port>/luna
```

Do not add a production fallback that silently resolves unknown establishments to LUNA.

---

## 27. Required implementation order

Codex should execute in this order unless repository constraints justify a documented adjustment.

### Step 1 — Inspect

- inspect repository;
- compare with canonical database context;
- produce implementation map;
- identify reusable infrastructure.

### Step 2 — Domain contracts

- booking enums;
- Zod contracts;
- domain errors;
- lifecycle rules;
- package exports;
- unit tests.

### Step 3 — Cloud schema

- add booking tables;
- add relations;
- add indexes and constraints;
- add development reset/push compatibility according to repository strategy;
- add integration fixtures.

### Step 4 — Tenant-safe repositories

- public establishment resolver;
- booking settings repository;
- service period repository;
- exception repository;
- reservation repository;
- history and notes repositories;
- scope tests.

### Step 5 — Availability engine

- weekly schedule;
- exceptions;
- booking horizon;
- capacity calculation;
- timezone handling;
- unit and integration tests.

### Step 6 — Reservation transaction

- slot revalidation;
- concurrency protection;
- idempotency;
- reservation number;
- public token generation and hashing;
- status history;
- event creation;
- concurrency tests.

### Step 7 — Back-office minimum

- reservation list;
- reservation details;
- manual creation;
- lifecycle actions;
- booking settings;
- service periods;
- exceptions;
- permission checks.

### Step 8 — Public app

- independent app shell;
- slug route;
- public presentation;
- booking flow;
- availability API;
- creation API;
- confirmation state;
- public reservation page;
- cancellation.

### Step 9 — Notifications

- provider-neutral events;
- French email templates;
- failure handling;
- delivery recording;
- post-commit behavior.

### Step 10 — Hardening

- rate limiting;
- duplicate protection;
- secure headers;
- logs and metrics;
- privacy review;
- accessibility review;
- SEO/noindex;
- E2E tests.

### Step 11 — Pilot readiness

- seed/configure LUNA;
- verify full workflow;
- verify tenant isolation;
- verify concurrency;
- document operation and known limitations.

---

## 28. Stop gates

Codex must stop the relevant milestone and report the problem when any of these occur:

- executable schema contradicts the canonical organization/establishment model;
- no secure authenticated establishment context exists for back-office operations;
- current session implementation trusts browser scope;
- repository has no safe way to perform transactional concurrency control;
- adding booking would require changing unrelated database ownership boundaries;
- public tokens would need to be stored raw;
- notification implementation would run before transaction commit;
- implementation would require speculative Phase 2+ architecture;
- an existing package already owns the same responsibility and duplication would be likely.

A stop gate applies only to the conflicting milestone. Codex should still complete safe independent work when possible.

---

## 29. Forbidden implementations

Codex must not:

- create `tenants` or `tenant_id`;
- add organization or establishment IDs directly to `users`;
- create an independent booking tenant resolver that bypasses `packages/tenant`;
- hardcode LUNA identity in domain logic;
- trust public `organizationId` or `establishmentId`;
- trust authenticated scope only from client state or localStorage;
- query a reservation by ID without organization and establishment predicates;
- expose raw public tokens in logs or database storage;
- generate predictable reservation-management URLs;
- use availability shown to the client as final authority;
- implement read-then-insert reservation creation without concurrency protection;
- send email inside an uncommitted database transaction;
- fail a committed reservation because email failed;
- implement unrestricted status editing;
- let `YUTA_ADMIN` or `YUTA_SUPPORT` silently bypass membership;
- index private reservation pages;
- include guest PII in metrics;
- implement Phase 2–7 features;
- refactor unrelated modules without necessity;
- introduce broad infrastructure merely to support one MVP action;
- create empty future tables for tables, floor plans, waitlist or SMS;
- add a custom-domain workflow in Phase 1;
- silently change current authentication, tenant or database architecture.

---

## 30. Phase 0 acceptance criteria

Phase 0 is complete only when:

- [ ] `apps/booking-web` exists and builds independently;
- [ ] booking domain contracts compile;
- [ ] booking schema belongs to `packages/db-cloud`;
- [ ] all booking-owned records are scoped by organization and establishment;
- [ ] public establishment resolution works from globally unique slug;
- [ ] unknown or inactive establishment fails closed;
- [ ] missing `booking.enabled` entitlement fails closed;
- [ ] disabled booking settings fail closed;
- [ ] public DTOs expose no private establishment fields;
- [ ] booking repository interfaces require explicit scope;
- [ ] baseline tenant-isolation tests pass;
- [ ] typed public errors exist;
- [ ] observability avoids guest PII;
- [ ] development LUNA configuration is idempotent and not hardcoded by ID;
- [ ] no Phase 2+ feature is implemented.

---

## 31. Phase 1 acceptance criteria

Phase 1 is complete only when:

### Public flow

- [ ] a guest can open an enabled establishment booking page by slug;
- [ ] the page is usable on mobile;
- [ ] French copy is complete;
- [ ] the guest can choose party size, date and offered slot;
- [ ] the guest can submit required contact information;
- [ ] automatic mode creates a confirmed reservation;
- [ ] manual mode creates a pending reservation;
- [ ] the guest receives a secure management URL;
- [ ] the guest can view current reservation status;
- [ ] the guest can cancel when policy allows;
- [ ] private reservation pages are noindex;
- [ ] stale slots return a controlled conflict and refreshed alternatives.

### Availability and integrity

- [ ] weekly service periods are applied;
- [ ] booking horizon is applied;
- [ ] maximum party size is applied;
- [ ] closures and blocked slots are applied;
- [ ] pending and confirmed reservations consume configured capacity;
- [ ] the establishment timezone is authoritative;
- [ ] two concurrent requests cannot overbook final capacity;
- [ ] duplicate submission does not create duplicate reservations;
- [ ] raw public tokens are not stored;
- [ ] all lifecycle transitions append history.

### Back-office

- [ ] staff can view reservations for the active establishment;
- [ ] staff cannot view another establishment's reservations;
- [ ] staff can manually create a reservation;
- [ ] staff can edit guest and scheduling data with validation;
- [ ] staff can confirm, decline and cancel;
- [ ] staff can mark seated, completed and no-show;
- [ ] staff can add internal notes;
- [ ] authorized users can edit booking settings;
- [ ] authorized users can manage weekly service periods;
- [ ] authorized users can manage date exceptions;
- [ ] establishment switching does not leak cached reservation data.

### Operations and security

- [ ] public creation is rate-limited;
- [ ] public input is validated with Zod;
- [ ] server errors are controlled and observable;
- [ ] guest PII is excluded from metrics and generic logs;
- [ ] email failure does not roll back committed reservations;
- [ ] required email events are produced;
- [ ] tenant-isolation tests pass;
- [ ] concurrency tests pass;
- [ ] public and back-office E2E flows pass;
- [ ] no excluded feature is implemented.

---

## 32. Expected Codex completion report

At the end of each milestone, Codex must report:

1. milestone completed;
2. files created;
3. files modified;
4. repository conventions discovered and reused;
5. schema changes;
6. security decisions;
7. concurrency strategy;
8. scope and permission enforcement;
9. tests added;
10. commands run and results;
11. known limitations;
12. repository/specification mismatches;
13. deferred items;
14. confirmation that Phase 2+ work was not implemented.

At final completion, also report:

- deployment configuration for `apps/booking-web`;
- required environment variables;
- LUNA pilot configuration;
- operational workflow for restaurant staff;
- public URLs and back-office routes;
- notification behavior;
- monitoring signals;
- any manual production setup still required.

---

## 33. Recommended Codex instruction

Use this prompt with the three reference documents:

```text
Read these documents in this order:

1. YUTA_CURRENT_DATABASE_CONTEXT_FOR_AI.md
2. YUTA_POST_LOGIN_ESTABLISHMENT_SELECTION_SPEC.md
3. YUTA_PUBLIC_BOOKING_APP_MASTER_SPEC.md
4. YUTA_PUBLIC_BOOKING_PHASE_0_1_IMPLEMENTATION_SPEC.md

Use the current executable Drizzle schemas and repository implementation as the
technical source of truth. The master booking document defines the long-term
product vision. The Phase 0–1 document defines the only implementation scope
authorized now.

Implement incrementally by milestone. First inspect the repository and produce
an implementation map. Do not create a tenants table or tenant_id. Booking data
belongs to packages/db-cloud and must be scoped by organization_id plus
establishment_id. Public scope is resolved from establishment slug. Authenticated
scope comes from the validated active establishment session.

Do not implement Phase 2 or later features. Do not add speculative tables or
empty abstractions for waitlist, SMS, tables, floor plans, custom domains,
external booking integrations, analytics or AI optimization.

For every milestone, add tests, report repository differences, and preserve the
existing architecture unless a change is strictly required and explicitly
reported.
```

---

## 34. Final implementation principle

> Build the smallest reliable booking product that LUNA can operate in real conditions, while preserving YUTA's organization-and-establishment isolation model and leaving future phases possible without implementing them early.

Phase 0 establishes the correct boundaries. Phase 1 proves the complete guest-to-restaurant workflow.
