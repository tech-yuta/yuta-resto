# YUTA Monorepo Agent Instructions

## Repository model

YUTA is a modular restaurant platform monorepo containing cloud services, local
operational products, and shared foundation packages.

### Cloud and public services

- `apps/web` — public YUTA website and approved general tenant-facing flows.
- `apps/backoffice` — authenticated restaurant back-office.
- `apps/booking-web` — independent public booking application.
- `apps/feedback-web` — independent public direct-feedback application.
- `apps/platform-admin` — reserved for future platform-wide YUTA administration;
  not implemented.

### Local operational products

- `apps/yuta-pos` — local restaurant operational client.
- `apps/site-agent` — local API, POS persistence, printing, realtime, and device
  boundary.
- `apps/yuta-display` — standalone local digital signage.

Local products are maintained first-class monorepo components. They are not
legacy.

### Shared foundation

- `packages/auth`
- `packages/contracts`
- `packages/core`
- `packages/booking`
- `packages/tenant`
- `packages/db-cloud`
- `packages/db-pos`
- `packages/ui`

Package manifests are authoritative for versions and scripts.

## Instruction order

Before editing:

1. Read this file.
2. Read `docs/README.md` and `docs/CURRENT_STATE.md`.
3. Read the nearest nested `AGENTS.md`.
4. Read the relevant current architecture, feature, product, or operations doc.
5. Inspect current code and tests.

The nearest nested `AGENTS.md` has priority for its directory. Current approved
documentation defines intended behavior; code and tests are implementation
evidence. Report conflicts instead of silently choosing.

## Product visibility

Repository ownership and public product visibility are separate.

Engineering and local-operator documentation may describe all maintained local
products. Do not present local checkout, payment, billing, invoicing,
cash-register, or money-management workflows as public YUTA service
capabilities in marketing, SEO, pricing, partner/bank materials, commercial
proposals, customer-facing roadmaps, or public announcements.

Visibility labels define communication scope, not confidentiality. Never commit
secrets to this public repository.

## Runtime and database ownership

- Cloud server code uses `@yuta/db-cloud`.
- `apps/yuta-pos` accesses persistence and devices through `apps/site-agent`.
- `apps/site-agent` is the runtime owner of `@yuta/db-pos`.
- `apps/yuta-display` owns its standalone display persistence.
- Cloud, POS, and Display use separate database names, users, credentials,
  migrations, environment files, and failure domains.
- POS operational data must not be stored in or synchronized to cloud
  persistence.
- Display persistence remains separate from cloud and POS.
- Browser bundles receive no database drivers, URLs, secrets, or trusted scope.
- Do not recreate the removed `@yuta/db` compatibility package.

Run `pnpm architecture:check` after changing dependencies, imports, environment
access, migrations, or runtime ownership.

## Cloud tenancy and authorization

The persisted hierarchy is:

```text
organization
└── establishment
```

`tenant` is trusted runtime authorization context, not a table and not browser
input.

For tenant-owned cloud data:

- organization-owned operations include `organizationId`;
- establishment-owned operations include `organizationId` and
  `establishmentId`;
- lookup by resource ID alone is forbidden;
- browser-provided organization, establishment, membership, role, permission,
  and entitlement values are untrusted;
- authenticated context comes from a validated server session and active
  membership;
- public context comes from verified server-side hostname/domain resolution;
- authorization is enforced on the server and fails closed;
- sensitive operations include cross-tenant denial tests.

## Package boundaries

- `@yuta/contracts` owns transport schemas and inferred serialization-safe types.
- `@yuta/core` and `@yuta/booking` remain pure and deterministic.
- `@yuta/auth` contains portable authentication primitives, not persistence or
  framework integration.
- `@yuta/tenant` contains trusted context and guards, not database adapters.
- `@yuta/db-cloud` and `@yuta/db-pos` do not import one another.
- `@yuta/ui` contains reusable presentation primitives, not feature business
  logic.
- Do not create speculative packages, apps, tables, routes, or compatibility
  layers.

## Code and UI standards

- Use TypeScript strict mode and avoid `any`.
- Validate untrusted boundary input with Zod.
- Use named exports only.
- Prefer Server Components in Next.js applications.
- Add `'use client'` only for browser state, effects, events, or APIs.
- Keep side effects at application or infrastructure boundaries.
- Do not introduce a new UI, icon, validation, state-management, or data-access
  framework without an accepted ADR.
- Reuse `@yuta/ui`, semantic tokens, and `lucide-react`; do not use raw color
  values or another component library.
- `packages/ui/src/index.ts` is the authoritative UI export catalog.
- Preserve accessible names, keyboard behavior, and visible focus.
- Implement relevant loading, empty, error, forbidden, conflict, success, and
  recovery states.

Public YUTA websites and the restaurant back-office use Geist Sans with
`Inter, sans-serif` as fallback. Application `globals.css` files start with
`@import '@yuta/ui/styles/global.css';`, and Tailwind CSS uses
`@tailwindcss/postcss` through `postcss.config.mjs`.

Code, identifiers, comments, logs, commits, and technical documentation are
English. User-facing language follows the nearest application instructions.

## Task workflow

For meaningful work:

1. Define goal, scope, affected runtime/data boundaries, and risks.
2. Inspect current implementation, tests, and documentation.
3. Reuse current contracts, repositories, pure logic, and shared UI.
4. Implement the smallest coherent change.
5. Add or update tests with behavior changes.
6. Update current documentation in the same change.
7. Run relevant checks.
8. Report changed files, commands, results, skipped checks, and risks.

Avoid opportunistic repository-wide refactors.

## Validation

Always run:

```bash
pnpm docs:check
pnpm architecture:check
pnpm -r --if-present typecheck
```

For formatting-sensitive changes:

```bash
pnpm format:check
```

Run relevant tests and builds:

```bash
pnpm test:cloud
pnpm test:local
pnpm build:cloud
```

Use narrower package commands when the task affects only one area. State every
expected check that was not run.

## Documentation and deployment

The documentation index is `docs/README.md`.

Update current docs when changing behavior, architecture, data ownership,
security, environment variables, setup, deployment, operations, or product
visibility. Use an ADR for durable decisions. Use `STATUS.md` or GitHub Issues
for temporary progress. Do not add overlapping `final`, `new`, `v2`, `v3`, or
implementation-report documents to the active documentation tree.

Deployment authority is `docs/operations/DEPLOYMENT.md`. Do not duplicate its
procedures here or change runtime topology without an accepted ADR.

## Completion

A task is complete only when requested scope is satisfied, runtime/database/
tenant/security boundaries remain enforced, relevant checks pass, current
documentation is accurate, no duplicate source of truth is introduced, and the
completion report is truthful.
