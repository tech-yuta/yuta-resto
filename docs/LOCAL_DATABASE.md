# Local Database Development

## Status

This document describes the target database-development workflow defined by
`docs/YUTA_DATABASE_ARCHITECTURE_RESET_SPEC.md`.

The legacy `packages/db`, its migration history, and runtime `DATABASE_URL`
contract have been removed. Cloud and POS database commands now target only
their explicit packages and connection variables.

The destructive development reset completed on 2026-07-28. The legacy shared
and display volumes were deleted, and the cloud, POS, and display databases
were recreated from their separate `0000_initial` baselines without seed data.
The cloud development seed was then applied to create the initial organization,
establishment, owner account, membership, entitlements, and reputation
settings. POS and display remain unseeded.

`apps/yuta-pos` has completed its runtime cutover: its source, image, and
runtime service use `SITE_AGENT_URL` and receive no database connection string.

## Database boundaries

Development uses three isolated database boundaries:

| Boundary           | Owner                                 | Connection variable    | Data                                                                |
| ------------------ | ------------------------------------- | ---------------------- | ------------------------------------------------------------------- |
| Cloud              | `packages/db-cloud`                   | `CLOUD_DATABASE_URL`   | Auth, organizations, establishments, reputation, reservations, SaaS |
| Local POS          | `apps/site-agent` + `packages/db-pos` | `POS_DATABASE_URL`     | Orders, payments, kitchen, printers, local users, local catalog     |
| Standalone display | `apps/yuta-display/src/db`            | `DISPLAY_DATABASE_URL` | Display-owned media and playlist state                              |

They must not share a database name, Docker volume, migration directory, or
Drizzle configuration.

The POS and display databases are independent even when they run on the same
local PostgreSQL server.

## Target development topology

```text
docker-compose.cloud.dev.yml
└── cloud-db (yuta_cloud)

docker-compose.local.dev.yml
└── pos-db (yuta_pos)

apps/yuta-display/docker-compose.dev.yml
└── display-db (yuta_display)
```

Example local-only connection values:

```env
CLOUD_DATABASE_URL=postgres://yuta_cloud:yuta_cloud@localhost:55431/yuta_cloud
POS_DATABASE_URL=postgres://yuta_pos:yuta_pos@localhost:55432/yuta_pos
DISPLAY_DATABASE_URL=postgres://yuta_display:yuta_display@localhost:55433/yuta_display
```

These are development examples only. Do not reuse development credentials in
production.

After cloning the repository or resetting development databases, synchronize
ignored `.env.local` files without printing their secrets:

```bash
pnpm dev:env:sync
```

The command updates only development files, removes obsolete generic
`DATABASE_URL` and `DISABLE_AUTH` keys, and refuses to run when
`NODE_ENV=production`. It never edits `.env.production`.

## Environment ownership

- Cloud server code may receive `CLOUD_DATABASE_URL`.
- Only `site-agent` may receive `POS_DATABASE_URL`.
- POS browser/client code receives no database URL.
- Standalone display server code may receive `DISPLAY_DATABASE_URL`.
- No application environment file may contain both cloud and POS connection
  strings.
- A root orchestration file may reference multiple URLs only when it does not
  expose them to application bundles.
- Validate runtime environment variables with Zod at startup.

The initial local API uses:

```env
SITE_AGENT_HOST=127.0.0.1
SITE_AGENT_PORT=3004
SITE_AGENT_ALLOWED_ORIGIN=http://localhost:3003

# Server-side URL used by apps/yuta-pos; never expose it as NEXT_PUBLIC_*
SITE_AGENT_URL=http://127.0.0.1:3004
```

Run `pnpm dev:site-agent` after the POS database schema is available. The
service validates `POS_DATABASE_URL` at startup and exposes `/health`; it does
not receive `CLOUD_DATABASE_URL`. The POS health endpoint now checks this local
API instead of opening a database connection for its connectivity probe.

## Schema workflow

Use schema push only for disposable design databases:

```bash
pnpm db:cloud:push
pnpm db:pos:push
pnpm --filter @yuta/display db:push
```

Do not generate a chain of compatibility migrations from the legacy shared
schema. Do not backfill legacy development data.

All active database boundaries now have committed clean baselines:

- `packages/db-cloud/drizzle/0000_initial.sql` creates the 17-table cloud
  boundary;
- `packages/db-pos/drizzle/0000_initial.sql` creates the 16-table local POS
  boundary;
- both baselines have been applied with `db:migrate` to empty PostgreSQL
  databases;
- both seeds are idempotent and their guarded integration suites pass on those
  migrated databases.
- `apps/yuta-display/drizzle/0000_initial.sql` creates the standalone
  app-owned `display_media` table, uses application-generated UUIDv7 IDs, and
  has been verified through migrate plus CRUD on an empty PostgreSQL database.

## Root scripts

The root provides explicit database commands for the cloud and POS boundaries:

```text
db:cloud:push
db:cloud:generate
db:cloud:migrate
db:cloud:seed
db:cloud:seed:demo
db:pos:push
db:pos:generate
db:pos:migrate
db:pos:seed
db:reset:dev
architecture:check
```

