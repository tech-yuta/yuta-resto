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

## YuTa POS

`apps/yuta-pos` deploys as a standalone Next.js container and uses the shared
`packages/db` migrations.

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

Deploy or update POS:

```bash
cd /opt/luna/source/yuta-resto
git pull
docker compose --env-file apps/yuta-pos/.env.production -f apps/yuta-pos/docker-compose.yml --profile migrate run --rm --build migrate
docker compose --env-file apps/yuta-pos/.env.production -f apps/yuta-pos/docker-compose.yml up -d --build pos
```

Check status:

```bash
docker compose --env-file apps/yuta-pos/.env.production -f apps/yuta-pos/docker-compose.yml ps
docker compose --env-file apps/yuta-pos/.env.production -f apps/yuta-pos/docker-compose.yml logs --tail=100 pos
```
