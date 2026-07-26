# YuTa

YuTa is a modular restaurant operations platform built with Next.js,
TypeScript, Tailwind CSS, and shared workspace packages.

## Workspace

- `apps/web` - public YuTa website and product landing page for restaurants.
- `apps/admin` - cloud SaaS administration for organizations,
  establishments, reputation, reservations, and cloud configuration.
- `apps/yuta-pos` - local-only restaurant POS client for orders, payments,
  tables, and service workflows.
- `apps/site-agent` - target local API, persistence, realtime, printer, and
  device boundary for the POS.
- `apps/yuta-display` - standalone local digital signage app with an app-owned
  database.
- `packages/ui` - shared UI components, app-shell primitives, and design tokens.
- `packages/core` - database-independent domain logic and registries.
- `packages/contracts` - transport DTOs, events, and Zod contracts.
- `packages/db-cloud` - target cloud SaaS database package.
- `packages/db-pos` - target local POS database package owned at runtime by
  `site-agent`.

The repository is currently migrating from the legacy shared `packages/db`.
See
[`docs/YUTA_DATABASE_ARCHITECTURE_RESET_SPEC.md`](docs/YUTA_DATABASE_ARCHITECTURE_RESET_SPEC.md)
for the authoritative target architecture and migration status. POS operational
data must never be written to or synchronized with the cloud database.

## Architecture Documentation

- [`docs/YUTA_DATABASE_ARCHITECTURE_RESET_SPEC.md`](docs/YUTA_DATABASE_ARCHITECTURE_RESET_SPEC.md) -
  authoritative database and runtime-boundary specification.
- [`docs/YUTA_POS.md`](docs/YUTA_POS.md) - POS product behavior and target local
  architecture.
- [`docs/POS_OFFLINE_STRATEGY.md`](docs/POS_OFFLINE_STRATEGY.md) - offline and
  local data-residency rules.
- [`docs/LOCAL_DATABASE.md`](docs/LOCAL_DATABASE.md) - target development
  database workflow.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) - cloud, POS, and display
  deployment boundaries.

Documents explicitly marked as historical or superseded remain for
implementation context and are not architecture authority.

## Local Development

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000` for the public website.

Public website routes, Google integration disclosures, and production content
requirements are documented in `docs/PUBLIC_WEBSITE.md`.

Useful app scripts:

```bash
pnpm dev:admin
pnpm dev:pos
pnpm dev:display
```
