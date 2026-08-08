# Prompt 00 — Repository Analysis and Status Classification

Analyze the repository for `/etablissement/informations-generales`. Do not edit code, install dependencies, create files, or run destructive commands.

## Mandatory reading

1. root `AGENTS.md`;
2. every applicable nested `AGENTS.md`, especially the back-office instructions;
3. `docs/CURRENT_STATE.md` and current product/architecture documents;
4. `docs/ui/README.md`;
5. `docs/ui/YUTA_FRONTEND_RULES.md`;
6. `docs/ui/BACKOFFICE_FRONTEND_RULES.md`;
7. `docs/ui/PAGE_PACK_PROTOCOL.md`;
8. every file in `docs/ui/pages/establishment-general-information/`;
9. the attached visual reference.

## Required analysis

1. Confirm the exact back-office app and route path.
2. Classify the page as exactly one of:
   - `NEW_PAGE` — no implemented route/business flow exists;
   - `EXISTING_PAGE` — route or feature already has authorization, scoped loading, mutations, validation, tests, or other business logic.
3. If `EXISTING_PAGE`, identify all behavior that must be preserved:
   - authorization;
   - organization/establishment scoping;
   - loaders/data queries;
   - mutations/actions/endpoints;
   - validation;
   - upload/media behavior;
   - cache invalidation;
   - tests;
   - error/read-only behavior.
4. Locate exact paths for:
   - application shell and page-header primitives;
   - navigation source of truth;
   - route implementation;
   - active organization/establishment context;
   - authorization/permission guards;
   - establishment schema and current DTO/contracts;
   - repositories/services/loaders/actions/endpoints;
   - form and validation schemas;
   - upload/media infrastructure;
   - public-profile or preview capability;
   - completion-score capability;
   - address-verification capability;
   - shared UI components in `@yuta/ui` and app-local primitives;
   - relevant tests and browser/E2E tooling.
5. Build the field mapping table required by `DATA_AND_INTERACTION_SPEC.md`.
6. Mark every screenshot-only or unsupported concept as `PROPOSAL_REQUIRES_APPROVAL`.
7. Inspect root and back-office `package.json` scripts and report the exact available commands. Do not assume a lint script exists.
8. List exact files you propose to create or modify in Phases 1–5.
9. Report conflicts or ambiguity using the source-of-truth order in `README.md`.

## Required output

```text
Page classification
Current route and implementation summary
Protected existing behavior
Field/capability mapping table
Reusable shell/components
Exact files proposed
Exact verified commands
Risks and conflicts
Proposals requiring approval
Recommended phase plan
```

Stop after the report. Wait for approval before implementation.
