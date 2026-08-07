# Implementation Plan

Status: Current maintenance plan for an implemented route

Visibility: Engineering

Owner: YUTA product and engineering

Last updated: 2026-08-06

The route is classified as `EXISTING_PAGE`. Establishment profile persistence,
authorization, validation, migration, local preview, and tests are implemented.
The phases below govern future maintenance and must preserve these boundaries.

## Phase 0 — Repository analysis and page classification

**Prompt:** `prompts/00_REPOSITORY_ANALYSIS.md`

Goals:

- read repository instructions and shared UI documents;
- classify the page as `NEW_PAGE` or `EXISTING_PAGE`;
- identify exact route, shell, current components, contracts, authorization, data paths, mutations, validation, and tests;
- map mockup concepts to implemented capabilities;
- list exact files proposed for modification;
- verify available repository commands.

No code changes are allowed.

Required approval gate:

- do not continue until the analysis report and classification are reviewed.

## Phase 1 — Visual baseline

**Prompt:** `prompts/01_VISUAL_BASELINE.md`

Goals:

- align layout, hierarchy, proportions, spacing, density, typography, and responsive composition with the reference;
- use the existing shell and shared primitives;
- produce browser evidence.

Branch rules:

- `NEW_PAGE`: typed fixture data is allowed only inside the page/feature scope; no real persistence.
- `EXISTING_PAGE`: modify the current implementation in place and keep real loaders, authorization, mutations, validation, and scope intact; fixture replacement is forbidden.

Stop after visual baseline screenshots. Do not refactor broadly or add unsupported business capabilities.

## Phase 2 — Component refactor

**Prompt:** `prompts/02_COMPONENT_REFACTOR.md`

Goals:

- extract focused page-level components where useful;
- reuse `@yuta/ui` and current app primitives;
- keep the approved visual baseline unchanged;
- avoid premature shared abstractions.

Do not modify schema, API, authorization, data contracts, or unrelated shared components.

## Phase 3 — Interactions

**Prompt:** `prompts/03_INTERACTIONS.md`

Goals:

- implement approved local form interactions;
- preview updates;
- dirty state;
- counters only when backed by current limits;
- language/service-mode selection using mapped current identifiers;
- keyboard/focus behavior;
- read-only and local error states.

Do not add persistence capabilities, schema fields, APIs, or permissions. For `EXISTING_PAGE`, preserve current mutation wiring while limiting this phase to presentation/local interaction adjustments.

## Phase 4 — Data integration

**Prompt:** `prompts/04_DATA_INTEGRATION.md`

Goals:

- connect the approved UI to current data sources and mutation conventions;
- preserve server authorization and `organization + establishment` scoping;
- reuse existing validation, upload, cache invalidation, and tests;
- remove `NEW_PAGE` fixture-only wiring after real integration.

Hard stop:

- any required new schema field, enum, permission, contract, API route, mutation, storage provider, or geocoding provider must be proposed and approved before implementation.

## Phase 5 — Visual and responsive QA

**Prompt:** `prompts/05_VISUAL_QA.md`

Goals:

- capture and compare 1440, 1024, 768, and 390 px viewport evidence;
- classify differences as Critical, Major, Minor, or Intentional;
- fix Critical and Major visual issues without touching business logic;
- run only verified repository validation commands;
- report exact results and intentional deviations.

## Currently documented validation commands

Prompt 00 must verify these against the current repository before running them:

```bash
pnpm docs:check
pnpm format:check
pnpm architecture:check
pnpm -r --if-present typecheck
pnpm --filter @yuta/backoffice test
pnpm --filter @yuta/backoffice build
```

Do not claim a lint run unless an actual lint script is found and executed. Run additional targeted commands only when Prompt 00 confirms they exist.

## Required evidence per implementation phase

- classification (`NEW_PAGE` or `EXISTING_PAGE`);
- route tested;
- files created/modified;
- shared components reused;
- browser screenshot paths;
- horizontal-overflow status;
- console/hydration error status;
- commands actually run and exact result;
- known deviations;
- proposals requiring approval.
