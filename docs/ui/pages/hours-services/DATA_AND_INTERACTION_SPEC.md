# Horaires & services — Data and Interaction Specification

Status: Current

Visibility: Engineering

Owner: YUTA product and engineering

## Trusted scope

All reads and mutations use server-derived trusted context:

- organization;
- establishment;
- membership;
- role;
- permissions;
- entitlements;
- locale;
- timezone.

The browser must not provide authoritative tenant or establishment scope.

The route requires:

```text
booking.settings.manage
```

## Current domain mapping

### Service periods

| Current field | UI presentation     | Notes                                                                       |
| ------------- | ------------------- | --------------------------------------------------------------------------- |
| day of week   | weekday section     | All seven weekdays remain visible                                           |
| name          | service title       | French display copy may be localized without renaming stored domain meaning |
| start time    | service range start | Use canonical repository time representation                                |
| end time      | service range end   | Validate against start                                                      |
| capacity      | service capacity    | Display or edit only through current supported action                       |
| enabled       | active state        | Service-level only when currently persisted                                 |
| sort order    | visual order        | Do not invent drag-and-drop persistence                                     |

### Exceptions

| Current kind     | UI meaning             |
| ---------------- | ---------------------- |
| `CLOSED_ALL_DAY` | full-day closure       |
| `CLOSED_SERVICE` | closure for a service  |
| `MODIFIED_HOURS` | modified service hours |
| `BLOCKED_SLOT`   | blocked booking slot   |

Do not map a mockup-only `Ouverture exceptionnelle` badge to a new persisted kind without approval.

## Current interactions

Preserve current established patterns for:

- loading administration data;
- reading service periods for current summaries and exception choices;
- creating service periods;
- deleting service periods;
- creating exceptions;
- deleting exceptions;
- server authorization;
- validation responses;
- revalidation or refresh after persisted mutation.

Inspect the current route before documenting additional current update actions.

## Destructive behavior

Exception and service-period deletion require confirmation.

Confirmation must:

- identify the affected item;
- expose pending state;
- prevent duplicate submission;
- preserve recoverable context after failure;
- return focus appropriately.

## Service-period behavior

Only current fields are persisted.

Do not add UI persistence for:

- reservation start per service;
- reservation end per service;
- last arrival per service;
- duration per service;
- empty-day enabled state;
- copy-day behavior.

If a visual summary displays derived information, it must be clearly read-only and derived from persisted current fields.

## Exception behavior

Fields depend on the selected current exception kind.

Irrelevant fields:

- are hidden or disabled according to current form conventions;
- are not submitted;
- are not retained as authoritative stale values;
- are validated on the server.

Exception dates are establishment-local calendar dates.

Avoid UTC conversion that changes the intended local date.

## Public preview

The preview uses persisted data unless an explicit product decision defines unsaved preview behavior.

It:

- renders every weekday from its own service periods;
- describes the persisted weekly schedule only; it must not imply that the
  current preview incorporates exceptions unless that behavior is implemented
  and verified;
- does not claim external publication or synchronization;
- does not imply unsaved values are customer-visible.

## Validation

Use current contracts and Zod server-boundary validation.

At minimum, preserve current validation for:

- required service name;
- valid canonical time values;
- end after start;
- valid capacity when applicable;
- valid day of week;
- valid exception kind;
- fields required by the selected exception kind;
- trusted establishment access;
- conflict behavior defined by current booking logic.

Do not add validation rules based only on the mockup.

## Truthful states

The integrated route must keep or implement, as applicable:

- loading;
- empty or first configuration;
- forbidden;
- load error;
- pending;
- validation error;
- conflict;
- persisted success;
- mutation error;
- retry and recovery.

A visual-only document must not claim these states are implemented without code evidence.

## Proposed concepts requiring a separate decision

| Proposed concept               | Current gap                                    |
| ------------------------------ | ---------------------------------------------- |
| reservation window per service | no approved current field mapping              |
| last arrival per service       | no approved current field mapping              |
| duration per service           | current duration is global                     |
| empty weekday switch           | no persisted day record semantics              |
| opening exception kind         | current enum has no distinct kind              |
| copy day                       | replace/merge and conflict semantics undefined |
| unsaved public preview         | saved/unsaved source undefined                 |

Before implementing one of these:

1. define product behavior;
2. define UI behavior;
3. map current domain gaps;
4. propose contract and schema impact;
5. define authorization;
6. define migration or reset impact;
7. define tests;
8. obtain approval.
