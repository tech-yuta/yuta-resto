# YuTa Production Deployment Conventions

These conventions apply to YuTa apps deployed on the Luna mini server.

## PostgreSQL

Production apps should use the existing PostgreSQL container unless there is a
clear reason to provision a separate database server.

- Existing PostgreSQL container: `luna-postgres`
- Existing PostgreSQL Docker network: `postgres_default`
- Do not use container IP addresses such as `172.x.x.x`; they can change.
- Use Docker hostnames on the shared Docker network.

Each app should use its own database in the shared PostgreSQL server:

```txt
luna_display
yuta_resto
yuta_reservation
yuta_crm
```

Example production env:

```env
DATABASE_URL=postgres://yuta:encoded_password@luna-postgres:5432/luna_display
POSTGRES_NETWORK=postgres_default
```

## Environment Files

Keep production env files next to the app:

```txt
apps/<app-name>/.env.production
```

Do not commit `.env.production`.

Run Docker Compose from the repository root and pass the env file explicitly:

```bash
docker compose --env-file apps/<app-name>/.env.production -f apps/<app-name>/docker-compose.yml up -d --build <service>
```

## Docker Compose

Production app compose files should join the existing PostgreSQL network:

```yaml
networks:
  postgres:
    name: ${POSTGRES_NETWORK:-postgres_default}
    external: true
```

App and migration services should use that network:

```yaml
services:
  app:
    networks:
      - postgres

  migrate:
    networks:
      - postgres
```

## Migrations

Use a one-shot migration service instead of running database migrations manually
inside the app container.

Always rebuild the migration image before running migrations so the latest
migration files are included:

```bash
docker compose --env-file apps/<app-name>/.env.production -f apps/<app-name>/docker-compose.yml --profile migrate run --rm --build migrate
```

For Drizzle apps, make sure migration folders such as `drizzle/` are not
excluded from the Docker build context.

## Uploads

If operators need to inspect uploaded files on the mini server, use a bind mount
to the app source folder instead of a named Docker volume:

```yaml
volumes:
  - ./public/uploads/<app>:/app/apps/<app-name>/public/uploads/<app>
```

Keep upload directories in Git with `.gitkeep`, but ignore uploaded media:

```gitignore
public/uploads/<app>/*
!public/uploads/<app>/.gitkeep
```

## Next.js Runtime Uploads

For uploaded files created at runtime, do not rely only on the static `public/`
copy inside the production image. If a URL such as `/uploads/<app>/<filename>`
returns `404` even though the file exists on disk, add an App Router `GET`
route that reads from `UPLOAD_DIR` and returns the file.

This keeps file serving aligned with the same runtime path used by the upload
API.

## Typical Update Flows

Code-only update:

```bash
cd /opt/luna/source/yuta-resto
git pull
docker compose --env-file apps/<app-name>/.env.production -f apps/<app-name>/docker-compose.yml up -d --build <service>
```

Code and database update:

```bash
cd /opt/luna/source/yuta-resto
git pull
docker compose --env-file apps/<app-name>/.env.production -f apps/<app-name>/docker-compose.yml --profile migrate run --rm --build migrate
docker compose --env-file apps/<app-name>/.env.production -f apps/<app-name>/docker-compose.yml up -d --build <service>
```

## YuTa Admin authentication

Admin deployments must provide:

```env
DATABASE_URL=postgres://yuta:encoded_password@luna-postgres:5432/yuta_resto
AUTH_SECRET=replace-with-at-least-32-random-characters
NEXT_PUBLIC_ADMIN_URL=https://admin.example.com
```

`AUTH_SECRET` must be generated independently per environment and must not be
committed. Apply database migration `0008_elite_the_twelve.sql` before starting
an admin build that uses server-side sessions. Production seeding additionally
requires `YUTA_SEED_ADMIN_PASSWORD`; routine application startup does not.

## YuTa POS

`apps/yuta-pos` deploys as a standalone Next.js container and uses the shared
`packages/db` migrations.

