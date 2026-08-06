# YUTA Backoffice Frontend Rules

Status: Current

Visibility: Engineering

Owner: YUTA engineering

Last updated: 2026-08-06

## Scope

These rules apply to UI work in `apps/backoffice`. The application is
multi-tenant and uses trusted active organization and establishment context.
Presentation work must not bypass, duplicate, or accept this scope from browser
input.

## Repository-first implementation

Before editing code:

- inspect the actual route, shell, navigation, page container, and nearby pages;
- read root and `apps/backoffice/AGENTS.md` instructions;
- inspect `@yuta/ui` exports and current semantic tokens;
- inspect current authorization, data access, mutations, forms, and tests;
- identify whether the target is new, static, interactive, or already integrated;
- report conflicts between current behavior and the requested design.

An existing integrated route is improved in place. Do not replace it with fixture
data merely because a design workflow starts with a static phase.

## Reference-image policy

Reference images may define visual direction only. Do not copy their navigation,
sample modules, data shape, labels, permissions, or controls unless current YUTA
documentation and code support them.

## Components and ownership

- Search `packages/ui/src/index.ts` and current usage before creating a primitive.
- Reuse `@yuta/ui` and `lucide-react`; do not add another UI or icon library.
- Do not assume a primitive exists. For example, use an established native or
  composed pattern when no shared Accordion or Drawer is exported.
- Keep page-specific components near the route.
- Change a shared primitive only for a general need after assessing consumers.
- Prefer composition over page-specific boolean props on shared components.
- Keep Server Components by default and isolate the smallest necessary client
  boundary for state, effects, events, or browser APIs.

## Styling

- Use the semantic tokens defined by `@yuta/ui`.
- Do not hardcode colors from screenshots or introduce provisional page tokens.
- Avoid arbitrary Tailwind values when the existing scale expresses the layout.
- Do not change global CSS for a single page.
- Preserve Geist Sans, current typography, visible focus, and accessible target
  sizes.
- Do not communicate status by color alone.
- Prevent horizontal page overflow at supported widths.

## Forms, time, and data

- Validate untrusted input with Zod at the server boundary.
- Follow current form and mutation conventions; do not add a form/state library
  for one page.
- Associate errors with fields and preserve user input after save failures.
- Use establishment timezone and locale where available.
- Treat exception dates as establishment-local calendar dates.
- Use the repository's canonical time representation.
- Map existing domain fields to UI fields before proposing persistence changes.
- Stop and request approval when the design needs a new domain field, constraint,
  enum value, route, permission, contract, or schema migration.

## Required states

As applicable, integrated pages implement loading, empty/first-configuration,
load error, save error, forbidden, conflict, persisted-success, and recovery
states. Static design work must not pretend these states are implemented.

## Scope control

Unless explicitly authorized, do not:

- redesign the shell, sidebar, topbar, or tenant selector;
- change unrelated routes or domain vocabulary;
- infer features from reference navigation;
- alter authentication or tenant selection;
- add API routes, server actions, contracts, or migrations during visual work;
- refactor unrelated code;
- combine a visual correction with backend redesign.

## Verification

Use repository commands that actually exist:

```bash
pnpm docs:check
pnpm format:check
pnpm architecture:check
pnpm --filter @yuta/backoffice typecheck
pnpm --filter @yuta/backoffice test
pnpm --filter @yuta/backoffice build
```

Run affected auth, tenant, contract, booking, and database tests when their
behavior changes. The repository currently has no Backoffice lint script, so do
not report lint as passed unless one is deliberately added and run.

Browser QA verifies console/hydration errors, keyboard operation, focus,
responsive layout, and overflow at the requested widths.