Display migration scripts remain in `@yuta/display` because its database has
only one owning application.

Run `pnpm architecture:check` before pushing changes. The same command runs in
CI and rejects legacy `@yuta/db` usage, cross-runtime imports, generic
`DATABASE_URL` configuration, database dependencies in client modules, and
invalid migration baselines.

## Guarded development reset

Preview the exact commands and targets without changing Docker state:

```bash
pnpm db:reset:dev --dry-run
```

The script targets only these development Compose projects:

- `yuta-cloud-dev` through `docker-compose.cloud.dev.yml`;
- `yuta-pos-dev` through `docker-compose.local.dev.yml`;
- `yuta-display-dev` through
  `apps/yuta-display/docker-compose.dev.yml`.

It also removes the explicitly named legacy development containers and volumes
reported by the reset audit. It never discovers targets through a wildcard.

An actual reset is destructive and requires:

```bash
CONFIRM_DB_RESET=true pnpm db:reset:dev
```

On PowerShell:

```powershell
$env:CONFIRM_DB_RESET = 'true'
pnpm db:reset:dev
Remove-Item Env:CONFIRM_DB_RESET
```

The command refuses to run when `NODE_ENV=production`, recreates all three
databases from their `0000_initial` migrations, and leaves seed data disabled
by default. To seed the cloud and POS development databases after migration,
also set `SEED_DB_RESET=true`. The display boundary currently has no seed.

Never add or use a production reset script.

## Seed ownership

The new packages now expose independent seed commands:

```bash
pnpm db:cloud:seed
pnpm db:pos:seed
```

The cloud seed requires `CLOUD_DATABASE_URL`. It creates or updates:

- the initial organization and establishment;
- the development hostname and cloud entitlements;
- one cloud owner account and membership;
- the initial reputation settings.

Set `YUTA_CLOUD_SEED_ADMIN_PASSWORD` to override the development password. It
is mandatory when `NODE_ENV=production`.

The POS seed requires `POS_DATABASE_URL`. It creates or updates:

- local admin, staff, and kitchen identities;
- categories and products;
- combo rules and their item groups.

The POS seed does not create cloud users, tenant memberships, reputation data,
sample orders, payment history, print jobs, or device credentials. Local PIN
authentication will be added with `site-agent`; the current seed does not
invent a temporary password model.

Both seeds generate new business IDs with UUIDv7 in application code and are
idempotent through stable natural keys.

### Cloud reputation demo data

After the normal cloud seed has created the development organization,
establishment, and owner, an optional guarded seed can populate the admin
`customers/reviews` page:

```powershell
$env:CONFIRM_CLOUD_DEMO_SEED = 'true'
pnpm db:cloud:seed:demo
Remove-Item Env:CONFIRM_CLOUD_DEMO_SEED
```

The demo seed creates a small, idempotent set of Google and direct feedback,
published and draft replies, internal notes, and direct-feedback details. Demo
feedback is marked with `providerMetadata.demo = true`, so it remains
distinguishable from imported or customer-created records.

The command refuses to run without `CONFIRM_CLOUD_DEMO_SEED=true` and requires
the normal cloud foundation seed to exist first. Run it only against a local
database or an explicitly approved demo environment. Never run it against a
customer or production database.

Display seed data may include placeholder media records only when the
corresponding local files exist.

Never seed Google OAuth tokens. Never use the cloud organization seed to
initialize POS data.

## Integration-test guard

Database integration tests are boundary-specific and disabled by default. Run
them only against disposable databases with the matching URL and an explicit
confirmation:

```powershell
$env:YUTA_ALLOW_DATABASE_INTEGRATION_TESTS = 'true'
$env:CLOUD_DATABASE_URL = 'postgres://.../yuta_cloud_test'
pnpm test:db-cloud

$env:POS_DATABASE_URL = 'postgres://.../yuta_pos_test'
pnpm test:db-pos
pnpm test:site-agent

Remove-Item Env:YUTA_ALLOW_DATABASE_INTEGRATION_TESTS
```

Never set the integration-test confirmation flag in a production environment.

## Fresh-install verification

Run the repeatable offline POS acceptance test:

```powershell
pnpm test:pos:offline
```

The command creates a disposable PostgreSQL 17 container backed by `tmpfs`,
applies `db-pos/0000_initial`, seeds local data, builds and starts the POS,
starts `site-agent` without cloud configuration, creates an order through the
local API, and verifies that POS health remains available while the Internet
probe is unavailable. It removes its processes and disposable container on
success or failure. Ports `3003` and `3004` must be free.

Before the first real deployment, also verify:

- each active boundary builds from its own `0000_initial`;
- cloud schema contains no POS operational tables;
- POS schema contains no cloud auth, OAuth, organization-membership, or
  subscription tables;
- display schema contains no POS mirror tables;
- POS operates when cloud services and Internet are unavailable;
- no client bundle contains a DB client or connection string;
- UUIDv7 business IDs are generated by application/service code.

## Boundary verification

Runtime source and workspace dependencies must not reference `packages/db`,
`@yuta/db`, or the generic `DATABASE_URL`. Historical design documents may
mention them only when describing the completed migration.
