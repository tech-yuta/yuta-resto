# Horaires & services — UI Specification

Status: Current design reference

Visibility: Engineering

Owner: YUTA product and engineering

Last updated: 2026-08-06

## Authority and scope

This document guides visual and interaction improvements for the existing route:

```text
/establishment/hours-services
```

The implementation, booking contracts and schema, current public-booking documentation, authorization, and tests remain behavior authority.

References:

- `references/desktop.png`
- `../../references/yuta-shell-brand-reference.png`

Do not copy navigation or unsupported modules from either image.

## Current implementation baseline

The route already:

- runs inside the authenticated Backoffice shell;
- requires trusted booking tenant context and `booking.settings.manage`;
- loads establishment-scoped booking administration data from `@yuta/db-cloud`;
- uses establishment timezone and locale;
- displays weekly service periods, booking settings, and upcoming exceptions;
- updates booking settings;
- supports current create and delete service-period and exception actions through established server patterns;
- uses `@yuta/ui`, semantic tokens, and `lucide-react`.

Improvements must preserve this behavior. Do not restart the route with fixture data or remove server authorization and data integration.

## Page header

Use existing Backoffice breadcrumb behavior.

Title:

```text
Horaires & services
```

Description:

```text
Configurez les horaires d’ouverture, les services et les exceptions.
```

The primary action must reflect a real current mutation.

A public-preview action is added only when its target and saved or unsaved semantics are approved.

Do not display one global `Enregistrer` action if separate current forms persist independently.

## Today summary

Show a compact summary based on current persisted data:

- today's open or closed state;
- today's active service ranges;
- the next applicable current exception.

Status includes text and does not rely on color alone.

Do not imply unsupported per-service reservation windows or last-arrival fields.

## Main sections

The two primary areas are:

```text
Horaires réguliers
Jours exceptionnels
```

Use the current route and accessibility conventions.

Tabs, anchors, native disclosure, or another pattern must reflect actual behavior rather than visual imitation.

## Desktop layout

At wide widths:

- weekly schedules form the dominant column;
- supporting summaries form a narrower secondary column;
- use `minmax(0, 1fr)` for the main region;
- use approximately `20rem` for the supporting column when consistent with the current shell;
- preserve the current page container and shell spacing.

Supporting cards stack below when space is insufficient.

## Weekly schedule

Support all seven weekdays.

Each day shows:

- weekday label;
- service summary;
- clear open or closed text;
- current service-period actions.

Expanded content shows only current fields and approved actions, including:

- service name;
- service start and end;
- capacity when applicable;
- enabled state when currently supported;
- sort order only when exposed by an approved interaction.

Use the current accessible native disclosure pattern unless a shared primitive becomes justified.

Do not show a day-level switch when an empty weekday has no persisted enabled or disabled representation.

Do not show per-service reservation windows, last arrival, or per-service duration as editable persisted fields without an approved domain extension.

## Supporting summaries

### Booking rules

Summarize current global settings only, such as:

- confirmation mode;
- slot interval;
- global average duration;
- notice;
- booking window.

Editable controls must correspond to the current settings action and its validation.

### Persisted public preview

Render every weekday from its own persisted service periods.

Do not merge weekdays under one shared label unless their complete persisted schedules are actually equal and the grouping behavior is approved.

The preview must not imply unsaved changes are public.

### Upcoming exceptions

Show only current exception kinds:

```text
CLOSED_ALL_DAY
CLOSED_SERVICE
MODIFIED_HOURS
BLOCKED_SLOT
```

Do not display `Ouverture exceptionnelle` as a distinct persisted type unless the domain is extended.

## Mutation presentation

- Label the booking-settings action as saving booking rules, not saving the entire page.
- Service-period and exception deletion require confirmation.
- Forms expose pending, validation-error, persisted-success, save-error, and retry states.
- Exception fields follow the selected current kind.
- Irrelevant fields are not submitted.
- The current booking-settings update and service-period/exception create and
  delete capabilities must remain truthful.

## Responsive behavior

Verify at:

```text
1440 px
1024 px
768 px
390 px
```

Requirements:

- no horizontal page scrolling;
- the secondary column stacks below weekly schedules;
- service data becomes a readable label/value grid or vertical list;
- primary actions remain available without clipping;
- disclosures and menus remain keyboard and touch accessible;
- dialogs use current mobile-appropriate behavior rather than an assumed Drawer component;
- the page preserves the existing shell at each breakpoint.

## Accessibility

- Disclosure triggers expose expanded state and visible focus.
- Icon-only actions have accessible names and tooltips where appropriate.
- Status badges include text.
- Form controls have labels, hints, and associated errors.
- Dialog focus is managed on open and close.
- Time fields remain keyboard accessible.
- Destructive confirmation names the affected service period or exception.
- Pending state does not remove essential context.

## Visual acceptance

- The page clearly belongs to the current Backoffice shell.
- Existing navigation, establishment selection, and permissions remain unchanged.
- Weekly schedule remains the dominant task surface.
- Supporting summaries do not compete with the primary workflow.
- Existing semantic tokens and shared primitives are reused.
- No reference-image colors or navigation are copied directly.
- All seven weekdays and current exception kinds remain readable.
- Mobile and tablet layouts have no overflow.
- Current save, create, and delete behavior still works.
- Loading, errors, forbidden, success, and recovery states remain truthful.
- Screenshots exist for requested widths.
- Intentional deviations from the visual reference are recorded.

## Out of scope without separate approval

- database or contract redesign;
- new capabilities listed in `PRODUCT_SCOPE.md`;
- application-shell redesign;
- unrelated Backoffice navigation changes;
- a new UI, icon, form, or state-management library;
- complex calendar;
- drag-and-drop scheduling;
- holiday import;
- external profile synchronization.
