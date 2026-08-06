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

The implementation, booking contracts/schema, current product documentation,
and authorization tests remain behavior authority. The reference images guide
visual hierarchy and proportions only:

- [`horaires-services-desktop.png`](../references/horaires-services-desktop.png)
- [`yuta-shell-brand-reference.png`](../references/yuta-shell-brand-reference.png)

Do not copy navigation or unsupported modules from either image.

## Current implementation baseline

The route already:

- runs inside the authenticated Backoffice shell;
- requires trusted booking tenant context and `booking.settings.manage`;
- loads establishment-scoped booking administration data from `@yuta/db-cloud`;
- uses establishment timezone and locale;
- displays weekly service periods, booking settings, and upcoming exceptions;
- updates booking settings and supports current create/delete service-period and
  exception actions through established server patterns;
- uses `@yuta/ui`, semantic tokens, and `lucide-react`.

Improvements must preserve this behavior. Do not restart the route with fixture
data or remove server authorization/data integration.

## Current domain model

Current booking service periods support:

```text
day of week
name
service start and end time
capacity
enabled state
sort order
```

Current booking settings contain global values such as confirmation mode, slot
interval, average duration, notice, and booking window. Current exception kinds
are:

```text
CLOSED_ALL_DAY
CLOSED_SERVICE
MODIFIED_HOURS
BLOCKED_SLOT
```

The UI must map to these fields without inventing persistence.

## Proposed capabilities requiring a separate decision

The following visual concepts are not current schema requirements:

- reservation start/end windows per service;
- last-arrival time per service;
- table duration per service rather than the global average;
- a persisted enabled/disabled record for an otherwise empty weekday;
- a distinct `OPEN_EXCEPTIONALLY` exception kind;
- copy-day merge/replace persistence semantics;
- previewing unsaved rather than persisted values.

If requested, first provide product behavior, field mapping, contract/schema,
migration, authorization, and test impact. Do not implement them from the image.

## Visual structure

### Page header

- Existing Backoffice breadcrumb behavior.
- Title: `Horaires & services`.
- Description: `Configurez les horaires d’ouverture, les services et les exceptions.`
- Primary action remains visually clear and reflects a real current form action.
- A public-preview action is added only when its target and saved/unsaved semantics
  are approved.

### Today summary

Show today's open/closed state, active service ranges, and next applicable
exception. Status includes text and does not rely on color alone.

### Main navigation

The two primary sections are:

```text
Horaires réguliers
Jours exceptionnels
```

Use current route/accessibility conventions. Anchors, tabs, or another pattern
must reflect actual behavior rather than visual imitation.

### Main content

At wide widths, weekly schedules are the dominant column and supporting
summaries form a narrower secondary column. Use `minmax(0, 1fr)` for the main
content and approximately `20rem` for the supporting column when consistent with
the current shell. Supporting cards stack below when space is insufficient.

### Weekly schedule

- Support all seven weekdays.
- Show each day's service summary and clear open/closed text.
- Expanded days show current service fields and current actions.
- Use the existing accessible native disclosure pattern unless a shared
  accordion becomes justified.
- Do not show a day-level switch whose persistence semantics are unsupported.

### Supporting summaries

Booking rules, persisted public preview, and upcoming exceptions may appear as
secondary cards. They must summarize current data and not imply editable fields
or exception types that do not exist.

The public preview renders each weekday from its own persisted service periods.
It must not merge different weekday schedules under one shared label.

### Mutation behavior

- The booking-settings action is labelled as saving booking rules, not the whole
  page.
- Service-period and exception deletion require confirmation.
- Forms expose pending, validation-error, persisted-success, and retry states.
- Exception fields follow the selected current kind; irrelevant fields are not
  submitted.

## Responsive behavior

Verify at 1440, 1024, 768, and 390 px:

- no horizontal page scrolling;
- the secondary column stacks below the weekly schedule;
- service data becomes a readable label/value grid or vertical list;
- primary actions remain available without clipping;
- disclosures and menus remain keyboard and touch accessible;
- dialogs use the existing mobile-appropriate behavior rather than an assumed
  Drawer component.

## Accessibility

- Disclosure triggers expose expanded state and visible focus.
- Icon-only actions have accessible names and tooltips where appropriate.
- Status badges include text.
- Form controls have labels, hints, and associated errors.
- Dialog focus is managed on open and close.
- Time fields remain keyboard accessible.

## Visual acceptance checklist

- The page clearly belongs to the current Backoffice shell.
- Existing navigation, tenant selection, and permissions are unchanged.
- Weekly schedule remains the dominant task surface.
- Supporting summaries do not compete with the primary workflow.
- Existing semantic tokens and shared primitives are reused.
- No reference-image colors or navigation are copied directly.
- All seven days and current exception kinds remain readable.
- Mobile and tablet layouts have no overflow.
- Current save/create/delete behavior still works.
- Loading, errors, forbidden state, success, and recovery remain truthful.
- Screenshots exist for requested widths, with intentional deviations recorded.

## Out of scope without separate approval

- database or contract redesign;
- new booking capabilities listed as proposed above;
- application-shell redesign;
- unrelated Backoffice navigation changes;
- a new UI, icon, form, or state-management library;
- complex calendar, drag-and-drop scheduling, holiday import, or external profile
  synchronization.
