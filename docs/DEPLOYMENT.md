# YuTa Deployment Conventions

## Status and authority

This document describes the target deployment boundaries defined by
`docs/YUTA_DATABASE_ARCHITECTURE_RESET_SPEC.md`.

Existing compose files still reflect parts of the legacy shared-database
architecture and must be updated during the code phase. Do not deploy the
legacy topology as the first real production architecture.

## Runtime families

YuTa has separate cloud and restaurant-local runtime families.

### Cloud

```text
apps/web
apps/admin
optional cloud worker
        |
packages/db-cloud
        |
managed cloud PostgreSQL
```

Cloud is multi-organization. It owns authentication, organizations,
establishments, memberships, reputation/Google integrations, reservations,
subscriptions, and other SaaS-only data.

Cloud must contain no POS operational tables.

### Restaurant local

```text
apps/yuta-pos --> apps/site-agent --> packages/db-pos --> local PostgreSQL
                           |
                           +--> printers/devices/backups
```

The local stack must operate without Internet or cloud availability.
`site-agent` must never receive a cloud database connection string.

### Standalone display

```text
apps/yuta-display --> apps/yuta-display/src/db --> display database
```

The display database is app-owned and independent from cloud and POS. Do not
create `packages/db-display` unless another legitimate server-side consumer
appears.

## Database isolation

Cloud, POS, and display databases must not share:

- a database name;
- a database user in real deployment;
- credentials;
- a Docker volume;
- migration files;
- a Drizzle configuration;
- application environment files.

They may use the same PostgreSQL server or Docker network on a mini server when
operationally appropriate, but logical isolation remains mandatory.

Use Docker service/container hostnames, never container IP addresses.

## Environment files

Keep production environment files next to the owning application and do not
commit them.

### Cloud

```env
CLOUD_DATABASE_URL=postgres://yuta_cloud:encoded_password@cloud-db:5432/yuta_cloud
CLOUD_DATABASE_SSL=true
AUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_TOKEN_ENCRYPTION_KEY=...
```

Only cloud server processes receive these values.

### POS local server

```env
POS_DATABASE_URL=postgres://yuta_pos:encoded_password@pos-db:5432/yuta_pos
SITE_AGENT_HOST=0.0.0.0
SITE_AGENT_PORT=3100
SITE_AGENT_ALLOWED_ORIGIN=https://pos.restaurant.local
SITE_AGENT_URL=http://site-agent:3100
YUTA_INSTALLATION_ID=...
YUTA_SITE_ID=...
LOCAL_BACKUP_PATH=/var/backups/yuta-pos
```

Only `site-agent` and one-shot POS migration/maintenance services receive
`POS_DATABASE_URL`. The POS browser/client receives no DB connection string.
The server side of `apps/yuta-pos` receives `SITE_AGENT_URL`; do not expose it
as a `NEXT_PUBLIC_*` variable.
`SITE_AGENT_ALLOWED_ORIGIN` must be the exact POS client origin; do not use a
wildcard origin. Bind `SITE_AGENT_HOST=0.0.0.0` only inside the trusted local
container or LAN boundary.

### Standalone display

```env
DISPLAY_DATABASE_URL=postgres://yuta_display:encoded_password@display-db:5432/yuta_display
UPLOAD_DIR=/app/uploads/display
```

Only display server code and its migration service receive
`DISPLAY_DATABASE_URL`.

No application environment file may contain both cloud and POS database URLs.

## Docker networks

Local apps may join the existing external network:

```env
POSTGRES_NETWORK=postgres_default
```

Example:

```yaml
networks:
  postgres:
    external: true
    name: ${POSTGRES_NETWORK:-postgres_default}
```

Joining the same Docker network does not authorize cross-database access.
Create separate database users and grant each only its own database.

## Compose invocation

Run Compose from the repository root and pass the intended environment file
explicitly:

```bash
docker compose \
  --env-file apps/<app-name>/.env.production \
  -f apps/<app-name>/docker-compose.yml \
  <command>
```

