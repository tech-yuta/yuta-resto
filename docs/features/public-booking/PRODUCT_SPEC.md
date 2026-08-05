# YUTA Public Booking App — Master Product & Technical Specification

Status: Current product reference

Owner: YUTA product and engineering

Last updated: 2026-08-05

Authority: `docs/features/public-booking/README.md` for implemented behavior

**Document status:** Master specification  
**Target readers:** Codex, technical lead, frontend/backend developers, product designer, QA  
**Project:** YUTA  
**Application:** Public restaurant booking  
**Primary language of the product:** French  
**Documentation language:** English  

---

## 1. Document purpose

This document defines the complete product and technical vision for the YUTA public booking application, from the first MVP to advanced future phases.

It must allow Codex and future developers to understand:

- why this application exists;
- how it fits into the YUTA ecosystem;
- how public visitors create, view, modify, and cancel reservations;
- how restaurant teams configure availability and manage reservations;
- how multi-tenancy must be enforced;
- how the application should evolve without requiring a major rewrite;
- which features belong to each delivery phase;
- which implementation shortcuts are acceptable in the MVP;
- which architectural decisions are mandatory from the beginning.

This is a master specification. Individual implementation tickets may refine details, but they must not contradict the principles defined here.

---

## 2. Product vision

YUTA provides each restaurant with a branded public booking experience that can be linked from:

- Google Business Profile;
- the restaurant website;
- Facebook;
- Instagram;
- TikTok;
- QR codes;
- email campaigns;
- other digital channels.

The public page must feel like the restaurant's own booking page, not like a generic marketplace.

The system must remain simple for the guest and operationally useful for the restaurant.

The long-term product must support:

- multiple organizations;
- multiple establishments per organization;
- configurable booking rules per establishment;
- automatic or manual confirmation;
- multiple service periods;
- exceptional closures and special schedules;
- capacity-based availability;
- later table assignment and floor plans;
- notification workflows;
- source attribution and analytics;
- multilingual public pages;
- embeddable widgets;
- custom domains;
- Google booking integrations;
- waitlists;
- group and event enquiries;
- intelligent operational recommendations.

---

## 3. Position inside the YUTA ecosystem

The public booking application must be implemented as a separate deployable application inside the YUTA monorepo.

Recommended structure:

```text
apps/
├── web/                 # Public marketing website for YUTA
├── app/                 # Restaurant back-office
├── admin/               # YUTA super-admin
└── booking-web/         # Public booking application

packages/
├── db/                  # Database schema and data access
├── tenant/              # Tenant and establishment resolution
├── contracts/           # Shared API contracts and domain types
├── ui/                  # Shared design system
├── booking/             # Booking domain logic
├── notifications/       # Email/SMS notification abstractions
└── observability/       # Logging, monitoring, tracing helpers
```

### 3.1 Why it must be a separate application

The booking application has different constraints from the YUTA marketing site and the restaurant back-office:

- it is public and does not require login;
- it must load quickly on mobile devices;
- it may receive traffic spikes;
- it requires SEO and social preview metadata;
- it may later be embedded on external websites;
- it requires public abuse protection;
- it has an independent deployment lifecycle;
- it must resolve a restaurant before rendering the page;
- it must remain usable even when restaurant staff are not logged in.

The booking application may share packages, database, infrastructure, and design primitives with other YUTA applications, but its runtime and deployment must remain independent.

---

## 4. Domain and URL strategy

### 4.1 MVP domain

Use one shared public booking domain:

```text
reservation.yutapro.fr
```

Each establishment is identified by a unique public slug:

```text
reservation.yutapro.fr/luna
reservation.yutapro.fr/restaurant-abc
```

Recommended route format:

```text
/[establishmentSlug]
/[establishmentSlug]/confirmation/[publicToken]
/[establishmentSlug]/reservation/[publicToken]
```

### 4.2 Future subdomain support

Later, the platform may support:

```text
luna.reservation.yutapro.fr
restaurant-abc.reservation.yutapro.fr
```

### 4.3 Future custom domain support

Later phases may allow:

```text
reservation.restaurant-domain.fr
reserver.restaurant-domain.fr
```

### 4.4 Mandatory design decision

The application must resolve an establishment through a centralized tenant-resolution mechanism. Public routes must never rely on hardcoded restaurant identifiers.

The establishment record must include at least:

```ts
interface EstablishmentPublicIdentity {
  id: string;
  organizationId: string;
  slug: string;
  bookingEnabled: boolean;
  bookingCustomDomain?: string | null;
}
```

The slug must be unique across the full platform unless the final routing strategy explicitly scopes it by organization.

For the MVP, global uniqueness is preferred because it simplifies routing.

---

## 5. Core user roles

### 5.1 Guest

A public visitor who can:

- check available dates and time slots;
- create a reservation;
- receive confirmation or pending status;
- view the reservation through a secure public link;
- cancel the reservation;
- later request a modification;
- later join a waitlist;
- later create a group or event enquiry.

No account is required.

### 5.2 Restaurant team member

An authenticated back-office user who can, depending on permissions:

- view the reservation calendar;
- create a reservation manually;
- confirm or decline pending reservations;
- edit reservation details;
- cancel reservations;
- mark arrivals, completions, or no-shows;
- configure booking rules;
- define closures and exceptions;
- manage public booking page branding;
- review booking source analytics;
- later manage tables and floor plans.

### 5.3 Organization administrator

Can manage booking settings for all establishments inside the organization, subject to role permissions.

### 5.4 YUTA super-admin

