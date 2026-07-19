# Local Database

This document describes the local development database for YuTa operations apps such as `apps/yuta-pos` and `apps/admin`.

Production is different. On the mini server, YuTa apps must use the existing `luna-postgres` container and the external `postgres_default` Docker network. Follow `docs/DEPLOYMENT.md` for production.

## Local Development

Start a dedicated PostgreSQL container from the repository root:

```bash
docker compose -f docker-compose.db.dev.yml up -d
```

Default local connection:

```env
DATABASE_URL=postgres://yuta:yuta@localhost:55433/yuta_resto
```

Create `packages/db/.env.local` with that value:

```env
DATABASE_URL=postgres://yuta:yuta@localhost:55433/yuta_resto
```

Run migrations:

```bash
corepack pnpm --filter @yuta/db db:migrate
```

When menu pricing schema changes, run migrations before re-importing Luna menu
data. Dynamic Luna formulas such as `Menu Express`, `Menu Gourmand`, and
`Combo Ete` require the combo pricing columns added after the initial POS
schema:

```bash
corepack pnpm --filter @yuta/db db:migrate
corepack pnpm --filter @yuta/db tsx src/import-luna-menu.ts
```

Seed development data:

```bash
corepack pnpm --filter @yuta/db db:seed
```

The seed is idempotent. It creates the initial multi-tenant records before the
existing POS sample data:

- Organization: `FAST VIET`.
- Establishment: `LUNA Chasseneuil-du-Poitou`.
- Development domain: `luna.localhost`.
- Public entitlements: `menu.public` and `reservations.public`.
- Memberships for the seeded admin, staff, and kitchen users.

Use `luna.localhost` explicitly when testing public hostname resolution.
Unknown hosts intentionally return `TENANT_NOT_FOUND`; there is no fallback to
the LUNA tenant.

Stop the local database:

```bash
docker compose -f docker-compose.db.dev.yml down
```

Remove local database data and start fresh:

```bash
docker compose -f docker-compose.db.dev.yml down -v
```

## Local Defaults

```txt
Container: yuta-postgres-dev
Database:  yuta_resto
User:      yuta
Password:  yuta
Host port: 55433
```

The host port is `55433` to avoid conflicts with a local PostgreSQL server or other projects using port `5432` or `5433`.

If Windows reserves that port range, Docker may fail with a message like `ports are not available`. Use another free host port and keep app env files in sync:

```powershell
$env:POSTGRES_PORT='15432'
docker compose -f docker-compose.db.dev.yml up -d --force-recreate postgres
```

```env
DATABASE_URL=postgres://yuta:yuta@localhost:15432/yuta_resto
```

## Production Reminder

Do not use `docker-compose.db.dev.yml` in production.

Production apps should use:

```env
DATABASE_URL=postgres://yuta:encoded_password@luna-postgres:5432/yuta_resto
POSTGRES_NETWORK=postgres_default
```

Production compose files belong next to each app, for example:

```txt
apps/yuta-pos/docker-compose.yml
apps/yuta-pos/.env.production
```
