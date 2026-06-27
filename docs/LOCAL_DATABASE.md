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
DATABASE_URL=postgres://yuta:yuta@localhost:55433/yuta_pos
```

Create `packages/db/.env.local` with that value:

```env
DATABASE_URL=postgres://yuta:yuta@localhost:55433/yuta_pos
```

Run migrations:

```bash
corepack pnpm --filter @yuta/db db:migrate
```

Seed development data:

```bash
corepack pnpm --filter @yuta/db db:seed
```

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
Database:  yuta_pos
User:      yuta
Password:  yuta
Host port: 55433
```

The host port is `55433` to avoid conflicts with a local PostgreSQL server or other projects using port `5432` or `5433`.

## Production Reminder

Do not use `docker-compose.db.dev.yml` in production.

Production apps should use:

```env
DATABASE_URL=postgres://yuta:encoded_password@luna-postgres:5432/yuta_pos
POSTGRES_NETWORK=postgres_default
```

Production compose files belong next to each app, for example:

```txt
apps/yuta-pos/docker-compose.yml
apps/yuta-pos/.env.production
```
