# YUTA UI Implementation Guide

Status: Current

Visibility: Engineering

Owner: YUTA product and engineering

Last updated: 2026-08-08

## Purpose

This directory governs design-to-code work for YUTA frontend applications.

The shared rules cover public cloud applications, the restaurant Backoffice,
the local POS client, and the standalone Display. Current page packages are
Backoffice-specific; other applications remain governed by their nearest
`AGENTS.md` and current product or feature documentation until they receive a
page package.

It turns an approved visual direction into maintainable UI without treating a screenshot as authority for product scope, navigation, data, authorization, or persistence.

Read this directory together with:

- the root `AGENTS.md`;
- the nearest application `AGENTS.md`;
- `docs/CURRENT_STATE.md`;
- the relevant current feature or product documentation;
- `YUTA_FRONTEND_RULES.md`;
- the target application's frontend rules, including
  `BACKOFFICE_FRONTEND_RULES.md` for Backoffice work;
- the current page package under `pages/<page-slug>/`;
- `packages/ui/src/index.ts` and `packages/ui/src/styles/global.css`.

## Authority order

When sources conflict, use this order:

1. root and nearest nested `AGENTS.md`;
2. `docs/CURRENT_STATE.md`, current architecture, and approved feature/product documentation;
3. implemented contracts, schemas, authorization, tests, and route conventions;
4. the current page-specific product, UI, and interaction specifications;
5. `@yuta/ui` exports and semantic tokens;
6. visual reference images;
7. model judgment.

Images may guide hierarchy, proportions, density, spacing, and visual tone. They must not be used to infer navigation, permissions, domain fields, API design, or unsupported product capabilities.

## Directory structure

```text
docs/ui/
├── README.md
├── YUTA_FRONTEND_RULES.md
├── BACKOFFICE_FRONTEND_RULES.md
├── PAGE_PACK_PROTOCOL.md
├── references/
│   ├── README.md
│   └── yuta-shell-brand-reference.png
├── templates/
│   ├── README.md
│   └── page/
│       ├── README.md
│       ├── PRODUCT_SCOPE.md
│       ├── UI_SPEC.md
│       ├── DATA_AND_INTERACTION_SPEC.md
│       ├── IMPLEMENTATION_PLAN.md
│       ├── ACCEPTANCE_CHECKLIST.md
│       └── prompts/
│           ├── 00_REPOSITORY_ANALYSIS.md
│           ├── 01_VISUAL_BASELINE.md
│           ├── 02_COMPONENT_REFACTOR.md
│           ├── 03_INTERACTIONS.md
│           ├── 04_DATA_INTEGRATION.md
│           └── 05_VISUAL_QA.md
└── pages/
    ├── README.md
    └── <page-slug>/
        ├── README.md
        ├── PRODUCT_SCOPE.md
        ├── UI_SPEC.md
        ├── DATA_AND_INTERACTION_SPEC.md
        ├── IMPLEMENTATION_PLAN.md
        ├── ACCEPTANCE_CHECKLIST.md
        ├── references/
        └── prompts/
```

## Page packages

Each current UI initiative receives one stable directory:

```text
docs/ui/pages/<page-slug>/
```

Do not create parallel `v2`, `new`, `final`, or `latest` directories. Update the current package in place and rely on Git history.

The required artifact shape and packaging rules are defined in `PAGE_PACK_PROTOCOL.md`.

## Repository-first workflow

### Phase 0 — Inspect

Before editing:

- identify the real route, shell, page container, and nearby pages;
- read root and application instructions;
- inspect current authorization, tenant scope, persistence, forms, and tests;
- inspect `@yuta/ui` exports and semantic tokens;
- identify whether the route is new, static, interactive, or already integrated;
- report conflicts between the design and the implemented domain.

For an existing integrated route, improve it in place. Do not replace working behavior with fixture data merely because a generic design workflow begins with a static phase.

### Phase 1 — Establish the visual baseline

For a new route, a typed responsive static composition may be appropriate before persistence.

For an existing route:

- capture the current page;
- compare it with the current written specification and visual references;
- preserve authorization, server boundaries, data loading, and mutations;
- make the smallest visual change that establishes the approved hierarchy.

For current Backoffice page packages, use:

```text
1440 px
1024 px
768 px
390 px
```

### Phase 2 — Improve component boundaries

Keep page-specific components near the route. Extract only meaningful units, reuse shared primitives, and avoid wrappers that merely rename an existing component.

Move a component to `@yuta/ui` only after independent reuse is proven.

### Phase 3 — Implement approved interactions

Add only behavior defined by current product decisions. Do not guess:

- merge or replace semantics;
- destructive behavior;
- validation;
- dirty-state behavior;
- whether a preview uses saved or unsaved values;
- whether a visual control has a persisted domain representation.

### Phase 4 — Integrate or extend data

Map the existing domain model to the UI model before editing persistence.

A missing field is a product/schema proposal, not permission to add a column, contract field, enum value, route, or permission.

### Phase 5 — Visual and responsive QA

Review in this order:

1. shell and page-container alignment;
2. hierarchy and content proportions;
3. spacing and density;
4. typography and semantic color;
5. responsive stacking and overflow;
6. keyboard, focus, labels, and state communication.

Separate visual corrections from backend refactors.

## Current visual foundation

The repository implementation is authoritative.

Use:

- shared components exported by `packages/ui/src/index.ts`;
- semantic tokens defined in `packages/ui/src/styles/global.css`;
- `lucide-react`;
- the typography approved by the target application's current instructions.

Use role-based classes such as:

```text
bg-canvas
bg-surface
bg-surface-muted
bg-surface-selected
text-primary
text-secondary
text-muted
text-inverse
border-border-default
border-border-strong
bg-action-primary
bg-action-danger
ring-focus-ring
status-*
```

Do not introduce a second token vocabulary, copy color values from references, or duplicate the public component catalog in documentation.

## Verification

Use the repository-wide commands defined by `YUTA_FRONTEND_RULES.md`, then the
target application's typecheck, tests, and build. For Backoffice work, also use
the commands and browser widths in `BACKOFFICE_FRONTEND_RULES.md`.

Common repository checks are:

```text
pnpm docs:check
pnpm format:check
pnpm architecture:check
pnpm -r --if-present typecheck
```

Run affected auth, tenant, contract, domain, database, local runtime, and device
tests when their behavior changes.

Browser QA verifies:

- console and hydration errors;
- keyboard operation;
- visible focus;
- responsive layout;
- horizontal overflow;
- truthful loading, empty, error, forbidden, conflict, success, and recovery states.

## Delivery evidence

Every UI delivery reports:

- route and files changed;
- shared primitives reused and page-specific components added;
- domain/design conflicts and intentional deviations;
- commands and exact results;
- browser evidence at requested widths;
- accessibility and overflow observations;
- deferred work and risks.

Do not claim visual parity without browser evidence.