Use a one-shot `migrate` service. Run it with `--build` so the image contains
the latest migration files:

```bash
docker compose \
  --env-file apps/<app-name>/.env.production \
  -f apps/<app-name>/docker-compose.yml \
  --profile migrate run --rm --build migrate
```

Each migrate service must receive only the connection string for its own
database boundary.

## Initial migrations

Before the first real deployment:

- cloud uses `packages/db-cloud/drizzle/0000_initial.sql`;
- POS uses `packages/db-pos/drizzle/0000_initial.sql`;
- display uses `apps/yuta-display/drizzle/0000_initial.sql`.

Do not deploy legacy shared migrations or compatibility/backfill migrations.

Test every baseline against an empty database before production.

Cloud and POS seed jobs are separate maintenance operations. A cloud seed job
receives only `CLOUD_DATABASE_URL`; a POS seed job receives only
`POS_DATABASE_URL`. Do not include either seed in normal application startup,
and do not run development fixtures automatically during production
deployment.

## POS deployment requirements

The local POS deployment must:

- start the POS database, `site-agent`, POS client, and required printer/device
  services;
- expose PostgreSQL only inside the trusted Docker/LAN boundary;
- bind `site-agent` only to configured trusted interfaces;
- keep operational data local;
- remain functional when cloud services and Internet are unavailable;
- persist printer jobs and device state locally;
- provide guarded backup and restore procedures;
- never start a POS-to-cloud synchronization worker.

`apps/yuta-pos/docker-compose.yml` now builds only the POS client service. It
requires `SITE_AGENT_URL` and joins the external trusted local network; it has
no database credential, legacy print worker, or shared-database migration
service. Deploy `site-agent` and the one-shot `@yuta/db-pos` migration service
as separate local services.

Cloud admin must not expose local menu/catalog, printer, POS-user, order,
payment, or operational-report workflows.

## Display deployment requirements

Display remains standalone and owns its media database and uploads.

- Use `DISPLAY_DATABASE_URL`, not the ambiguous `DATABASE_URL`.
- Keep display credentials separate from POS and cloud credentials.
- Keep runtime upload directories in the repository with `.gitkeep` only.
- Ignore uploaded media files.
- Mount a persistent upload volume.
- In Next.js standalone mode, serve uploaded files through a `GET` route when
  static-file lookup would otherwise return `404`.

App-specific display procedures remain in `apps/yuta-display/DEPLOY.md` and
must follow these boundary rules.

## Backup and restore

### POS

- Back up only the POS database with POS credentials.
- Store backups outside the primary DB disk.
- Encrypt off-device backups.
- Record and verify a checksum.
- Restore only into an explicitly named drill or replacement database.
- Require a separate restore URL such as `POS_RESTORE_DATABASE_URL`.
- Never point a restore command at the active database without an explicit,
  reviewed recovery procedure.

### Display

Back up both the display database and upload volume. A database-only backup is
insufficient because media files live outside PostgreSQL.

### Cloud

Use the managed provider's backup, point-in-time recovery, encryption, and
access-control facilities. Do not copy POS operational data into cloud backups.

## Health checks

- Cloud health checks validate only cloud runtime dependencies.
- `site-agent` health validates the local API, POS DB, and relevant device
  subsystems.
- POS health must not fail merely because Internet or cloud is unavailable.
- Display health validates only display-owned dependencies.
- Do not log credentials or full connection strings.

## Release checklist

Before a production release:

- Confirm the process receives only its permitted database URL.
- Run the correct one-shot migration service.
- Verify the active schema originated from its own `0000_initial`.
- Confirm browser bundles contain no database URL.
- Confirm cloud schema has no POS operational tables.
- Confirm POS works with Internet/cloud disabled.
- Confirm display reads and writes only its standalone DB.
- Verify backup and restore procedures for local data.
- Update this document whenever deployment topology or operational rules
  change.