Can:

- enable or disable the booking module;
- troubleshoot tenant configuration;
- view technical logs and audit trails;
- manage global feature flags;
- manage reserved slugs or domains;
- support restaurants without accessing unnecessary guest data.

---

## 6. Product principles

The following principles are mandatory.

### 6.1 Mobile-first

Most guests will access the page from a phone after clicking Google or social media links.

The complete booking flow must work comfortably on small screens.

### 6.2 Minimum friction

The booking flow should require no more than four conceptual steps:

1. party size;
2. date and time;
3. guest details;
4. confirmation.

### 6.3 Restaurant-branded experience

The restaurant identity is primary. YUTA branding is secondary and discreet.

### 6.4 Server-authoritative availability

Availability displayed on the client is informative only. The server must revalidate availability inside the reservation creation transaction.

### 6.5 Progressive complexity

The MVP must use capacity by time slot and service period. It must not require automatic table allocation.

The architecture, however, must not prevent future table-level inventory.

### 6.6 Multi-tenant isolation

Every write and every authenticated read must be scoped by organization and establishment.

### 6.7 Explainable reservation states

The guest and the restaurant must always understand whether a reservation is:

- pending;
- confirmed;
- declined;
- cancelled;
- seated;
- completed;
- no-show.

### 6.8 Operational override

Restaurant staff must always be able to manually create or adjust a reservation, subject to explicit warnings and permissions.

---

## 7. Scope by product phase

## 7.1 Phase 0 — Foundation

This phase prepares the architecture before launching the public booking flow.

### Objectives

- create `apps/booking-web`;
- define shared booking contracts;
- add booking feature flags;
- implement public establishment resolution;
- implement tenant-safe data access;
- establish public error handling;
- prepare email notification abstraction;
- configure observability and audit logging;
- define database schema without legacy constraints.

### Deliverables

- deployable empty booking application;
- restaurant slug resolution;
- public establishment metadata endpoint;
- shared domain types;
- feature flag per establishment;
- baseline tests.

### Acceptance criteria

- an enabled establishment slug resolves successfully;
- a disabled or unknown slug returns a safe public 404 state;
- no private establishment fields are exposed;
- all domain queries require explicit establishment scope.

---

## 7.2 Phase 1 — Public booking MVP

This is the first production-usable version.

### Public guest features

- public restaurant booking page;
- restaurant branding and basic information;
- party-size selection;
- date selection;
- available time-slot selection;
- guest name;
- guest phone number;
- optional email;
- optional note;
- special requirements;
- creation of reservation;
- automatic or manual confirmation;
- confirmation page;
- secure public reservation page;
- guest cancellation;
- French language;
- mobile responsive UI;
- basic SEO and sharing metadata.

### Back-office features

- reservation list;
- day and week views;
- manual reservation creation;
- reservation detail panel;
- confirm pending reservation;
- decline pending reservation;
- cancel reservation;
- update guest information;
- mark reservation as seated;
- mark reservation as completed;
- mark reservation as no-show;
- booking settings;
- weekly service periods;
- slot interval configuration;
- online capacity configuration;
- minimum advance time;
- maximum advance days;
- maximum online party size;
- automatic or manual confirmation mode;
- exceptional closures and blocked slots;
- email confirmation.

### Explicit MVP simplifications

The MVP must not require:

- floor-plan editing;
- table assignment;
- automatic table optimization;
- waitlist;
- SMS;
- custom domains;
- embeddable widget;
- automated Google integration;
- predictive no-show scoring;
- advanced revenue analytics;
- guest account creation.

### MVP acceptance criteria

A guest can successfully create a reservation for an available slot, receive the correct status, view it through a secure link, and cancel it.

A restaurant user can configure weekly availability, apply a closure, view the reservation, and update its lifecycle status.

The system must prevent two concurrent requests from overbooking the final available capacity.

---

## 7.3 Phase 2 — Communication and conversion

### Public features

- SMS confirmation;
- automated reminders;
- confirmation resend;
- guest modification request;
- alternative time suggestions;
- multilingual interface;
- optional email verification;
- optional phone verification;
- configurable cancellation deadline;
- configurable late-arrival policy;
- branded message templates.

### Back-office features

- notification timeline;
- resend confirmation;
- approve or reject modification requests;
- communication preferences;
- source attribution dashboard;
- conversion tracking;
- configurable reminder schedules;
- per-establishment message templates.

### Acceptance criteria

- restaurant staff can identify how a guest reached the booking page;
- guests receive scheduled reminders according to establishment settings;
- modification requests do not silently alter confirmed reservations without restaurant approval unless the establishment explicitly enables self-service modification.

---

## 7.4 Phase 3 — Waitlist and demand management

### Features

- waitlist by date, service, party size, and preferred time range;
- guest waitlist registration;
- automatic or manual invitation when capacity becomes available;
- invitation expiry;
- alternative slot recommendations;
- restaurant waitlist board;
- conversion from waitlist to reservation;
- waitlist analytics;
- service-level capacity controls;
- booking pacing controls.

### Design principle

A waitlist entry is not a reservation and must never consume confirmed capacity before conversion.

---

## 7.5 Phase 4 — Table and floor-plan management

### Features

- dining areas;
- floor plans;
- table definitions;
- table capacities;
- table combinations;
- accessibility attributes;
- indoor/outdoor attributes;
- manual table assignment;
- suggested table assignment;
- conflict detection;
- table occupancy timeline;
- reservation duration rules;
- turn-time management;
- controlled overbooking rules.

