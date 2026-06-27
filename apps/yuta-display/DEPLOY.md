# yuta-display production deploy

This production compose file does not start PostgreSQL. It expects an existing
PostgreSQL database reachable from the mini PC.

## 1. First-time setup on a new mini server

Use this flow when the mini server already has PostgreSQL running, but
`yuta-display` has never been deployed before.

### 1.1 Create the database and user

PostgreSQL runs in Docker on the mini server, so connect to the PostgreSQL
container instead of using the host `sudo -u postgres psql` command.

First find the admin user and default database configured for the existing
PostgreSQL container:

```bash
docker inspect luna-postgres --format '{{range .Config.Env}}{{println .}}{{end}}' | grep POSTGRES_
```

If it prints `POSTGRES_USER=luna_admin`, connect with that user and explicitly
select an existing database:

```bash
docker exec -it luna-postgres psql -U luna_admin -d postgres
```

If the container was created with a different `POSTGRES_DB`, use that database
instead:

```bash
docker exec -it luna-postgres psql -U luna_admin -d POSTGRES_DB_VALUE
```

If it prints `POSTGRES_USER=postgres`, connect with:

```bash
docker exec -it luna-postgres psql -U postgres -d postgres
```

Alternatively, in Portainer, open the `luna-postgres` container console and run
`psql -U <POSTGRES_USER> -d <POSTGRES_DB_OR_postgres>`.

First check whether the application user or database already exists:

```sql
\du
\l
```

Create a dedicated user and database only if they do not already exist:

```sql
CREATE USER yuta WITH PASSWORD 'replace_with_a_strong_password';
CREATE DATABASE luna_display OWNER yuta;
GRANT ALL PRIVILEGES ON DATABASE luna_display TO yuta;
\q
```

If `CREATE USER` fails because `yuta` already exists, only create the database
and grant privileges:

```sql
CREATE DATABASE luna_display OWNER yuta;
GRANT ALL PRIVILEGES ON DATABASE luna_display TO yuta;
```

### 1.2 Create the production env file

Create an env file on the server, for example `apps/yuta-display/.env.production`:

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
docker compose --env-file apps/yuta-display/.env.production -f apps/yuta-display/docker-compose.yml --profile migrate run --rm --build migrate
```

This creates the application tables, for example `display_media`.
The `--build` flag ensures the migration image includes the latest migration
files from `apps/yuta-display/drizzle/`.

If migration still fails without a clear error, run this debug command and
inspect the output above the final pnpm error:

```bash
docker compose --env-file apps/yuta-display/.env.production -f apps/yuta-display/docker-compose.yml --profile migrate run --rm --build --entrypoint sh migrate -lc 'pwd && ls -la drizzle && node -e "const u=new URL(process.env.DATABASE_URL); console.log({host:u.hostname, port:u.port, database:u.pathname.slice(1), user:u.username})" && pnpm db:migrate'
```

### 1.5 Build and start the display app

```bash
docker compose --env-file apps/yuta-display/.env.production -f apps/yuta-display/docker-compose.yml up -d --build display
```

The app is exposed on port `3002` of the mini PC:

```txt
http://SERVER_IP:3002/display
```

Uploads are stored on the mini server source folder:

```txt
/opt/luna/source/yuta-resto/apps/yuta-display/public/uploads/display
```

That folder is bind-mounted into the container at:

```txt
/app/apps/yuta-display/public/uploads/display
```

Only the `.gitkeep` file is tracked by Git. Uploaded media files are ignored.

Do not use `docker-compose.dev.yml` in production. That file starts a local
PostgreSQL container for development only.

## 2. Updating production when only code changed

Use this when there are no new files in `apps/yuta-display/drizzle/`.

```bash
git pull
docker compose --env-file apps/yuta-display/.env.production -f apps/yuta-display/docker-compose.yml up -d --build display
```

Check the logs:

```bash
docker compose --env-file apps/yuta-display/.env.production -f apps/yuta-display/docker-compose.yml logs -f display
```

## 3. Updating production when code and database changed

Use this when the update includes new Drizzle migration files in
`apps/yuta-display/drizzle/`.

```bash
git pull
docker compose --env-file apps/yuta-display/.env.production -f apps/yuta-display/docker-compose.yml --profile migrate run --rm --build migrate
docker compose --env-file apps/yuta-display/.env.production -f apps/yuta-display/docker-compose.yml up -d --build display
```

Check the logs:

```bash
docker compose --env-file apps/yuta-display/.env.production -f apps/yuta-display/docker-compose.yml logs -f display
```

## 4. Quick checks

Confirm containers:

```bash
docker compose --env-file apps/yuta-display/.env.production -f apps/yuta-display/docker-compose.yml ps
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

## 5. Deploy with Portainer Stack

Portainer Stack is a UI for deploying Docker Compose. Use this if you do not
want to run `docker compose` manually from the terminal.

### 5.1 Create the stack

In Portainer:

1. Go to **Stacks**.
2. Click **Add stack**.
3. Name the stack:

```txt
yuta-display
```

4. Use **Repository** if Portainer can pull this Git repository, or **Web
   editor** if you want to paste the compose file manually.

### 5.2 Environment variables

In the stack environment variables, add:

```env
DATABASE_URL=postgres://yuta:encoded_password@luna-postgres:5432/luna_display
POSTGRES_NETWORK=postgres_default
```

Do not add `UPLOAD_DIR` here. The compose file sets it to the mounted uploads
path inside the container.

### 5.3 Compose file

Use the production compose file:

```txt
apps/yuta-display/docker-compose.yml
```

If Portainer asks for the compose path in a Git repository deployment, set it
to that path.

If using the Web editor, paste the content of
`apps/yuta-display/docker-compose.yml`.

### 5.4 Database migrations in Portainer

Portainer does not always expose Compose profiles conveniently in the Stack UI.
For migrations, use one of these options:

Option A, easiest: run the migration once from the mini server terminal:

```bash
docker compose --env-file apps/yuta-display/.env.production -f apps/yuta-display/docker-compose.yml --profile migrate run --rm --build migrate
```

Option B: temporarily deploy the `migrate` service in Portainer, let it finish,
then remove or disable it again.

After migrations finish, deploy or redeploy the `display` service.

### 5.5 Redeploy after code updates

If the stack is connected to Git, use **Pull and redeploy** in Portainer.

If the update includes database migration files, run the migration once before
redeploying the display service.
