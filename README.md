# YuTa

YuTa is a modular restaurant operations platform built with Next.js,
TypeScript, Tailwind CSS, and shared workspace packages.

## Workspace

- `apps/web` - public YuTa website and product landing page for restaurants.
- `apps/admin` - cloud SaaS administration for organizations,
  establishments, reputation, reservations, and cloud configuration.
- `apps/yuta-pos` - local-only restaurant POS client for orders, payments,
  tables, and service workflows.
- `apps/site-agent` - local API and persistence boundary for the POS; realtime,
  printer, and device integrations are added here as their workflows move.
- `apps/yuta-display` - standalone local digital signage app with an app-owned
  database.
- `packages/ui` - shared UI components, app-shell primitives, and design tokens.
- `packages/core` - database-independent domain logic and registries.
- `packages/contracts` - transport DTOs, events, and Zod contracts.
- `packages/db-cloud` - cloud SaaS database package.
- `packages/db-pos` - local POS database package owned at runtime by
  `site-agent`.

The legacy shared `packages/db` has been removed. See
[`docs/YUTA_DATABASE_ARCHITECTURE_RESET_SPEC.md`](docs/YUTA_DATABASE_ARCHITECTURE_RESET_SPEC.md)
for the authoritative architecture and reset status. POS operational
data must never be written to or synchronized with the cloud database.

## Architecture Documentation

- [`docs/YUTA_DATABASE_ARCHITECTURE_RESET_SPEC.md`](docs/YUTA_DATABASE_ARCHITECTURE_RESET_SPEC.md) -
  authoritative database and runtime-boundary specification.
- [`docs/YUTA_DATABASE_ARCHITECTURE_AUDIT.md`](docs/YUTA_DATABASE_ARCHITECTURE_AUDIT.md) -
  current schema/consumer inventory and pre-reset entity classification.
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
pnpm dev:env:sync
pnpm dev
```

Open `http://localhost:3000` for the public website.

Public website routes, Google integration disclosures, and production content
requirements are documented in `docs/PUBLIC_WEBSITE.md`.

Useful app scripts:

```bash
pnpm dev:admin
pnpm dev:pos
pnpm dev:site-agent
pnpm dev:display
```

Start the isolated development databases from the repository root:

```bash
docker compose --project-name yuta-cloud-dev -f docker-compose.cloud.dev.yml up -d --wait
docker compose --project-name yuta-pos-dev -f docker-compose.local.dev.yml up -d --wait
docker compose --project-name yuta-display-dev -f apps/yuta-display/docker-compose.dev.yml up -d --wait
```

Use `pnpm db:reset:dev --dry-run` to inspect the guarded development reset.
The destructive command requires the explicit `CONFIRM_DB_RESET=true`
environment variable and must never be used against production.