### Important architectural note

The MVP capacity model must be implemented so that table-level inventory can be introduced later without changing public reservation identifiers or reservation lifecycle states.

### Recommended strategy

Introduce table assignments as a separate domain:

```text
reservation_table_assignments
restaurant_areas
restaurant_tables
table_combinations
```

Do not embed table IDs directly as mandatory fields on the initial reservation record.

---

## 7.6 Phase 5 — Website embedding and custom branding

### Features

- embeddable booking widget;
- JavaScript SDK or iframe integration;
- custom booking button;
- custom domain;
- advanced theme configuration;
- white-label options;
- automatic height resizing for iframe;
- cross-origin event communication;
- conversion event callbacks.

### Security requirements

- strict origin validation;
- content security policy;
- anti-clickjacking policy adjusted only for approved embedding modes;
- no exposure of private API credentials;
- rate limiting remains server-side.

---

## 7.7 Phase 6 — External ecosystem integrations

### Potential integrations

- Google Business Profile booking link;
- Google booking provider integration, subject to eligibility;
- Meta profile links;
- restaurant website CMS plugins;
- calendar export;
- email marketing platforms;
- customer relationship tools;
- business intelligence exports;
- automation webhooks.

### Integration principle

External providers must use adapters. Core booking logic must not depend directly on a single provider SDK.

Recommended package structure:

```text
packages/booking-integrations/
├── google/
├── meta/
├── calendar/
└── webhooks/
```

---

## 7.8 Phase 7 — Intelligence and optimization

### Potential features

- no-show risk indicators;
- intelligent alternative slot recommendations;
- demand forecasts;
- suggested capacity adjustments;
- suggested reservation duration;
- automatic table assignment recommendations;
- service pacing recommendations;
- anomaly detection;
- natural-language operational summaries;
- assistance processing special requests.

### Guardrail

Recommendations must remain explainable and overrideable by restaurant staff.

The system must not silently change confirmed reservations based only on a prediction.

---

## 8. Public guest journey

## 8.1 Page entry

The guest opens:

```text
https://reservation.yutapro.fr/{establishmentSlug}
```

The server resolves the establishment and loads:

- public name;
- logo;
- cover image;
- public address;
- public phone number;
- timezone;
- booking settings;
- theme;
- public booking policy;
- supported locales;
- feature flags.

If booking is disabled, show a branded unavailable state with the restaurant's contact details when permitted.

## 8.2 Step 1 — Party size

Recommended controls:

- quick buttons for 1 to 6 guests;
- increment/decrement control;
- large-party path when above the online threshold.

If the requested party size exceeds `maximumOnlinePartySize`, show one of the configured alternatives:

- contact the restaurant;
- submit a group request;
- join a waiting list;
- display a custom explanation.

The system must not simply display a generic error.

## 8.3 Step 2 — Date and time

The guest selects a date within the allowed booking horizon.

The application requests availability using:

- establishment ID resolved server-side;
- local date;
- party size;
- optional service period;
- optional area preference in later phases.

The interface should group slots by service period, for example:

```text
Déjeuner
11:30  11:45  12:00  12:15

Dîner
18:30  18:45  19:00  19:15
```

The UI must not reveal exact remaining capacity unless the restaurant explicitly enables such messaging.

Preferred labels:

- available;
- limited availability;
- unavailable;
- contact restaurant.

## 8.4 Step 3 — Guest information

Required fields:

- full name;
- phone number;
- acceptance of booking policy and privacy information.

Optional fields:

- email;
- note;
- locale;
- high chair;
- stroller;
- reduced mobility access;
- allergies or dietary restrictions;
- celebration;
- area preference in later phases.

All fields must be configurable where appropriate, but the MVP may use a fixed safe subset.

## 8.5 Step 4 — Confirmation

Before submission, show a clear summary:

- restaurant;
- date;
- local time;
- party size;
- guest name;
- contact information;
- important policy information.

After submission, return one of two primary outcomes.

### Confirmed

The reservation is accepted immediately.

### Pending

The request is recorded but requires restaurant confirmation.

The wording must never imply confirmation when the reservation is pending.

## 8.6 Public reservation management

The guest receives a secure public URL:

```text
/{establishmentSlug}/reservation/{publicToken}
```

The page may allow:

- viewing reservation information;
- cancellation;
- later modification request;
- later calendar download;
- later contact with the restaurant.

The public token must be unguessable and revocable.

---

## 9. Availability model

## 9.1 MVP availability model

The MVP uses capacity by time slot, not physical table inventory.

For each service period, the establishment defines:

- start time;
- end time;
- slot interval;
- online capacity;
- enabled days;
- optional capacity overrides.

Example:

```text
Dinner service: 18:30–21:30
Slot interval: 15 minutes
Online capacity per slot: 20 guests
```

## 9.2 Capacity consumption

By default, these statuses consume capacity:

- pending, when manual confirmation reserves inventory;
- confirmed;
- seated.

These statuses do not consume capacity:

- declined;
- cancelled;
- completed;
- no-show, after status transition;
- expired pending request, if expiration is implemented.

Whether pending reservations consume capacity must be explicit in the booking configuration.

Recommended MVP behavior: pending reservations consume capacity to avoid accepting overlapping requests.

## 9.3 Capacity calculation

For a requested slot:

```text
availableCapacity = configuredCapacity - activeReservedPartySize
```

The slot is available when:

```text
availableCapacity >= requestedPartySize
```

Later phases may use duration windows instead of one-slot-only capacity.

