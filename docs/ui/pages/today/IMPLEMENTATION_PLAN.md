# Today dashboard — Implementation plan

Status: Current

Visibility: Engineering

Owner: YUTA product and engineering

Last updated: 2026-08-06

## Route maturity

`/aujourdhui` is an authenticated dashboard integrated with current tenant-scoped
booking and reputation sources. This plan records the implementation boundaries
that remain authoritative for future maintenance.

No future change may introduce fabricated production values or unsupported
financial wording on the route.

## Phase 0 — Repository analysis

Inspect:

- root and Backoffice instructions and current UI documents;
- authenticated layout and shell boundaries;
- current fixture dashboard component;
- booking and reputation entitlements and permissions;
- reservation, booking-administration, and feedback repositories;
- locale/timezone utilities and current tests;
- `@yuta/ui` exports and semantic tokens;
- current rendering at relevant widths.

Deliver a repository report with no code changes.

## Phase 1 — Visual baseline in place

Adapt the approved hierarchy to the reduced current scope:

- local date and greeting;
- supported attention cards;
- dominant reservation summary;
- secondary booking-service and conditional review cards;
- responsive stacking and truthful states.

Preserve the shell, authentication, tenant selection, and current routes. Do not
copy unsupported reference modules, navigation, sample values, or raw colors.
Development fixtures may support isolated visual tests, but the production
route must not render them as real data.

## Phase 2 — Component boundaries

- Keep the route as a Server Component by default.
- Move only interactive menus or filters into minimal client boundaries.
- Keep page-specific view and section components near `/aujourdhui`.
- Reuse `@yuta/ui`; do not create wrapper-only abstractions.
- Remove or retire the fixture-only dashboard component after all consumers are
  verified.

## Phase 3 — Approved interactions

Implement only current links and reservation creation behavior. Add a menu only
when multiple real actions exist. Preserve focus, accessible names, pending
state, and recovery according to current primitives.

Tasks, team actions, content approval, email actions, unsupported filters, and
overflow menus remain out of scope.

## Phase 4 — Current data integration

- Compose trusted tenant context on the server.
- Determine today using establishment timezone and locale.
- Load reservations, booking services, and entitled reviews in parallel.
- Enforce current entitlements and permissions for each section.
- Map independent ready, empty, hidden/forbidden, and unavailable states.
- Add focused tests without changing schemas, contracts, permissions, or
  migrations.

Stop before code if a required view cannot be produced from current sources.

## Phase 5 — Visual, responsive, and accessibility QA

Verify at:

```text
1536 px
1024 px
768 px
390 px
```

Compare written specifications first, current shell and shared primitives
second, and the reference image third. Record intentional omissions.

## Required validation

```bash
pnpm docs:check
pnpm format:check
pnpm architecture:check
pnpm -r --if-present typecheck
pnpm --filter @yuta/backoffice test
pnpm --filter @yuta/backoffice build
```

Run relevant booking, reputation, tenant, authorization, contract, and
cloud-database tests when affected. Backoffice has no lint command; do not claim
a lint result.

## Documentation maintenance

Update this stable package in place. Behavior changes also update the relevant
current feature documentation. Do not add phase-completion or migration reports
to the active documentation tree.
