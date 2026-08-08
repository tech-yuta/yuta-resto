# YuTa Deployment Conventions

Status: Current

Visibility: Engineering

Owner: YUTA engineering and operations

Last updated: 2026-08-08

## Status and authority

This document implements the boundaries defined by
`docs/architecture/DATABASE_BOUNDARIES.md`. The legacy shared database topology
is forbidden.

## Runtime families

YuTa has separate cloud and restaurant-local runtime families.

### Cloud

```text
apps/web
apps/backoffice
apps/booking-web
apps/feedback-web
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

### Vercel Git deployment policy

The Vercel projects for `apps/backoffice`, `apps/web`, `apps/booking-web`, and
`apps/feedback-web` keep their GitHub repository connection, but automatic
deployments from commits are disabled.
Each Vercel project must use its application folder as the Root Directory:

```text
apps/backoffice
apps/web
apps/booking-web
apps/feedback-web
```

These folders contain a `vercel.json` with
`git.deploymentEnabled: false`. Deploy these applications manually when a
release is ready. Do not remove this setting unless automatic preview and
production deployments are intentionally re-enabled.

The existing restaurant application must keep a single Vercel project with
these settings:

```text
Project name:   yuta-backoffice
Root Directory: apps/backoffice
Domain:         app.yutapro.fr
```

`admin.yutapro.fr` is reserved for the future `apps/platform-admin` application
and must not be attached to the restaurant back-office. Set
`NEXT_PUBLIC_APP_URL=https://app.yutapro.fr` for the back-office and
`NEXT_PUBLIC_BACKOFFICE_URL=https://app.yutapro.fr` for links from `apps/web`.
The Google Business Profile OAuth callback is
`https://app.yutapro.fr/api/reputation/google/oauth/callback`. Back-office
session cookies remain host-only; do not set a shared `.yutapro.fr` cookie
domain.

The public booking application uses a separate project and domain:

```text
Project name:   yuta-booking-web
Root Directory: apps/booking-web
Domain:         reservation.yutapro.fr
```

Set `CLOUD_DATABASE_URL`, `CLOUD_DATABASE_SSL`,
`PUBLIC_BOOKING_BASE_URL=https://reservation.yutapro.fr`, and a unique
`BOOKING_RATE_LIMIT_SECRET` of at least 32 random characters. The booking app
validates all four values during server startup and production build. It
receives no authentication cookie secret and no local POS/display database
URL. Its `vercel.json` also disables automatic Git deployments.

Reservation transactions currently write a provider-neutral notification
outbox, but this repository has no configured email adapter or worker. Do not
claim confirmation-email delivery or launch it as an active dependency until
an approved cloud worker atomically claims the outbox, records `SENT` or
`FAILED`, and has an operational retry and observability owner.

Before a public-booking production launch, operations must also verify the
Vercel project, DNS/TLS, production secrets and rotation ownership, cloud
migration journal, managed-database backup/PITR and restore evidence, external
health probes, telemetry/alerts, approved privacy/legal copy, and a named
release owner. The authoritative current dependency and acceptance register is
`docs/features/public-booking/STATUS.md`; do not duplicate provider choices or
temporary owner assignments here.

The public feedback application uses a separate project:

```text
Project name:   yuta-feedback-web
Root Directory: apps/feedback-web
Service domain: feedback.yutapro.fr
Tenant traffic: verified restaurant hostnames from tenant_domains
```

The service domain exposes the unscoped landing page and health endpoint. A
production feedback submission is accepted only when its request hostname is
an active verified tenant domain routed to this project and its path slug
matches the restaurant's reputation settings. Set a unique
`PUBLIC_FEEDBACK_IP_HASH_SALT` of at least 32 random characters. The feedback
app receives `CLOUD_DATABASE_URL`, but no authentication cookie secret and no
local POS/display database URL. Its `vercel.json` disables automatic Git
deployments.

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
PUBLIC_BOOKING_BASE_URL=https://reservation.yutapro.fr
BOOKING_RATE_LIMIT_SECRET=...
PUBLIC_FEEDBACK_IP_HASH_SALT=...
```

Only cloud server processes receive these values.

### POS local server

```env
POS_DATABASE_URL=postgres://yuta_pos:encoded_password@pos-db:5432/yuta_pos
SITE_AGENT_HOST=0.0.0.0
SITE_AGENT_PORT=3100
SITE_AGENT_ALLOWED_ORIGIN=https://pos.restaurant.local
SITE_AGENT_URL=http://site-agent:3100
POS_PRINTER_DEVICE=/dev/rfcomm1
POS_PRINT_POLL_INTERVAL_MS=1000
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