## 9.4 Reservation duration

The MVP may store `defaultDurationMinutes` without using full interval-overlap logic initially.

However, the data model should include:

- `startAt`;
- `expectedEndAt` or duration;
- establishment timezone.

This allows later transition to occupancy-window calculations.

## 9.5 Concurrency control

Reservation creation must occur in a database transaction.

The server must:

1. resolve establishment;
2. validate input;
3. lock or safely serialize the relevant inventory scope;
4. recalculate capacity;
5. reject if capacity is insufficient;
6. create the reservation;
7. write status history;
8. commit;
9. send notifications after commit.

Do not send notifications before the transaction is committed.

Possible implementation strategies:

- transactional advisory locks;
- row-level locking on inventory rows;
- atomic capacity counters;
- serializable transaction where appropriate.

The final strategy must be documented in code.

---

## 10. Booking configuration model

Each establishment must have independent settings.

Recommended configuration fields:

```ts
interface BookingSettings {
  establishmentId: string;
  enabled: boolean;
  defaultLocale: string;
  supportedLocales: string[];
  timezone: string;

  slotIntervalMinutes: number;
  minimumAdvanceMinutes: number;
  maximumAdvanceDays: number;
  maximumOnlinePartySize: number;
  minimumOnlinePartySize: number;

  confirmationMode: "automatic" | "manual";
  pendingConsumesCapacity: boolean;
  defaultDurationMinutes: number;
  lateArrivalToleranceMinutes: number;

  cancellationEnabled: boolean;
  cancellationDeadlineMinutes?: number | null;
  modificationRequestEnabled: boolean;

  guestEmailRequired: boolean;
  guestPhoneRequired: boolean;

  showRemainingAvailability: boolean;
  bookingPolicyI18n?: LocalizedText | null;
  confirmationMessageI18n?: LocalizedText | null;
}
```

Not every field must be exposed in the first UI, but the model should be extensible.

---

## 11. Weekly service periods

A service period represents a bookable operating interval, such as lunch or dinner.

Recommended structure:

```ts
interface BookingServicePeriod {
  id: string;
  establishmentId: string;
  dayOfWeek: number;
  code: string;
  nameI18n: LocalizedText;
  startTime: string;
  endTime: string;
  slotIntervalMinutes?: number | null;
  onlineCapacity: number;
  enabled: boolean;
}
```

Examples:

```text
Monday lunch: 11:30–13:30
Monday dinner: 18:30–21:00
```

A day may contain zero, one, or multiple service periods.

Service periods must use the establishment's local timezone.

---

## 12. Exceptions and closures

Exceptions override normal weekly rules.

Supported types should include:

- full-day closure;
- partial closure;
- blocked service period;
- blocked time slot;
- special opening hours;
- capacity override;
- special event;
- private event;
- temporarily disabled online booking.

Recommended model:

```ts
interface BookingException {
  id: string;
  establishmentId: string;
  date: string;
  type:
    | "closed_day"
    | "closed_interval"
    | "special_hours"
    | "capacity_override"
    | "private_event"
    | "online_booking_disabled";
  startTime?: string | null;
  endTime?: string | null;
  capacity?: number | null;
  reason?: string | null;
  publicMessageI18n?: LocalizedText | null;
}
```

Exception evaluation must be centralized in the booking domain package, not duplicated between frontend and backend.

---

## 13. Reservation lifecycle

Recommended statuses:

```ts
type ReservationStatus =
  | "pending"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "seated"
  | "completed"
  | "no_show";
```

Optional future statuses:

```text
expired
modification_requested
waitlisted
```

### 13.1 Allowed transitions

Recommended base transitions:

```text
pending -> confirmed
pending -> declined
pending -> cancelled

confirmed -> cancelled
confirmed -> seated
confirmed -> no_show

seated -> completed
seated -> cancelled only with elevated permission and audit reason
```

Invalid transitions must be rejected by domain logic.

### 13.2 Status history

Every status change must be recorded with:

- previous status;
- new status;
- actor type;
- actor user ID when authenticated;
- source;
- timestamp;
- optional reason;
- optional metadata.

---

## 14. Data model

The exact SQL schema may evolve, but the following conceptual entities are required.

## 14.1 `booking_settings`

One record per establishment.

Key fields:

- `establishment_id`;
- `enabled`;
- `timezone`;
- booking horizon settings;
- confirmation mode;
- cancellation rules;
- notification rules;
- default duration;
- locale settings.

## 14.2 `booking_service_periods`

Stores weekly recurring service periods.

## 14.3 `booking_exceptions`

Stores date-specific overrides.

## 14.4 `reservations`

Recommended fields:

```ts
interface Reservation {
  id: string;
  organizationId: string;
  establishmentId: string;

  reservationNumber: string;
  publicTokenHash: string;

  localDate: string;
  startAt: Date;
  expectedEndAt?: Date | null;
  timezone: string;
  partySize: number;

  guestName: string;
  guestPhone: string;
  guestEmail?: string | null;
  guestLocale?: string | null;

  note?: string | null;
  specialRequirements?: Record<string, unknown> | null;

  source: ReservationSource;
  sourceDetail?: string | null;
  campaign?: string | null;

  status: ReservationStatus;
  confirmationMode: "automatic" | "manual";

  cancellationReason?: string | null;
  internalNote?: string | null;

  createdAt: Date;
  updatedAt: Date;
}
```

### Mandatory denormalized scope fields

Both `organizationId` and `establishmentId` must be stored directly on the reservation.

This provides:

