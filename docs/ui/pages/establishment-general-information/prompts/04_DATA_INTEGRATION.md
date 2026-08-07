# Prompt 04 — Data Integration

Integrate `/etablissement/informations-generales` with existing approved repository data capabilities. Re-read the Prompt 00 mapping before changing data code.

## Mandatory preservation

- server-side authorization;
- active `organization + establishment` scope;
- current membership/permission rules;
- current loaders/repositories/actions/endpoints;
- server validation;
- upload/media abstraction;
- cache invalidation and concurrency behavior;
- current tests.

## `EXISTING_PAGE`

1. Keep the current real implementation as the base.
2. Connect visual/local changes to existing DTOs and mutations.
3. Extend only concepts already supported by current contracts/schema.
4. Do not replace current flows with a new parallel endpoint or action.
5. Preserve unknown/current values where the editor does not own them.

## `NEW_PAGE`

1. Replace Phase 1 fixture wiring only with existing approved loaders/contracts/mutations.
2. Remove fixture-only production paths after successful integration.
3. Use current repository patterns for authorization, scoping, validation, errors, and cache invalidation.
4. Do not create missing persistence capabilities automatically.

## Hard-stop proposal rule

Stop and produce a proposal instead of implementation when any approved UI concept requires a new:

- database field/table/migration;
- enum;
- permission or entitlement;
- shared contract/DTO that changes product behavior;
- API route/server action/mutation;
- upload/storage capability;
- geocoding/address-verification provider;
- public-profile route;
- completion-scoring engine.

The proposal must include:

```text
Capability gap
Current evidence
Why current implementation is insufficient
Minimal proposed change
Authorization and scoping impact
Data migration impact
API/contract impact
Test impact
Product decision required
```

Do not implement the proposal until it is approved.

## Validation

Use only commands verified in Prompt 00. Currently documented candidates are:

```bash
pnpm docs:check
pnpm format:check
pnpm architecture:check
pnpm -r --if-present typecheck
pnpm --filter @yuta/backoffice test
pnpm --filter @yuta/backoffice build
```

Do not report lint unless a real lint script was found and run.

## Required output

- data paths reused;
- authorization/scoping evidence;
- fixtures removed, if `NEW_PAGE`;
- files changed;
- tests added/updated;
- commands actually run and exact result;
- any stopped proposal requiring approval.
