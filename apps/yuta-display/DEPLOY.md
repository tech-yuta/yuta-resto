# yuta-display production deploy

This production compose file does not start PostgreSQL. It expects an existing
PostgreSQL database reachable from the mini PC.

## 1. First-time setup on a new mini server

Use this flow when the mini server already has PostgreSQL running, but
`yuta-display` has never been deployed before.

### 1.1 Create the database and user

Connect to PostgreSQL as an admin user on the mini server:

```bash
sudo -u postgres psql
```

Create a dedicated user and database:

```sql
CREATE USER yuta WITH PASSWORD 'replace_with_a_strong_password';
CREATE DATABASE luna_display OWNER yuta;
GRANT ALL PRIVILEGES ON DATABASE luna_display TO yuta;
\q
```

If the user or database already exists, do not recreate it. Check first:

```sql
\du
\l
```

### 1.2 Create the production env file

Create an env file on the server, for example `.env.production`:

```env
DATABASE_URL=postgres://yuta:encoded_password@luna-postgres:5432/luna_display
POSTGRES_NETWORK=postgres_default
```

If the password contains special characters, URL-encode it before putting it in
`DATABASE_URL`.

`POSTGRES_NETWORK` must match the Docker network used by the existing
PostgreSQL container. In Portainer, this is visible in the Network list. For
example, if the PostgreSQL stack is named `postgres`, the network is often:

```txt
postgres_default
```

The host part of `DATABASE_URL` must be the PostgreSQL container or service name
on that Docker network. Common examples:

```env
DATABASE_URL=postgres://yuta:encoded_password@postgres:5432/luna_display
DATABASE_URL=postgres://yuta:encoded_password@luna-postgres:5432/luna_display
DATABASE_URL=postgres://yuta:encoded_password@db:5432/luna_display
DATABASE_URL=postgres://yuta:encoded_password@postgres-postgres-1:5432/luna_display
```

### 1.3 Make sure the display app can reach PostgreSQL

The production compose file joins the existing PostgreSQL Docker network:

```yaml
networks:
  postgres:
    name: ${POSTGRES_NETWORK:-postgres_default}
    external: true
```

Confirm the network exists:

```bash
docker network ls
```

To find the correct PostgreSQL hostname, inspect the running PostgreSQL
container:

```bash
docker ps
docker inspect POSTGRES_CONTAINER_NAME --format '{{json .NetworkSettings.Networks}}'
```

### 1.4 Run database migrations

Run migrations only when the schema changes:

```bash
docker compose --env-file .env.production -f apps/yuta-display/docker-compose.yml --profile migrate run --rm migrate
```

This creates the application tables, for example `display_media`.

### 1.5 Build and start the display app

```bash
docker compose --env-file .env.production -f apps/yuta-display/docker-compose.yml up -d --build display
```

The app is exposed on port `3002` of the mini PC:

```txt
http://SERVER_IP:3002/display
```

Uploads are stored in the Docker volume named `uploads` and mounted at:

```txt
/app/apps/yuta-display/public/uploads/display
```

Do not use `docker-compose.dev.yml` in production. That file starts a local
PostgreSQL container for development only.

## 2. Updating production when only code changed

Use this when there are no new files in `apps/yuta-display/drizzle/`.

```bash
git pull
docker compose --env-file .env.production -f apps/yuta-display/docker-compose.yml up -d --build display
```

Check the logs:

```bash
docker compose --env-file .env.production -f apps/yuta-display/docker-compose.yml logs -f display
```

## 3. Updating production when code and database changed

Use this when the update includes new Drizzle migration files in
`apps/yuta-display/drizzle/`.

```bash
git pull
docker compose --env-file .env.production -f apps/yuta-display/docker-compose.yml --profile migrate run --rm migrate
docker compose --env-file .env.production -f apps/yuta-display/docker-compose.yml up -d --build display
```

Check the logs:

```bash
docker compose --env-file .env.production -f apps/yuta-display/docker-compose.yml logs -f display
```

## 4. Quick checks

Confirm containers:

```bash
docker compose --env-file .env.production -f apps/yuta-display/docker-compose.yml ps
```

Open these URLs:

```txt
http://SERVER_IP:3002/admin
http://SERVER_IP:3002/display
```

If the app cannot connect to PostgreSQL, verify:

- `DATABASE_URL` host, port, user, password, and database name.
- `POSTGRES_NETWORK` matches the existing PostgreSQL Docker network.
- The PostgreSQL container name or service name is resolvable on that network.
- The database exists before running migrations.
