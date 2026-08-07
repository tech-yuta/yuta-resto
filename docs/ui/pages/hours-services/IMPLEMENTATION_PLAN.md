# Horaires & services — Implementation Plan

Status: Current

Visibility: Engineering

Owner: YUTA product and engineering

## Route maturity

`/etablissement/horaires-services` is an existing integrated route.

The implementation plan therefore preserves working authorization, establishment scope, persistence, validation, and mutations. It does not restart with fixture data.

## Phase 0 — Repository analysis and current capture

### Goal

Establish the real implementation baseline.

### Inspect

- root and Backoffice instructions;
- current public-booking documentation;
- route files and nearby pages;
- current server and client boundaries;
- trusted tenant and permission checks;
- current booking queries and mutations;
- current forms and Zod schemas;
- `@yuta/ui` exports and semantic tokens;
- current tests and build commands;
- current desktop, tablet, and mobile rendering.

### Deliver

- relevant file paths;
- current component tree;
- current data and mutation map;
- current screenshots;
- differences from `UI_SPEC.md`;
- unsupported mockup concepts;
- proposed files to change;
- verification commands.

### Restriction

No code changes.

## Phase 1 — Visual baseline improvement in place

### Goal

Align hierarchy, proportions, density, and responsive composition while preserving behavior.

### May change

- page composition;
- spacing and responsive grids;
- section hierarchy;
- presentation of current data;
- page-specific components;
- current accessible disclosure composition;
- supporting summary placement.

### Must preserve

- shell and navigation;
- trusted tenant context;
- permission checks;
- server boundaries;
- current data loading;
- current mutations;
- current validation;
- current exception kinds;
- current fields;
- tests.

### Must not add

- fixture replacement;
- new contracts;
- new schema fields;
- new permissions;
- unsupported service fields;
- day-level switch semantics;
- new exception enum values;
- a global page save that misrepresents separate mutations.

### Evidence

Screenshots at 1440, 1024, 768, and 390 px, plus exact repository checks.

## Phase 2 — Component boundary improvement

### Goal

Reduce route complexity without changing approved appearance or behavior.

### Rules

- keep page-specific components near the route;
- reuse `@yuta/ui`;
- use current native or composed patterns when no shared primitive exists;
- keep Server Components by default;
- isolate the smallest client boundaries;
- avoid wrapper-only components;
- do not move components into `@yuta/ui` without independent reuse;
- do not duplicate component export documentation.

### Evidence

Before and after screenshots and test results.

## Phase 3 — Current interaction refinement

### Goal

Improve existing interactions only where product behavior is already defined.

Potential work:

- clearer pending and success states;
- deletion confirmation;
- focus management;
- accessible action menus;
- exception-kind dependent fields;
- retry behavior;
- responsive form presentation.

Do not implement copy-day, day-level enable, unsaved preview, or unsupported per-service fields without approval.

## Phase 4 — Approved domain extension

### Applicability

Run only when a proposed capability in `PRODUCT_SCOPE.md` receives explicit approval.

### Required proposal before code

- user behavior;
- current-to-proposed mapping;
- contracts;
- schema;
- enum or constraint impact;
- authorization;
- migration or reset approach;
- cache and revalidation;
- test plan;
- documentation impact.

Stop before code until the proposal is approved.

## Phase 5 — Visual, responsive, and accessibility QA

### Viewports

```text
1440 px
1024 px
768 px
390 px
```

### Review order

1. shell alignment;
2. page hierarchy;
3. main and supporting column proportions;
4. exception workflow density and supporting-summary balance;
5. current service-field readability;
6. persisted service summaries;
7. current exceptions;
8. typography and semantic color;
9. responsive stacking;
10. overflow;
11. keyboard, focus, labels, and state communication.

### Verification

Run:

```text
pnpm docs:check
pnpm format:check
pnpm architecture:check
pnpm --filter @yuta/backoffice typecheck
pnpm --filter @yuta/backoffice test
pnpm --filter @yuta/backoffice build
```

Run relevant booking, tenant, auth, contract, and cloud-database tests when affected.

Do not claim lint as passed because the Backoffice currently has no lint script.

## Documentation maintenance

- Update this stable page package in place when approved behavior changes.
- Keep page-specific references inside this package and shared references under
  `docs/ui/references/`.
- Update `docs/README.md` whenever a current package path changes.
- Run `pnpm docs:check` after documentation changes.
- Do not add migration or completion reports to the active documentation tree.
