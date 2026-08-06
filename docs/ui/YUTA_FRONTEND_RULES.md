# YUTA Backoffice Frontend Rules

Status: Current

Visibility: Engineering

Owner: YUTA engineering

Last updated: 2026-08-06

## Scope

These rules apply to UI work in `apps/backoffice`.

The Backoffice is the authenticated restaurant-facing cloud application. UI text is French; code and technical documentation are English.

The application is multi-tenant and uses trusted active organization and establishment context. Presentation work must not bypass, duplicate, or accept tenant scope from browser input.

## Required reading

Before editing:

1. read the root `AGENTS.md`;
2. read `docs/README.md` and `docs/CURRENT_STATE.md`;
3. read `apps/backoffice/AGENTS.md`;
4. read `docs/ui/README.md`;
5. read the current page package under `docs/ui/pages/<page-slug>/`;
6. inspect the route, implementation, tests, and related feature documentation.

## Repository-first implementation

Before changing UI:

- inspect the real route, application shell, navigation, page container, and nearby pages;
- inspect current authorization, tenant scope, data access, mutations, forms, and tests;
- inspect `packages/ui/src/index.ts` and current usage before creating a primitive;
- inspect semantic tokens in `packages/ui/src/styles/global.css`;
- identify whether the target is new, static, interactive, or already integrated;
- report conflicts between current behavior and requested design.

An existing integrated route is improved in place. Do not replace it with fixture data merely because a design workflow contains a visual-baseline phase.

## Reference-image policy

Reference images may define only:

- visual hierarchy;
- relative proportions;
- density;
- spacing direction;
- visual tone.

Do not copy their:

- navigation;
- sample modules;
- data model;
- labels unsupported by current product documentation;
- permissions;
- API assumptions;
- controls without current behavior;
- colors as raw values.

## Components and ownership

- The Backoffice and YUTA frontend applications reuse `@yuta/ui` where
  applicable.
- Search `packages/ui/src/index.ts` and existing usage before creating a primitive.
- Reuse `@yuta/ui` and `lucide-react`.
- Do not add MUI, Ant Design, Chakra UI, Mantine, another UI library, or another icon library.
- Do not assume a primitive exists. Use an established native or composed pattern when no shared export exists.
- Keep page-specific components near the route.
- Change a shared primitive only for a general need after assessing current consumers.
- Prefer composition over page-specific boolean props on shared primitives.
- Keep Server Components by default.
- Isolate the smallest necessary client boundary for state, effects, events, or browser APIs.
- Do not maintain a second component export catalog in documentation.

## Styling

- Use semantic tokens defined by `@yuta/ui`.
- Never use raw hex values in `className` or inline styles.
- Do not introduce provisional page token names.
- Avoid arbitrary Tailwind values when the existing scale expresses the layout.
- Do not change global CSS for one page.
- Preserve Geist Sans and the current typography scale.
- Preserve visible focus and accessible target sizes.
- Do not communicate status by color alone.
- Prevent horizontal page overflow at supported widths.

## Shell and navigation

Unless explicitly authorized:

- do not redesign the Backoffice shell;
- do not redesign the sidebar or topbar;
- do not change the establishment selector;
- do not infer navigation items from a reference image;
- do not add unsupported cloud-service modules;
- do not alter authentication or tenant switching.

The restaurant Backoffice does not expose customer ordering, checkout, payment, invoicing, transaction-linked loyalty, promotion, or generic email workflows.

## Forms, time, and data

- Authenticate and authorize on the server.
- Derive organization, establishment, membership, role, permissions, and entitlements from trusted session state.
- Every tenant-owned repository read or mutation receives trusted tenant scope.
- Keep `@yuta/db-cloud` and provider integrations behind server boundaries.
- Validate untrusted input with Zod at the server boundary.
- Follow current form and mutation conventions.
- Do not add a form or state-management library for one page.
- Associate errors with fields.
- Preserve user input after save failures.
- Use establishment timezone and locale where available.
- Treat exception dates as establishment-local calendar dates.
- Use the repository's canonical time representation.
- Map current domain fields to UI fields before proposing persistence changes.
- Stop and request approval when a design needs a new domain field, constraint, enum value, route, permission, contract, or migration.

## Required states

As applicable, an integrated page implements truthful:

- loading;
- empty or first-configuration;
- load error;
- forbidden;
- validation error;
- conflict;
- pending;
- persisted success;
- save error;
- retry and recovery.

Static design documents must not claim these states are implemented.

## Scope control

Unless explicitly authorized, do not:

- change unrelated routes or domain vocabulary;
- infer features from reference navigation;
- add API routes, server actions, contracts, permissions, or migrations during visual work;
- refactor unrelated code;
- combine visual correction with backend redesign;
- discard working authorization or data integration;
- create duplicate `v2`, `new`, `final`, or `latest` documents.

## Responsive and accessibility

Verify relevant widths:

```text
1440 px
1024 px
768 px
390 px
```

Requirements include:

- no horizontal page overflow;
- no clipped primary action;
- keyboard-operable controls;
- visible focus;
- accessible names for icon-only controls;
- textual status labels;
- associated field errors;
- managed dialog focus;
- touch-accessible controls;
- responsive layouts based on current primitives rather than an assumed Drawer or Accordion export.

## Documentation maintenance

Whenever behavior, flow, route, validation, persistence, or operational rules change:

- update current documentation in the same change;
- update the existing page package in place;
- update `docs/README.md` when a current document path changes;
- remove obsolete links after moving files;
- do not add overlapping completion reports.

Completed implementation history belongs in Git history. Durable behavior belongs in current feature and page documentation.

## Verification

Use repository commands that exist:

```text
pnpm docs:check
pnpm format:check
pnpm architecture:check
pnpm --filter @yuta/backoffice typecheck
pnpm --filter @yuta/backoffice test
pnpm --filter @yuta/backoffice build
```

Run affected auth, tenant, contract, booking, and cloud-database tests when their behavior changes.

The Backoffice currently has no lint script. Never report lint as passed unless a lint script is deliberately added and executed.

Report exact results, failures, skipped checks, screenshots, console observations, and remaining risks.
