# Horaires & services — Product Scope

Status: Current

Visibility: Engineering

Owner: YUTA product and engineering

## User goal

An authorized restaurant manager configures global booking rules and booking
exceptions. Regular weekly service periods are managed in section 5 of
`/etablissement/informations-generales`.

## Current approved capabilities

The existing route currently supports the established booking administration model:

### Weekly service periods

This route reads the current periods for summaries, exception selection, and
the persisted public preview. Their create/delete UI belongs to the general
information page.

Current service periods contain:

- day of week;
- name;
- service start time;
- service end time;
- capacity;
- enabled state;
- sort order.

### Global booking settings

Current settings include values such as:

- confirmation mode;
- slot interval;
- global average duration;
- minimum notice;
- booking window.

### Exceptions

Current exception kinds are:

```text
CLOSED_ALL_DAY
CLOSED_SERVICE
MODIFIED_HOURS
BLOCKED_SLOT
```

### Security and scope

- The route is establishment-scoped.
- Tenant context is derived from trusted server session state.
- The route requires `booking.settings.manage`.
- Cloud persistence remains behind server boundaries.

## Page purpose

The page may improve presentation of:

- today's operational summary;
- global booking-rule summaries and forms;
- persisted customer-facing hours preview;
- upcoming current exception kinds;
- booking-settings update;
- exception create and delete actions.

## Out of scope without separate approval

The following concepts are not current persistence requirements:

- reservation start and end windows per service;
- last-arrival time per service;
- table duration per service instead of the current global average;
- a persisted enabled or disabled record for an otherwise empty weekday;
- a distinct `OPEN_EXCEPTIONALLY` exception kind;
- copy-day merge or replace persistence semantics;
- previewing unsaved rather than persisted values;
- automatic holiday import;
- seasonal schedules;
- external profile synchronization;
- drag-and-drop scheduling;
- room or terrace-specific schedules.

## Product boundary

This page belongs to cloud booking administration.

It does not introduce customer ordering, checkout, payment, invoicing, cash management, transaction-linked loyalty, promotions, or generic email workflows.

## Proposal rule

When a requested design needs an out-of-scope capability:

1. document the user behavior;
2. map current fields and gaps;
3. propose contracts, schema, authorization, migration, and tests;
4. wait for explicit approval;
5. implement the smallest coherent extension.

Do not infer persistence from the visual reference.
