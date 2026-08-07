# YUTA Backoffice Frontend Rules

Status: Current

Visibility: Engineering

Owner: YUTA engineering

Last updated: 2026-08-07

## Scope

These rules apply to UI work in `apps/backoffice`.

The Backoffice is the authenticated restaurant-facing cloud application. UI text is French; code and technical documentation are English.

User-facing page routes use lowercase French slugs without accents. API routes,
code identifiers, comments, logs, and technical documentation remain English.
Because the applications are not yet released, keep only canonical routes and
do not add compatibility aliases for superseded route names. Do not translate
`/api/...` paths.

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

### Shared component ownership

- The Backoffice and YUTA frontend applications reuse `@yuta/ui` where
  applicable.
- Search `packages/ui/src/index.ts` and existing usage before creating a primitive.
- Reuse `@yuta/ui` and `lucide-react`.
- Do not add MUI, Ant Design, Chakra UI, Mantine, another UI library, or another icon library.
- Do not assume a primitive exists. Use an established native or composed pattern when no shared export exists.
- Keep page-specific components near the route.
- Change a shared primitive only for a general need after assessing current consumers.
- Prefer composition over page-specific boolean props on shared primitives.
- Do not maintain a second component export catalog in documentation.

Business-specific components should remain route-local or feature-local. Promote
them to an application-wide shared layer only when reuse across independent
routes or features is proven. Only domain-neutral primitives belong in
`@yuta/ui`.

Examples of business-specific components that should not automatically move into `@yuta/ui`:

```text
RestaurantIdentitySection
OpeningHoursEditor
ReservationRulesSection
EmployeeDocumentsSection
StockMovementFilters
```

Shared UI primitives should remain domain-neutral. A component is not a shared primitive merely because more than one page uses a similar visual pattern.

### Page composition

A route-level `page.tsx` should primarily act as a page orchestration boundary.

Depending on the existing implementation, its responsibilities may include:

- resolving route parameters;
- preserving route-level authentication and authorization;
- resolving trusted active organization and establishment context;
- loading server-side data;
- handling redirects or not-found behavior;
- composing page sections;
- passing trusted identifiers and data to child components.

Passing identifiers to presentation components does not make browser-provided
values trusted. Server actions and server endpoints must continue deriving or
validating tenant scope from trusted server-side context.

Do not use `page.tsx` as the default location for every field, section, dialog, list, mutation, validation rule, and client-side interaction on a complex page.

A long file is not automatically wrong. Refactor when separation improves the clarity of business responsibilities, state ownership, data flow, or server/client boundaries.

### Page-local component colocation

Keep components that belong only to one route close to that route.

An allowed pattern for routes with several extracted components:

```text
<route>/
├── page.tsx
└── _components/
```

For larger pages, create additional route-local folders only when the implementation actually needs them.

Common examples may include:

```text
<route>/
├── page.tsx
├── _components/
├── _hooks/
├── _lib/
└── _types/
```

Do not create empty folders preemptively.

Do not introduce a new route-local folder convention merely because it appears in a design document. Inspect nearby routes and current application patterns first.

If a page has many components, group them by feature responsibility when that improves navigation.

Example:

```text
<route>/
├── page.tsx
└── _components/
    ├── header/
    ├── filters/
    ├── list/
    └── dialogs/
```

This is an example of organization, not a mandatory structure.

### When to extract a component

A page section is a good candidate for extraction when one or more of the following is true:

- it represents a meaningful business section;
- it owns local interactive state;
- it owns a dialog, popover, editor, uploader, or other focused interaction;
- it has its own mutation flow;
- it has its own validation behavior;
- it contains a substantial table, list, filter group, or editor;
- it can be tested independently;
- it is reused within the same feature;
- it needs a Client Component boundary while the surrounding page can remain a Server Component;
- keeping it inline makes the route page materially harder to understand.

Extract by responsibility, not by visual position.

Prefer names such as:

```text
IdentitySection
ContactSection
OpeningHoursSection
ReservationRulesSection
EmployeeDocumentsSection
StockMovementFilters
```

Avoid names such as:

```text
LeftBox
RightBox
TopCard
BottomBlock
FormPart1
FormPart2
SectionA
```

Component names should communicate domain or interaction responsibility.

### Avoid mechanical splitting

There is no maximum component line count.

Do not split a cohesive component solely because it exceeds an arbitrary number of lines.

Avoid tiny pass-through components that:

- only forward props;
- have no meaningful responsibility;
- make code navigation harder;
- obscure the business flow;
- exist only to reduce file length.

The purpose of extraction is to clarify ownership and behavior, not to maximize the number of files.

### Server and Client Component boundaries

Keep Server Components by default.

Isolate the smallest necessary client boundary for state, effects, events, or browser APIs.

Do not add `"use client"` to an entire route page merely because one subsection requires client-side behavior.

Prefer a structure where server-side page composition remains above isolated interactive components when the existing architecture allows it.

Example:

```text
page.tsx                         Server Component
├── PageHeader                  Server or shared component
├── RestaurantSummary          Server Component
└── LogoUploader               Client Component
```

The example describes boundary direction only. Do not invent component APIs or move existing secure data loading into the browser.

Client-side presentation code must not become a source of truth for:

- organization ID;
- establishment ID;
- membership;
- role;
- permissions;
- entitlements.

These remain derived from trusted server-side session/context according to the existing application architecture.

### Forms and component decomposition

Large forms may be split into business sections while keeping one coherent form and submission model when the domain requires one save operation.

Do not create separate mutations merely because the JSX was split into several components.

Preserve the current:

- form state model;
- validation contract;
- mutation semantics;
- transaction behavior;
- error behavior;
- persistence behavior.

A child component may own an independent mutation only when the underlying business interaction is genuinely independent in the current implementation.

### Refactoring existing integrated pages

When decomposing an existing page into components:

- preserve current authorization;
- preserve trusted organization and establishment scope;
- preserve current data loading;
- preserve mutations;
- preserve validation;
- preserve error handling;
- preserve tests;
- preserve current domain behavior;
- keep the existing canonical route and page package.

Do not replace real data with fixtures during component refactoring.

Do not use component extraction as a reason to redesign backend contracts or persistence.

### Component extraction and page packages

Page-specific documentation may define expected page-local component boundaries when they are useful for implementation.

However, page packages should reference this document instead of duplicating these shared rules.

Do not copy the full component policy into every `docs/ui/pages/<page-slug>/` package.

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