- clear tenant boundaries;
- faster scoped queries;
- safer authorization;
- easier reporting;
- simpler archival and export.

## 14.5 `reservation_status_history`

Stores all lifecycle transitions.

## 14.6 `reservation_events`

Optional but recommended for an event timeline:

- reservation created;
- email sent;
- SMS sent;
- viewed by guest;
- cancelled by guest;
- reminder sent;
- edited by staff;
- modification requested.

## 14.7 `reservation_contacts`

Not required for MVP. Guest contact data may initially live on the reservation.

A separate guest/customer profile system can be introduced later, with careful privacy controls and deduplication.

## 14.8 Future entities

```text
waitlist_entries
restaurant_areas
restaurant_tables
table_combinations
reservation_table_assignments
booking_message_templates
booking_notification_jobs
booking_webhook_deliveries
booking_source_attributions
```

---

## 15. Reservation identifiers

Each reservation needs three distinct identifiers.

### Internal ID

UUID or equivalent primary key.

### Human-readable reservation number

Example:

```text
LU-8K42P
```

Requirements:

- short enough for phone communication;
- not used for authorization;
- unique within a reasonable scope;
- not sequential in a way that leaks business volume.

### Public token

Used in guest management URLs.

Requirements:

- high entropy;
- unguessable;
- stored hashed when practical;
- revocable;
- never replace authorization with the human-readable number.

---

## 16. API architecture

Use shared request and response contracts from `packages/contracts`.

Do not duplicate validation schemas in multiple applications.

## 16.1 Public endpoints

Recommended routes:

```text
GET  /api/public/establishments/:slug
GET  /api/public/establishments/:slug/availability
POST /api/public/establishments/:slug/reservations
GET  /api/public/reservations/:publicToken
POST /api/public/reservations/:publicToken/cancel
POST /api/public/reservations/:publicToken/modification-request
```

The final URL shape may use route handlers or server actions, but the domain boundary must remain equivalent.

## 16.2 Back-office endpoints

Recommended routes:

```text
GET    /api/reservations
POST   /api/reservations
GET    /api/reservations/:id
PATCH  /api/reservations/:id
POST   /api/reservations/:id/confirm
POST   /api/reservations/:id/decline
POST   /api/reservations/:id/cancel
POST   /api/reservations/:id/seat
POST   /api/reservations/:id/complete
POST   /api/reservations/:id/no-show
```

Configuration endpoints:

```text
GET    /api/booking/settings
PATCH  /api/booking/settings
GET    /api/booking/service-periods
POST   /api/booking/service-periods
PATCH  /api/booking/service-periods/:id
DELETE /api/booking/service-periods/:id
GET    /api/booking/exceptions
POST   /api/booking/exceptions
PATCH  /api/booking/exceptions/:id
DELETE /api/booking/exceptions/:id
```

## 16.3 API rules

- validate every payload with Zod;
- resolve tenant scope server-side;
- never trust organization or establishment IDs supplied by public clients;
- use idempotency protection for reservation creation;
- return stable machine-readable error codes;
- avoid leaking private capacity data;
- apply rate limits to public endpoints;
- log security-relevant failures;
- generate notifications only after successful commit.

---

## 17. Shared contracts

Recommended shared schemas:

```text
PublicEstablishmentSchema
BookingAvailabilityQuerySchema
BookingAvailabilityResponseSchema
CreatePublicReservationSchema
CreatePublicReservationResponseSchema
PublicReservationSchema
CancelPublicReservationSchema
ReservationStatusSchema
BookingSettingsSchema
BookingServicePeriodSchema
BookingExceptionSchema
```

Each contract should define:

- input schema;
- output schema;
- TypeScript type;
- documented error codes.

Example error codes:

```text
ESTABLISHMENT_NOT_FOUND
BOOKING_DISABLED
DATE_OUTSIDE_BOOKING_HORIZON
PARTY_SIZE_NOT_ALLOWED
SLOT_NOT_AVAILABLE
RESERVATION_ALREADY_CANCELLED
CANCELLATION_DEADLINE_PASSED
INVALID_PUBLIC_TOKEN
RATE_LIMITED
VALIDATION_ERROR
```

---

## 18. Public UI structure

## 18.1 Main page

Recommended sections:

1. restaurant header;
2. compact restaurant information;
3. booking form;
4. address and map link;
5. opening information;
6. contact information;
7. booking policy;
8. privacy information;
9. discreet “Powered by YUTA” footer.

## 18.2 Booking form states

The UI must support:

- initial state;
- loading availability;
- no availability;
- alternative slot suggestions;
- validation errors;
- submission in progress;
- successful confirmed booking;
- successful pending request;
- expired or invalid public link;
- cancelled reservation;
- booking disabled.

## 18.3 Mobile behavior

- large touch targets;
- no horizontal scrolling;
- sticky action button where useful;
- date picker optimized for mobile;
- clear back navigation between steps;
- preserve entered data when navigating backward;
- avoid unnecessary modal stacking;
- maintain visible loading feedback.

## 18.4 Accessibility

Minimum requirements:

- semantic labels;
- keyboard support;
- visible focus states;
- sufficient contrast;
- screen-reader announcements for errors and status changes;
- no color-only availability meaning;
- locale-aware date and time labels.

---

## 19. Restaurant branding

Each establishment may configure:

- logo;
- cover image;
- primary color;
- accent color;
- button style within controlled options;
- restaurant name;
- short description;
- public address;
- phone number;
- map link;
- accessibility information;
- booking policy;
- social links;
- default locale;
- supported locales.