`POS_PRINTER_DEVICE` is local device configuration, never browser input. At
Luna, the Linux host pairs the single EPSON TM-m30 as a trusted Bluetooth
device and a systemd service keeps RFCOMM channel 1 available as
`/dev/rfcomm1`. The path must be a character device owned by `root:dialout`.
Run `site-agent` on the host with `dialout` access, or pass the character device
and the host `dialout` group into its trusted local container. Do not expose the
RFCOMM device to the POS browser container.

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

Development databases use separate root Compose files and explicit project
names:

```bash
docker compose --project-name yuta-cloud-dev -f docker-compose.cloud.dev.yml up -d --wait
docker compose --project-name yuta-pos-dev -f docker-compose.local.dev.yml up -d --wait
docker compose --project-name yuta-display-dev -f apps/yuta-display/docker-compose.dev.yml up -d --wait
```

These files expose PostgreSQL only for local development on ports `55431`,
`55432`, and `55433` respectively. They do not represent the production
topology.

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
After the baseline, apply feature migrations in journal order. POS local
authentication starts with `packages/db-pos/drizzle/0001_local_auth.sql`.

Supply unique four-to-eight-digit `YUTA_POS_SEED_ADMIN_PIN`,
`YUTA_POS_SEED_STAFF_PIN`, and `YUTA_POS_SEED_KITCHEN_PIN` values to the
explicit POS seed maintenance job. PINs are not runtime environment variables
and are stored only as scrypt hashes.

Cloud and POS seed jobs are separate maintenance operations. A cloud seed job
receives `CLOUD_DATABASE_URL` and `YUTA_CLOUD_SEED_PASSWORD`; a POS seed job
receives `POS_DATABASE_URL` and the three seed PIN variables. Do not include
either seed in normal application startup,
and do not run a seed automatically during production deployment. The POS seed
is the approved Luna operating catalog; it is still an explicit maintenance
operation because rerunning it can overwrite current catalog configuration.

For a specifically approved clean Luna commissioning, stop POS writes, take
and verify a final POS-only backup, resolve the exact POS database or volume on
the host, recreate only that POS database, apply every `db-pos` migration, and
run the explicit POS seed once. Never remove a volume by a broad name or reset
cloud/display storage. Start `site-agent` and the POS only after the seeded
catalog and the unavailable zero-price Saturday special have been verified.

The optional `pnpm db:cloud:seed:demo` command is only for local databases or
explicitly approved demo environments. It requires
`CONFIRM_CLOUD_DEMO_SEED=true`, assumes the normal cloud foundation seed has
already run, and must never be included in application startup, migrations, or
customer production deployments.

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

For the selected Luna printer transport, verify before starting `site-agent`:

```bash
systemctl is-active yuta-tm-m30.service
rfcomm
test -c /dev/rfcomm1
```

The expected RFCOMM peer is `00:01:90:7B:79:DD` on channel `1`. The systemd
unit creates a persistent `rfcomm bind` for that peer; it must not keep the TTY
open with `rfcomm connect`. The binding establishes the Bluetooth connection
when `site-agent` opens `/dev/rfcomm1`. The worker writes each ESC/POS job with
one device open and does not run `stty` first, because opening a bound RFCOMM
TTY twice can leave the second open blocked or make a connected TTY report
`Device or resource busy`. If the printer is unavailable, the worker marks the
claimed job failed and an administrator can retry it from
`/management/printing` after recovery.

`apps/yuta-pos/docker-compose.yml` now builds only the POS client service. It
requires `SITE_AGENT_URL` and joins the external trusted local network; it has
no database credential, legacy print worker, or shared-database migration
service. Deploy `site-agent` and the one-shot `@yuta/db-pos` migration service
as separate local services.

The cloud back-office must not expose local menu/catalog, printer, POS-user, order,
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
- The current booking-web `/api/health` response is process liveness only; it
  does not prove database readiness or successful booking queries. Do not use
  it as the sole production readiness gate until an approved dependency-safe
  readiness contract is implemented and externally monitored.
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
- Run `pnpm test:pos:offline` to confirm POS works with Internet/cloud disabled.
- Confirm display reads and writes only its standalone DB.
- Verify backup and restore procedures for local data.
- Update this document whenever deployment topology or operational rules
  change.
