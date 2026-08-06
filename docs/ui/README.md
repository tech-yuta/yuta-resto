# YUTA UI Implementation Guide

Status: Current

Visibility: Engineering

Owner: YUTA product and engineering

Last updated: 2026-08-06

## Purpose

This guide turns an approved visual direction into maintainable YUTA UI without
treating a screenshot as product, navigation, data, or authorization authority.
It applies primarily to `apps/backoffice`; the same repository-first method may
be reused by another application only after reading its nearest `AGENTS.md`.

Use this guide together with:

- [`YUTA_FRONTEND_RULES.md`](YUTA_FRONTEND_RULES.md) for durable implementation
  rules;
- a current page-specific specification under [`pages/`](pages/);
- visual assets under `references/` as non-authoritative evidence.

## Authority order

When sources conflict, use this order:

1. root and nearest nested `AGENTS.md` instructions;
2. current architecture and approved product documentation;
3. implemented contracts, schemas, authorization, tests, and route conventions;
4. the current page-specific UI specification;
5. `@yuta/ui` exports and semantic tokens;
6. visual reference images;
7. model judgment.

Images may guide hierarchy, proportions, density, spacing, and visual tone. They
must not be used to infer navigation, permissions, domain fields, API design, or
unsupported product capabilities.

## Repository-first workflow

### Phase 0 — Inspect

Before editing, identify:

- the real route, application shell, and page container;
- the nearest instructions and current feature documentation;
- shared primitives exported from `packages/ui/src/index.ts`;
- actual semantic tokens in `packages/ui/src/styles/global.css`;
- server/client boundaries, authorization, tenant scope, and persistence;
- relevant tests, builds, and browser verification tooling;
- conflicts between the design and the implemented domain.

For an existing route, report the current implementation and propose a focused
change. Do not restart it as a fixture-only page or discard working behavior.

### Phase 1 — Establish the visual baseline

For a new route, build a typed, responsive static composition before persistence
unless the approved task explicitly combines phases. For an existing route,
capture the current page and compare it with the written specification and visual
reference before editing.

Evidence uses the relevant widths from:

```text
1440 px
1024 px
768 px
390 px
```

### Phase 2 — Improve component boundaries

Keep page-specific components close to the route. Extract only meaningful units,
reuse shared primitives, and avoid wrappers that merely rename an existing
component. Move a component to `@yuta/ui` only after independent reuse is proven.

### Phase 3 — Implement approved interactions

Add only interaction behavior defined by current product decisions. Do not guess
merge/replace semantics, destructive behavior, validation, dirty-state behavior,
or whether preview data is saved or unsaved.

### Phase 4 — Integrate or extend data

Map the current domain model to the UI model before editing persistence. A missing
field is a product/schema proposal, not permission to add a column. Any schema or
contract change follows the repository documentation and migration rules.

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

The repository's actual tokens are authoritative. Use role-based classes such
as:

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

Do not introduce a second token vocabulary or copy color values from reference
images. `packages/ui/src/index.ts` is the only public component catalog; this
documentation intentionally does not duplicate it.

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