The approved long-term availability target is restaurant-edge operation: POS,
PostgreSQL, and the print worker remain reachable over the restaurant network
during an Internet outage. The detailed phase-1 and phase-2 requirements,
acceptance tests, and deferred cloud-sync design are recorded in
`docs/POS_OFFLINE_STRATEGY.md`. Those roadmap requirements do not replace the
current commands below until the corresponding deployment changes are
implemented and verified.

Production env file:

```txt
apps/yuta-pos/.env.production
```

Required values:

```env
DATABASE_URL=postgres://yuta:encoded_password@luna-postgres:5432/yuta_resto
POSTGRES_NETWORK=postgres_default
POS_PORT=3003
NEXT_PUBLIC_POS_URL=https://pos.example.com
```

Start from `apps/yuta-pos/.env.production.example`. Optional edge-operation
values include:

```env
POS_INTERNET_CHECK_URL=https://connectivity-endpoint.example.com/health
PRINT_OUTPUT_DIR=./.tmp/prints
PRINT_WORKER_BATCH_SIZE=10
PRINT_WORKER_INTERVAL_MS=3000
PRINT_WORKER_FAIL_RATE=0
POS_BACKUP_DIR=/srv/backups/yuta-pos
POS_BACKUP_RETENTION_DAYS=14
```

Use an Internet-check endpoint controlled by the operator where possible. The
endpoint is used only for the operator status strip; POS container readiness
does not depend on it.

Deploy or update POS:

```bash
cd /opt/luna/source/yuta-resto
git pull
docker compose --env-file apps/yuta-pos/.env.production -f apps/yuta-pos/docker-compose.yml --profile migrate run --rm --build migrate
docker compose --env-file apps/yuta-pos/.env.production -f apps/yuta-pos/docker-compose.yml up -d --build pos print-worker
```

Check status:

```bash
docker compose --env-file apps/yuta-pos/.env.production -f apps/yuta-pos/docker-compose.yml ps pos print-worker
docker compose --env-file apps/yuta-pos/.env.production -f apps/yuta-pos/docker-compose.yml logs --tail=100 pos
docker compose --env-file apps/yuta-pos/.env.production -f apps/yuta-pos/docker-compose.yml logs --tail=100 print-worker
```

The POS container is healthy only when the application can query PostgreSQL.
The print worker is healthy only while its database-poll heartbeat is current.
An Internet outage by itself must not make either container unhealthy.

### POS Local Hostname And HTTPS

Give the restaurant edge server a stable LAN address and local hostname. Route
that hostname to the POS container through the site's HTTPS reverse proxy. POS
terminals and kitchen displays must resolve the hostname without public DNS so
an Internet outage does not prevent local access.

The certificate must be trusted by every POS device. Installing the PWA from a
raw LAN IP or an untrusted certificate is not an accepted production setup.

### POS Database Backup

The repository provides a host-side custom-format PostgreSQL backup script. The
backup directory must be absolute and should be on storage outside the primary
database disk.

Load the production environment with the site's secret-management procedure,
then run:

```bash
sh apps/yuta-pos/scripts/backup-db.sh
```

The script writes a timestamped `.dump` file and SHA-256 checksum, removes only
matching YuTa POS backup files older than `POS_BACKUP_RETENTION_DAYS`, and
refuses `/`, a relative path, or the current home directory as a target.

Schedule this command from the host scheduler. Monitor its exit code and copy
backups to a second encrypted device or location according to the restaurant's
retention policy.

### POS Database Restore Drill

Never test restoration against the active production database. Create an empty
restore-drill database, export its URL as `POS_RESTORE_DATABASE_URL`, and run:

```bash
sh apps/yuta-pos/scripts/restore-db.sh --confirm /absolute/path/to/yuta-pos-YYYYMMDDTHHMMSSZ.dump
```

The restore script requires the explicit `--confirm` flag, verifies the
checksum when present, and may replace existing objects in the target database.
After restoration, run current migrations and the offline acceptance checks.