Theme configuration must use controlled design tokens. Do not allow arbitrary CSS in the MVP.

Recommended theme object:

```ts
interface BookingTheme {
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
  surfaceStyle?: "light" | "warm" | "neutral";
  borderRadius?: "small" | "medium" | "large";
}
```

---

## 20. Back-office information architecture

Recommended navigation:

```text
Réservations
├── Vue d’ensemble
├── Planning
├── Liste
├── Disponibilités
├── Fermetures et exceptions
├── Page de réservation
├── Notifications
└── Paramètres
```

### 20.1 Overview

Display:

- today's reservations;
- pending requests;
- expected guest count;
- arrivals soon;
- cancellations;
- no-shows;
- important exceptions;
- later source and conversion metrics.

### 20.2 Planning

Views:

- day;
- week;
- service period;
- later floor plan.

### 20.3 Reservation list

Filters:

- date range;
- status;
- service period;
- source;
- party size;
- guest name or phone;
- assigned area or table later.

### 20.4 Reservation details

Display:

- reservation summary;
- guest details;
- status;
- source;
- notes;
- special requirements;
- notification history;
- audit history;
- actions allowed by current status and permission.

### 20.5 Manual reservation creation

Restaurant users must be able to create reservations received by phone or other channels.

The form must allow source selection:

```text
phone
walk_in
backoffice
email
partner
other
```

Manual creation may allow an authorized user to exceed online capacity, but the UI must show a clear warning and record the override.

---

## 21. Source attribution

The system must prepare source tracking from the MVP.

Supported base sources:

```ts
type ReservationSource =
  | "public_booking_page"
  | "google"
  | "facebook"
  | "instagram"
  | "tiktok"
  | "website"
  | "qr_code"
  | "phone"
  | "walk_in"
  | "backoffice"
  | "partner"
  | "other";
```

Track standard campaign parameters when present:

- `utm_source`;
- `utm_medium`;
- `utm_campaign`;
- `utm_content`;
- referring domain.

Public links may use:

```text
https://reservation.yutapro.fr/luna?utm_source=google&utm_medium=organic
```

Attribution must be sanitized and length-limited before storage.

---

## 22. Notifications

## 22.1 MVP

Email notifications:

- guest confirmation;
- guest pending request acknowledgment;
- guest cancellation confirmation;
- restaurant notification for new pending request;
- restaurant notification for cancellation when appropriate.

## 22.2 Later phases

- SMS confirmations;
- reminder emails;
- reminder SMS;
- modification request notifications;
- waitlist invitations;
- no-show follow-up;
- internal daily summary.

## 22.3 Technical architecture

Notifications should be asynchronous after reservation transaction completion.

Recommended abstraction:

```ts
interface BookingNotificationService {
  sendReservationCreated(event: ReservationCreatedEvent): Promise<void>;
  sendReservationConfirmed(event: ReservationConfirmedEvent): Promise<void>;
  sendReservationCancelled(event: ReservationCancelledEvent): Promise<void>;
}
```

Use an outbox or durable job queue when production volume requires it.

Avoid coupling reservation creation directly to a specific email or SMS provider.

---

## 23. Security and abuse protection

Public booking endpoints require dedicated protection.

### 23.1 Required controls

- IP-based rate limiting;
- phone-based duplicate detection;
- email-based duplicate detection where relevant;
- idempotency keys;
- server-side validation;
- input length limits;
- HTML escaping;
- anti-automation challenge only when risk is detected;
- request logging;
- secure public tokens;
- CSRF protection where applicable;
- strict content security policy;
- secure headers;
- safe file and image handling;
- no private establishment fields in public responses.

### 23.2 CAPTCHA strategy

Do not force CAPTCHA for every guest by default.

Use risk-based or progressive protection:

- repeated submissions;
- suspicious request velocity;
- known malicious IP;
- invalid phone patterns;
- automation-like behavior.

### 23.3 Privacy

Collect only information necessary to manage the reservation.

The public form must provide clear privacy information and identify the relevant data controller/processor roles according to the final legal implementation.

The platform must support:

- retention rules;
- guest data export where required;
- deletion or anonymization workflows;
- restricted staff access;
- audit logging;
- minimized display of personal data in notifications and logs.

Do not put raw guest personal data in analytics events or application logs.

---

## 24. Multi-tenancy and authorization

### 24.1 Public context

The establishment is resolved from the route or validated custom domain.

Public clients must not submit trusted `organizationId` or `establishmentId` values.

### 24.2 Authenticated context

For back-office operations:

- derive current user;
- resolve active organization;
- resolve active establishment;
- verify membership;
- verify feature access;
- verify permission;
- scope the database query;
- reject cross-tenant identifiers even when they exist.

