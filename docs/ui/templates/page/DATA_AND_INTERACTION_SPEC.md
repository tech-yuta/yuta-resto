# <Page name> — Data and Interaction Specification

Status: Draft

Visibility: Engineering

## Current domain mapping

| Current field or model | UI presentation | Transformation | Gap |
| ---------------------- | --------------- | -------------- | --- |

Use current contracts and schema. A UI model is not a database schema.

## Trusted scope

Describe:

- organization;
- establishment;
- membership;
- role;
- permissions;
- entitlements;
- locale;
- timezone.

Never trust browser-provided tenant scope.

## Current interactions

List current create, update, delete, navigation, preview, and confirmation behavior.

## Validation

List current client and server validation.

## States

Define truthful:

- loading;
- empty;
- forbidden;
- validation error;
- conflict;
- pending;
- success;
- save error;
- retry and recovery.

## Decisions that must not be guessed

List unclear destructive, merge/replace, dirty-state, preview, or persistence semantics.

## Proposed persistence changes

Describe separately and require approval before contracts or schema change.
