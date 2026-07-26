# Local Database Development

## Status

This document describes the target database-development workflow defined by
`docs/YUTA_DATABASE_ARCHITECTURE_RESET_SPEC.md`.

The repository still contains the legacy `packages/db`, migration history, and
`DATABASE_URL` usage. Those commands remain transitional until the code reset
is implemented. Do not add new schema or migrations to the legacy package.

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
db:pos:push
db:pos:generate
db:pos:migrate
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

Cloud seed data may include:

- a demo organization;
- a demo establishment;
- a cloud owner user and membership;
- demo feature flags;
- clearly marked mock reviews.

POS seed data may include:

- a local restaurant profile;
- tables, categories, products, and combo rules;
- local employee roles;
- printer placeholders;
- sample development orders.

Display seed data may include placeholder media records only when the
corresponding local files exist.

Never seed Google OAuth tokens. Never use the cloud organization seed to
initialize POS data.

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

## Legacy warning

Until the code phase is complete, searches will still find:

```text
packages/db
@yuta/db
DATABASE_URL
```

Their presence records unfinished implementation work, not an approved
architecture. New code must target the explicit database boundaries above.