### 24.3 Recommended permissions

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
booking.manage_branding
booking.manage_notifications
booking.view_analytics
```

---

## 25. Timezone, date, and locale rules

The establishment timezone is authoritative.

Never rely on the browser timezone for reservation calculations.

Store timestamps in UTC and also preserve:

- establishment timezone;
- local reservation date;
- local display time when needed for stable historical rendering.

Use locale-aware formatting for guests and staff.

Important cases to test:

- daylight-saving transition;
- booking around midnight;
- guest in another timezone;
- establishment timezone change;
- future reservation created before DST change;
- exception dates.

---

## 26. SEO and public metadata

The main establishment booking page should support:

- indexable restaurant name and booking purpose when appropriate;
- canonical URL;
- title and description;
- Open Graph image;
- social sharing metadata;
- structured data where appropriate;
- noindex for private reservation management pages;
- no sensitive information in metadata.

Public reservation detail URLs must be `noindex` and should not be discoverable through sitemap generation.

---

## 27. Performance requirements

Target priorities:

- fast initial render on mobile;
- minimal JavaScript for the first view;
- optimized images;
- cached public establishment configuration;
- no caching of private reservation pages;
- efficient availability queries;
- resilient behavior under traffic spikes.

Recommended principles:

- server-render establishment shell;
- cache public branding/configuration with short invalidation strategy;
- calculate availability server-side;
- avoid loading back-office bundles in the public app;
- lazy-load nonessential maps and media;
- monitor p95 latency for availability and creation endpoints.

---

## 28. Observability and auditability

Log and measure:

- page load failures;
- availability request failures;
- reservation creation attempts;
- successful reservations;
- rejected overbooking attempts;
- duplicate submissions;
- notification failures;
- cancellations;
- invalid token access;
- rate-limit events;
- database transaction failures.

Recommended metrics:

```text
booking_page_views
booking_flow_started
booking_availability_requests
booking_slot_selected
booking_submission_attempts
booking_created_confirmed
booking_created_pending
booking_creation_failed
booking_cancelled
booking_no_show
booking_notification_failed
```

Do not include guest personal data in metric labels.

Audit logs must distinguish:

- guest action;
- restaurant user action;
- system automation;
- YUTA support action.

---

## 29. Error handling

Public errors must be understandable and safe.

Examples:

### Slot unavailable

The selected time is no longer available. Offer refreshed alternatives.

### Booking disabled

Explain that online booking is temporarily unavailable and show restaurant contact details when configured.

### Invalid token

Do not reveal whether a reservation exists. Show a generic invalid or expired link state.

### Rate limited

Ask the guest to try again later or contact the restaurant.

### Notification failure

If the reservation is successfully committed but notification fails, do not report reservation creation as failed. Show the reservation number and allow confirmation resend later.

---

## 30. Testing strategy

## 30.1 Unit tests

Test:

- slot generation;
- booking horizon;
- capacity calculation;
- exception precedence;
- status transitions;
- cancellation rules;
- source normalization;
- public token validation;
- timezone conversion;
- permission checks.

## 30.2 Integration tests

Test:

- public establishment resolution;
- availability endpoint;
- transactional reservation creation;
- overbooking prevention;
- manual confirmation;
- guest cancellation;
- notification event creation;
- tenant isolation.

## 30.3 End-to-end tests

Core scenarios:

1. guest creates automatically confirmed reservation;
2. guest creates pending reservation;
3. restaurant confirms pending reservation;
4. guest cancels confirmed reservation;
5. exception closes a normally open service;
6. last capacity is requested concurrently by two guests;
7. public token is invalid;
8. booking is disabled;
9. mobile booking flow completes successfully;
10. restaurant user cannot access another establishment's reservation.

## 30.4 Load and concurrency tests

Before broader launch, test:

- repeated availability reads;
- concurrent final-capacity reservation attempts;
- traffic spikes after campaigns;
- notification queue backlogs;
- database lock behavior.

---

## 31. Suggested code architecture

Recommended package responsibilities:

```text
packages/booking/
├── domain/
│   ├── availability.ts
│   ├── reservation-status.ts
│   ├── booking-rules.ts
│   ├── exceptions.ts
│   └── errors.ts
├── application/
│   ├── create-reservation.ts
│   ├── cancel-reservation.ts
│   ├── confirm-reservation.ts
│   ├── get-availability.ts
│   └── update-reservation.ts
├── infrastructure/
│   ├── reservation-repository.ts
│   ├── booking-settings-repository.ts
│   ├── capacity-lock.ts
│   └── event-publisher.ts
└── index.ts
```

### Architectural rule

Business rules must live in `packages/booking`, not inside React components or route handlers.

Route handlers should:

1. parse request;
2. resolve context;
3. validate input;
4. call application service;
5. map result or domain error to response.

---

## 32. Suggested route structure for `apps/booking-web`

```text
apps/booking-web/
├── app/
│   ├── [establishmentSlug]/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── reservation/
│   │   │   └── [publicToken]/page.tsx
│   │   └── confirmation/
│   │       └── [publicToken]/page.tsx
│   ├── api/
│   │   └── public/
│   │       ├── establishments/
│   │       ├── availability/
│   │       └── reservations/
│   ├── not-found.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── booking-flow/
│   ├── restaurant-header/
│   ├── reservation-summary/
│   └── public-status/
├── lib/
│   ├── public-establishment.ts
│   ├── analytics.ts
│   ├── rate-limit.ts
│   └── metadata.ts
└── tests/
```

The exact structure may follow existing monorepo conventions, but separation of concerns must remain clear.

---

## 33. Feature flags

Recommended flags:

```text
booking.enabled
booking.manual_confirmation
booking.guest_cancellation
booking.guest_modification
booking.sms_notifications
booking.waitlist
booking.table_management
booking.embed_widget
booking.custom_domain
booking.multilingual
booking.analytics
```

Feature flags should be evaluated per establishment where appropriate.

The public UI must not display disabled capabilities.

---

## 34. Migration and rollout strategy

Because the current YUTA platform is still under development, the booking schema may be introduced cleanly without preserving unnecessary legacy structures.

Recommended rollout:

1. implement schema and domain package;
2. deploy booking app behind feature flag;
3. configure one internal pilot establishment;
4. test staff workflows;
5. test public booking with limited opening hours;
6. validate notification reliability;
7. enable live public links;
8. review operational data;
9. improve before onboarding additional restaurants.

Do not enable all establishments by default.

---

## 35. MVP implementation sequence for Codex

Recommended order:

### Step 1 — Domain and schema

- define booking statuses;
- define settings;
- define service periods;
- define exceptions;
- define reservations;
- define status history;
- define source attribution;
- generate database access layer.

### Step 2 — Tenant-safe services

- public slug resolver;
- authenticated establishment context;
- scoped repositories;
- permission checks.

### Step 3 — Availability engine

- weekly schedule generation;
- exception application;
- capacity calculation;
- booking horizon checks;
- party-size validation;
- tests.

### Step 4 — Reservation creation

- public validation;
- transaction and concurrency control;
- reservation number;
- public token;
- status selection;
- status history;
- idempotency.

### Step 5 — Public UI

- restaurant shell;
- party-size step;
- date and slot step;
- guest details step;
- summary and submission;
- confirmed/pending states;
- reservation detail page;
- cancellation.

### Step 6 — Back-office MVP

- reservation list;
- day/week view;
- reservation detail;
- manual creation;
- status actions;
- settings;
- service periods;
- exceptions.

### Step 7 — Notifications

- email templates;
- post-commit notification jobs;
- failure handling;
- retry policy.

### Step 8 — Security and observability

- rate limiting;
- abuse detection;
- audit logs;
- metrics;
- structured errors;
- privacy-safe logs.

### Step 9 — QA and pilot

- unit tests;
- integration tests;
- E2E tests;
- concurrency tests;
- mobile checks;
- accessibility checks;
- internal pilot launch.

---

## 36. Definition of done for Phase 1

Phase 1 is complete only when all of the following are true:

- `apps/booking-web` is deployed independently;
- a public establishment page resolves from slug;
- disabled establishments are handled correctly;
- weekly service periods can be configured;
- exceptions can close or modify availability;
- public availability is calculated server-side;
- a guest can create a reservation;
- automatic and manual confirmation both work;
- overbooking is prevented under concurrency;
- a guest receives a secure public management link;
- a guest can cancel when policy allows;
- staff can view and manage reservations;
- staff can manually create reservations;
- reservation lifecycle is audited;
- confirmation email works;
- errors are observable;
- public endpoints are rate-limited;
- tenant isolation tests pass;
- the flow is usable on mobile;
- the French interface is complete;
- private pages are not indexed;
- no sensitive data is exposed in logs or analytics.

---

## 37. Non-goals for the initial release

The initial release is not intended to solve every restaurant capacity problem.

The following must not delay the MVP:

- perfect automatic table assignment;
- complex room-layout optimization;
- predictive demand modeling;
- custom-domain automation;
- complete multilingual content management;
- third-party marketplace synchronization;
- advanced CRM profiles;
- complex group-event contracts;
- full white-label SDK.

The MVP must solve one core problem reliably:

> A guest can find a valid time, submit a booking request, receive a clear result, and the restaurant can manage that reservation without ambiguity.

---

## 38. Future design decisions that must remain open

Do not hardcode assumptions that would block:

- several establishments in one organization;
- several dining areas in one establishment;
- table-level inventory;
- custom reservation durations;
- separate online and total capacities;
- multiple confirmation policies;
- multiple notification providers;
- multiple languages;
- custom domains;
- embeddable booking widgets;
- external integration adapters;
- per-source booking rules;
- waitlists;
- group requests;
- restaurant-specific custom fields.

---

## 39. Final architecture summary

```text
Guest
  ↓
