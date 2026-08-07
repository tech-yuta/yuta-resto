# Data and Interaction Specification

## Status of this document

This document defines a page-level UI model and interaction intent. It is not permission to create or modify database schema, API contracts, enums, permissions, or routes.

Prompt 00 must first map every concept to the current repository implementation.

## Current implementation mapping

| UI concept                            | Current source                           | Mutation                     | Status                          |
| ------------------------------------- | ---------------------------------------- | ---------------------------- | ------------------------------- |
| Name, description, structured address | `establishments`                         | establishment profile action | `SUPPORTED`                     |
| Primary and public contact, website   | `establishments`                         | establishment profile action | `SUPPORTED`                     |
| Logo and cover                        | validated URL fields on `establishments` | establishment profile action | `SUPPORTED_WITH_DIFFERENT_COPY` |
| Languages and service modes           | establishment arrays and approved enum   | establishment profile action | `SUPPORTED`                     |
| Public visibility                     | establishment booleans                   | establishment profile action | `SUPPORTED`                     |
| Weekly service periods                | booking administration repository        | service-period actions       | `SUPPORTED`                     |
| Completion                            | local view-model calculation             | none                         | `UI_ONLY_DERIVED`               |
| Local public preview                  | local form state                         | none                         | `UI_ONLY_DERIVED`               |
| Media upload                          | no storage lifecycle                     | none                         | `PROPOSAL_REQUIRES_APPROVAL`    |
| Address verification                  | no geocoding provider                    | none                         | `PROPOSAL_REQUIRES_APPROVAL`    |
| External public profile               | no route                                 | none                         | `PROPOSAL_REQUIRES_APPROVAL`    |

## Context and authorization

The page operates inside the validated active context:

```ts
type EstablishmentScope = {
  organizationId: string;
  establishmentId: string;
};
```

This is conceptual notation only. Use the repository's actual context type and server-side resolution.

Requirements:

- the server derives organization/establishment scope from trusted session and membership data;
- browser-provided IDs are not authorization proof;
- reads and writes remain scoped by both organization and establishment where required;
- read-only users cannot mutate through direct requests;
- existing role, permission, entitlement, and membership rules remain authoritative.

Weekly service-period reads additionally require the booking entitlement and
`booking.read`. Create and delete actions require `booking.settings.manage`,
validate on the server, and revalidate both the general-information schedule
and remaining booking-administration summaries.

## UI view model

Adapt to existing DTOs and field names. Do not treat this as a persistence contract.

```ts
type GeneralInformationViewModel = {
  identity: {
    commercialName: string;
    logo?: ExistingMediaReference | null;
    description?: string | null;
  };
  address?: ExistingAddressViewModel | null;
  primaryContact?: {
    phone?: string | null;
    email?: string | null;
    website?: string | null;
  };
  publicContact?: {
    phone?: string | null;
    email?: string | null;
  };
  languages?: ExistingLanguageIdentifier[];
  serviceModes?: ExistingServiceModeIdentifier[];
  publicVisibility?: ExistingPublicVisibilityModel;
  completion?: ExistingProfileCompletionModel;
  updatedAt?: string;
};
```

Every `Existing*` type means: locate and reuse the current repository contract. If none exists, stop and document the gap instead of inventing one.

## Field mapping matrix

Prompt 00 must produce a table with these columns before implementation:

```text
UI concept | current source path | current field/contract | load path | mutation path | validation | permission | status
```

Allowed `status` values:

- `SUPPORTED`;
- `SUPPORTED_WITH_DIFFERENT_COPY`;
- `UI_ONLY_DERIVED`;
- `PROPOSAL_REQUIRES_APPROVAL`;
- `OUT_OF_SCOPE`.

## Validation

Use current repository schemas and shared utilities. The mockup's asterisks, counters, example formats, and file limits are not sufficient evidence for domain rules.

For each field, Prompt 00 must identify:

- required/optional status;
- normalization behavior;
- maximum length, if any;
- locale-specific validation;
- server-side validation source;
- existing error-message convention.

Do not introduce new validation limits to match example counters. If the UI needs a counter but no approved limit exists, omit the counter or create a proposal.

## Logo interaction

When upload infrastructure already exists:

1. use the current media component and storage abstraction;
2. validate with existing schema/constants;
3. preserve the current logo if replacement fails;
4. show current upload progress/error patterns;
5. do not create a new provider or cleanup job;
6. expose removal only when the existing product and storage lifecycle support it.

For a `NEW_PAGE` visual baseline, a typed local media fixture may be displayed. It must not be presented as a working upload.

## Editing and dirty state

- explicit save; no autosave unless current implementation already uses it;
- derive dirty state through the existing form library/pattern;
- preserve current unsaved-change behavior;
- save action disabled when pristine, invalid, read-only, or saving;
- on failed save, preserve unsaved values;
- on successful save, apply canonical server values and reset dirty state.

## Preview behavior

The in-page preview may be derived from local form values without persistence.

- it updates as supported fields change;
- empty/hidden values are removed without blank rows;
- it never bypasses server-side publish rules;
- it never creates a new public route;
- it renders text safely;
- it uses existing public labels/formatters when available.

## Completion indicator

Use only an existing centralized completion value/calculator. The screenshot's `75%` is illustrative.

When no approved completion capability exists:

- omit the indicator from implementation; or
- keep a visual placeholder only during an explicitly approved `NEW_PAGE` fixture baseline and mark it non-functional;
- record completion scoring as `PROPOSAL_REQUIRES_APPROVAL`.

## Public visibility

Public-visibility switches are allowed only when backed by current approved fields/contracts. Toggling a supported visibility setting must not delete its underlying value.

Unsupported switches shown in the screenshot remain proposals. Do not create persistence for them in Phase 3.

## Languages and service modes

- use existing identifiers, labels, ordering, and validation;
- do not create enums based on the screenshot;
- do not assume all visually shown modes are supported;
- preserve unknown current values when editing unless current product logic says otherwise;
- local interaction in Phase 3 must use the mapped supported set only.

## Save and data integration

For `EXISTING_PAGE`:

- keep the current loader/mutation and extend only approved supported concepts;
- preserve authorization, scoping, validation, optimistic/concurrency behavior, and cache invalidation;
- do not replace existing real data with fixtures.

For `NEW_PAGE`:

- Phase 1 may use typed fixtures;
- Phase 4 connects only to existing approved domain capabilities;
- if persistence requires a new schema field, enum, permission, contract, API route, or server action, stop and submit a proposal before changing it.

## Error and recovery behavior

Use current application patterns for:

- load retry or safe navigation;
- field-level server validation errors;
- global non-destructive error feedback;
- upload errors;
- stale-write or concurrency handling, when present;
- missing/invalid active establishment context.

## Security and privacy

- no unscoped establishment reads or writes;
- no client-only authorization;
- no raw contact data in logs;
- no raw HTML rendering;
- no external provider introduced by this page;
- no public exposure of private contact values without current visibility/business rules.
