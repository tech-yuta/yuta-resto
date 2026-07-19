# Multi-Tenant Foundation Implementation Report

Date: 2026-07-19

## Implemented

- Added `@yuta/contracts`, a Zod-only package with common identifiers,
  ISO date-times, money, API errors, pagination, the current POS order and item
  lifecycle, order transport DTOs, reservation DTOs, and a kitchen event
  envelope.
- Added `@yuta/tenant`, a Zod-only package with public/authenticated contexts,
  hostname normalization, lookup ports, fail-closed resolvers, role,
  entitlement, organization, and establishment guards.
- Added shared DB models for organizations, establishments, domains,
  memberships, and entitlements, plus Drizzle migration `0002_keen_satana.sql`.
- Added idempotent development seed data for `FAST VIET`,
  `LUNA Chasseneuil-du-Poitou`, `luna.localhost`, public entitlements, and the
  existing seeded users' memberships.
- Added DB adapters for domain, membership, and establishment lookup.
- Added `GET /api/public/tenant` to `apps/web`. It resolves the request `Host`
  through `@yuta/tenant` and performs an explicitly scoped establishment query.
- Migrated the duplicate order type/status TypeScript definitions in
  `@yuta/core` to `@yuta/contracts`. The existing lifecycle remains:
  `draft`, `sent`, `preparing`, `ready`, `served`, `paid`, `cancelled`.

## Compatibility findings

- The proposed `submitted` / `in_preparation` names were incompatible with the
  implemented POS lifecycle. Per product direction, the current `sent` /
  `preparing` semantics were preserved.
- Admin reservation and order screens currently contain presentation/mock data,
  not shared transport DTOs, so they were not force-migrated.
- `apps/yuta-display` is a separate signage product with its own database and no
  existing POS kitchen-event consumer. No artificial event integration was
  added.
- Existing authentication does not expose a trustworthy user ID. The POS staff
  cookie is deliberately not connected to `resolveAuthenticatedTenant`.

## Remaining work

- Integrate authenticated tenant resolution into POS and admin after the
  authentication project is complete.
- Add `organization_id` / `establishment_id` ownership and explicit context to
  existing POS order, menu, payment, print, and reporting repositories. They
  remain single-tenant and were left unchanged to avoid changing payment and
  kitchen behavior prematurely.
- Define a real reservations persistence/API flow before replacing the admin
  reservation mock statuses.
- Connect the kitchen event contract only when a real POS-to-display event
  transport exists.
- Existing French/EUR formatting and LUNA-specific menu import remain product
  assumptions outside the new tenant resolver.

## Validation

- `pnpm --filter @yuta/contracts test` — 4 tests passed.
- `pnpm --filter @yuta/contracts typecheck` — passed.
- `pnpm --filter @yuta/tenant test` — 4 tests passed.
- `pnpm --filter @yuta/tenant typecheck` — passed.
- `pnpm --filter @yuta/db typecheck` — passed.
- `pnpm --filter @yuta/core typecheck` — passed.
- `pnpm --filter @yuta/web typecheck` — passed.
- `pnpm --filter @yuta/web build` — passed; the public tenant API was emitted
  as a dynamic server route.
- `pnpm --filter @yuta/db db:migrate` — migration applied to the local dev DB.
- `pnpm --filter @yuta/db db:seed` — tenant and POS seed completed.
- Fresh-database verification — all migrations and the idempotent seed completed
  on an isolated database; the temporary database was removed afterward.
- Live DB smoke check — `luna.localhost` resolved to the seeded establishment,
  the scoped establishment query returned LUNA, and an unknown hostname failed
  closed.
- `pnpm --filter @yuta/core test` — 30 tests passed against an isolated,
  migrated test database; the temporary database was removed afterward.
- `pnpm -r --if-present typecheck` — passed for all packages and applications.