reservation.yutapro.fr/{establishmentSlug}
  ↓
Public establishment resolution
  ↓
Booking configuration + service periods + exceptions
  ↓
Server-generated availability
  ↓
Guest selects party size, date, and time
  ↓
Guest submits contact details
  ↓
Server validates and opens transaction
  ↓
Capacity is recalculated and protected against concurrency
  ↓
Reservation + status history are created
  ↓
Transaction commits
  ↓
Confirmed or pending result is returned
  ↓
Notifications are sent asynchronously
  ↓
Restaurant manages reservation in YUTA back-office
```

Recommended initial technical choices:

```text
Application: apps/booking-web
Public domain: reservation.yutapro.fr
Tenant resolution: establishment slug
Primary availability model: capacity per time slot/service period
Initial guest access: no account required
Guest management security: unguessable public token
Primary language: French
Architecture: multi-tenant from day one
Notifications: provider abstraction
Advanced table management: later phase
```

---

## 40. Codex implementation rules

Codex must follow these rules while implementing this specification:

1. Do not put booking business logic inside UI components.
2. Do not trust organization or establishment IDs from the public client.
3. Do not create a reservation without server-side availability revalidation.
4. Do not send notifications before the reservation transaction commits.
5. Do not use reservation numbers as public authorization credentials.
6. Do not expose exact capacity unless explicitly enabled.
7. Do not allow invalid reservation status transitions.
8. Do not create cross-tenant queries without explicit scope.
9. Do not store guest personal data in analytics events or ordinary logs.
10. Do not require table management for the MVP.
11. Do not hardcode one restaurant's schedule, branding, or timezone.
12. Do not duplicate Zod contracts across applications.
13. Do not silently convert a pending request into a confirmed reservation in the UI.
14. Do not make the public booking page look like the YUTA marketing website.
15. Do not introduce external provider dependencies directly into core domain logic.

---

**End of master specification.**
