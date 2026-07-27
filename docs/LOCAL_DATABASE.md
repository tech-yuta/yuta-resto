# Local Database Development

## Status

This document describes the target database-development workflow defined by
`docs/YUTA_DATABASE_ARCHITECTURE_RESET_SPEC.md`.

The legacy `packages/db`, its migration history, and runtime `DATABASE_URL`
contract have been removed. Cloud and POS database commands now target only
their explicit packages and connection variables.

`apps/yuta-pos` has completed its runtime cutover: its source, image, and
runtime service use `SITE_AGENT_URL` and receive no database connection string.
Remaining legacy database consumers belong to other migration checkpoints.

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
├── pos-db (yuta_pos)
├── site-agent
└── yuta-pos

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

## Schema workflow during the reset

While the new schemas are being designed, use disposable development
databases and schema push commands:

```bash
pnpm db:cloud:push
pnpm db:pos:push
pnpm --filter @yuta/display db:push
```

Do not generate a chain of compatibility migrations from the legacy shared
schema. Do not backfill legacy development data.

After the target schemas are accepted:

1. Reset all disposable development databases.
2. Delete temporary generated migrations.
3. Generate `packages/db-cloud/drizzle/0000_initial.sql`.
4. Generate `packages/db-pos/drizzle/0000_initial.sql`.
5. Generate `apps/yuta-display/drizzle/0000_initial.sql`.
6. Create fresh databases using migrations only.
7. Run architecture, database, and integration tests.

## Root scripts

The code reset must provide:

```text
db:cloud:push
db:cloud:generate
db:cloud:migrate
db:cloud:seed
db:pos:push
db:pos:generate
db:pos:migrate
db:pos:seed
db:reset:dev
architecture:check
```

Display migration scripts remain in `@yuta/display` because its database has
only one owning application.

## Guarded development reset

`db:reset:dev` must:

- refuse to run when `NODE_ENV=production`;
- require `CONFIRM_DB_RESET=true`;
- target only explicitly named development services and volumes;
- recreate separate cloud, POS, and display development databases;
- apply current schemas or baseline migrations;
- optionally seed clearly marked development data.

Never add a production reset script.

Conceptual usage after implementation:

```bash
CONFIRM_DB_RESET=true pnpm db:reset:dev
```

On PowerShell:

```powershell
$env:CONFIRM_DB_RESET = 'true'
pnpm db:reset:dev
Remove-Item Env:CONFIRM_DB_RESET
```

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

Before the first real deployment, verify:

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
