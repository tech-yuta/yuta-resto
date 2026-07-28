# YUTA — Database Architecture Reset & Runtime Boundaries

**Status:** Approved implementation specification  
**Target:** Codex  
**Scope:** Refactor the current monorepo database architecture before the first real deployment  
**Language of implementation/docs:** English  
**UI language:** French where applicable

### Approved decisions

- Persist cloud ownership as `organization_id` plus `establishment_id`; do not
  create a `tenants` table. `tenant` remains the runtime authorization context.
- Remove POS menu/catalog, printers, operational reports, and local POS user
  management from cloud admin; implement required workflows in a local UI
  through `site-agent`.
- Use application-generated UUIDv7 for new business records.
- Keep the standalone display database app-owned under
  `apps/yuta-display/src/db`; do not create `packages/db-display` without a
  second legitimate server-side consumer.

---

## 1. Decision summary

The current `packages/db` package must no longer represent one shared database for every application.

YUTA now has two fundamentally different runtime families:

1. **Cloud applications**
   - Publicly deployed.
   - Use a managed live database.
   - Multi-tenant.
   - Examples: `apps/admin`, `apps/web`.

2. **Local-only applications**
   - Deployed only inside a restaurant or customer site.
   - Use a database hosted on the local server.
   - Must continue working without Internet.
   - Must never write their operational data to the live cloud database.
   - Examples: `apps/yuta-pos`, potentially `apps/yuta-display`, and future premium/customer-specific local applications.

### Non-negotiable rule

> POS operational data must never be stored in the cloud/live database.

This includes, but is not limited to:

- orders;
- order items;
- payments;
- cash movements;
- shifts;
- kitchen tickets;
- printer jobs;
- table sessions;
- POS users/PIN sessions;
- local device state;
- POS inventory movements;
- POS audit events.

There is no POS-to-cloud synchronization in the current architecture.

A future optional analytics/export product would require a separate specification, explicit customer consent, a dedicated contract, and a clearly separated data model. It must not be anticipated by silently adding POS tables to the cloud schema.

---

## 2. Database reset decision

The project has not yet been deployed in production and there is no production data to preserve.

Therefore:

- do not create compatibility migrations from the current schema;
- do not backfill existing development data;
- do not maintain the current migration history;
- do not create dual-read or dual-write compatibility code;
- do not retain obsolete tables “just in case”;
- do not preserve old database naming if the new architecture makes it unnecessary.

The existing development databases and their volumes may be deleted and rebuilt from zero.

### Important distinction

During the refactor, use disposable databases and schema push/reset workflows.

Before the first real cloud or local deployment, each database boundary must receive one clean initial baseline migration:

```text
0000_initial
```

This is not a migration from the old architecture. It is the reproducible starting schema for the new architecture.

### Required workflow

```text
Current development DB
        ↓ delete
Current migration history
        ↓ delete
Design clean target schemas
        ↓
Push schemas to disposable databases while developing
        ↓
Validate architecture and tests
        ↓
Generate one clean initial migration per database boundary
```

---

## 3. Target monorepo structure

```text
YUTA-RESTO/
├── apps/
│   ├── admin/                     # Cloud, authenticated, multi-tenant
│   ├── web/                       # Cloud/public website and public SaaS pages
│   ├── yuta-pos/                  # Local-only POS client
│   ├── yuta-display/              # Local-only display app
│   ├── site-agent/                # Local backend/API/device integration
│   └── worker/                    # Optional cloud worker, only when needed
│
├── packages/
│   ├── auth/                      # Cloud authentication only
│   ├── contracts/                 # Shared DTOs, API contracts, Zod schemas
│   ├── core/                      # Pure business/domain logic
│   ├── tenant/                    # Cloud tenant resolution and authorization
│   ├── ui/                        # Shared UI components
│   │
│   ├── db-cloud/                  # Cloud SaaS database
│   ├── db-pos/                    # POS local database
│   └── local-runtime/             # Shared local installation/runtime utilities
│
├── docs/
├── vendor/
├── docker-compose.cloud.dev.yml
├── docker-compose.local.dev.yml
├── pnpm-workspace.yaml
└── package.json
```

### Why there is no generic `db-local`

Do not replace `packages/db` with another catch-all package named `packages/db-local`.

Local-only applications may have unrelated data ownership and lifecycle requirements. A POS database and a standalone display database are not automatically the same database.

Each product boundary owns its own schema:

```text
db-cloud    → cloud SaaS data
db-pos      → local POS data
yuta-display/src/db → standalone display data owned by the display app
```

Future local-only products should follow the same pattern:

```text
packages/db-<product-name>         # when multiple runtimes consume the DB package
apps/<product-name>/src/db         # when exactly one application owns the DB
```

Do not build a large shared local schema containing tables for every future local application.

### Database boundary does not always mean workspace package

Create a dedicated `packages/db-<product-name>` package only when the database
client, schema, or repositories have more than one legitimate server-side
consumer.

When exactly one application owns an isolated database, the schema may remain
inside that application. This is the current decision for `apps/yuta-display`,
whose standalone `display_media` schema is used only by the display app.

---

## 4. Runtime classification

### 4.1 `apps/admin`

**Runtime:** Cloud  
**Database:** `packages/db-cloud`  
**Tenant-aware:** Yes

Responsibilities may include:

- tenant and establishment administration;
- team members and permissions;
- Google Business Profile integration;
- Google OAuth connection state;
- reviews and reply workflow;
- reservations;
- SaaS configuration;
- subscription and billing;
- cloud-only business tools.

The cloud admin must not manage local POS operational domains. The following
current areas must be removed from the cloud admin and, where still required,
implemented in a local UI backed by `site-agent`:

- POS menu and catalog management;
- printer and printer-route management;
- order/payment operational reports;
- local POS users, roles, and PIN access.

Allowed imports:

```text
@yuta/auth
@yuta/contracts
@yuta/core
@yuta/db-cloud
@yuta/tenant
@yuta/ui
```

Forbidden imports:

```text
@yuta/db-pos
@yuta/local-runtime
```

---

### 4.2 `apps/web`

**Runtime:** Cloud/public  
**Database:** `packages/db-cloud`, server-side only  
**Tenant-aware:** Only for dynamic SaaS/public establishment features

Responsibilities may include:

- YUTA marketing website;
- legal pages;
- contact and demo request;
- public reservation pages;
- public review collection pages;
- Google Business Profile integration explanation;
- public tenant/establishment pages.

Allowed imports in server code:

```text
@yuta/contracts
@yuta/core
@yuta/db-cloud
```

The browser/client bundle must never import a database package.

Forbidden imports:

```text
@yuta/db-pos
@yuta/local-runtime
```

---

### 4.3 `apps/yuta-pos`

**Runtime:** Local only  
**Database access:** Through `apps/site-agent`  
**Tenant-aware:** No  
**Cloud database access:** Strictly forbidden

The POS application is a local client. It must not connect directly to the cloud database.

Preferred topology:

```text
yuta-pos
   ↓ local HTTP/WebSocket
site-agent
   ↓
db-pos
```

Allowed imports:

```text
@yuta/contracts
@yuta/core
@yuta/ui
```

Forbidden imports:

```text
@yuta/db-cloud
@yuta/tenant
@yuta/auth
```

Direct use of `@yuta/db-pos` from the POS UI should be avoided. Database access belongs to `site-agent`.

A temporary direct `db-pos` import is allowed only if the current application cannot yet be separated without blocking the refactor. It must be marked with a TODO and removed in the `site-agent` phase.

---

### 4.4 `apps/site-agent`

**Runtime:** Local server only  
**Database:** `packages/db-pos`  
**Tenant-aware:** No  
**Cloud database access:** Strictly forbidden

Responsibilities:

- local API for the POS;
- local WebSocket/realtime events;
- order persistence;
- payment persistence;
- printer integration;
- printer queue;
- kitchen/display events;
- device registration;
- local health checks;
- local backups;
- local database maintenance;
- optional licensing/configuration calls that do not upload POS operational data.

Allowed imports:

```text
@yuta/contracts
@yuta/core
@yuta/db-pos
@yuta/local-runtime
```

Forbidden imports:

```text
@yuta/db-cloud
@yuta/tenant
```

`site-agent` must never receive a cloud database connection string.

---

### 4.5 `apps/yuta-display`

**Runtime:** Local only  
**Tenant-aware:** No

Two valid modes exist.

#### Mode A — Display consumes POS state

Use:

```text
yuta-display
    ↓ local API/WebSocket
site-agent
    ↓
db-pos
```

In this mode, do not create `db-display`.

#### Mode B — Display is fully standalone

Examples:

- static promotional display;
- media playlist;
- local signage configuration unrelated to POS;
- independent customer-facing presentation.

Use:

```text
yuta-display
    ↓
apps/yuta-display/src/db
```

This is the selected mode for the current display application. Its
`display_media` schema, migrations, and database client remain app-owned because
there is only one consumer.

Do not create `packages/db-display` only for structural symmetry. Create it
later only if another legitimate server-side runtime needs to share the display
schema or repositories.

Do not duplicate or mirror POS tables into the display database.

---

## 5. Cloud database scope

`packages/db-cloud` contains only data belonging to the cloud SaaS platform.

Typical modules:

```text
identity
├── users
├── accounts
├── sessions
└── verification_tokens

tenancy
├── tenants
├── establishments
├── memberships
├── roles
└── permissions

google_business_profile
├── google_connections
├── google_accounts
├── google_locations
├── google_reviews
├── google_review_replies
└── oauth_tokens / encrypted credentials

reviews
├── internal_review_requests
├── internal_reviews
├── reply_suggestions
└── reply_approvals

reservations
├── reservation_settings
├── reservations
└── reservation_events

platform
├── subscriptions
├── feature_flags
├── audit_logs
└── legal_consents
```

The exact schema must reflect implemented features only. Do not create speculative tables for unimplemented modules.

### Cloud organization and tenant-context rule

YUTA keeps the current persisted hierarchy:

```text
organization
└── establishment
```

There is no persisted `tenants` table and no `tenant_id` column. In application
code, `tenant` means the resolved authorization/isolation context containing an
`organizationId`, an optional or required `establishmentId`, actor information,
and entitlements.

All organization-owned cloud records must contain an `organization_id`.

Records belonging to a specific restaurant/branch must additionally contain an
`establishment_id`.

Example:

```text
google_reviews
- id
- organization_id
- establishment_id
- external_review_id
- rating
- comment
- review_created_at
- reply_status
```

Every query for tenant-owned data must be tenant-scoped.

Incorrect:

```ts
where(eq(reviews.id, reviewId));
```

Correct:

```ts
where(
  and(
    eq(reviews.id, reviewId),
    eq(reviews.organizationId, tenantContext.organizationId),
  ),
);
```

Organization and establishment isolation must be enforced in
service/repository APIs, not left to individual page components.

---

## 6. POS local database scope

`packages/db-pos` contains only the local operational POS model.

Typical modules:

```text
configuration
├── restaurant_profile
├── pos_settings
├── devices
├── printers
└── printer_routes

catalog
├── categories
├── products
├── product_variants
├── modifiers
├── menus
└── tax_rules

service
├── tables
├── table_sessions
├── orders
├── order_items
├── order_item_modifiers
├── kitchen_tickets
└── order_status_events

payments
├── payments
├── payment_allocations
├── cash_movements
└── shifts

operations
├── printer_jobs
├── local_users
├── local_roles
├── local_sessions
└── local_audit_logs
```

Only create modules required by the current POS implementation.

### No tenant dependency

The local POS installation represents one restaurant/site.

POS business tables do not require the cloud `tenant` package and should not be multi-tenant by default.

A local single-row installation configuration may contain:

```text
installation_id
restaurant_id or site_id
installation_name
license_state
```

This metadata is for local installation identity, backups, or licensing. It must not turn the local POS database into a cloud multi-tenant database.

Do not add `organization_id` or `establishment_id` to every POS table merely
because cloud tables use them.

---

## 7. Data residency rules

### Cloud-only data

Examples:

- SaaS users;
- tenant memberships;
- cloud roles and permissions;
- Google OAuth tokens;
- Google Business Profile accounts;
- Google locations;
- Google reviews;
- AI reply suggestions;
- review approval history;
- public reservations;
- subscriptions;
- cloud audit logs.

### Local-only POS data

Examples:

- orders;
- order lines;
- payments;
- shifts;
- cash drawer activity;
- POS products used by the local service;
- table sessions;
- kitchen tickets;
- printer jobs;
- device state;
- local staff PINs;
- local POS logs.

### Explicitly forbidden

The following flows must not exist:

```text
db-pos → db-cloud
db-cloud SQL connection from site-agent
POS tables inside db-cloud
cloud ORM imports inside yuta-pos
cloud ORM imports inside site-agent
```

There must be no generic “sync all tables” mechanism.

---

## 8. Shared packages

### 8.1 `packages/core`

Must contain pure domain logic only.

Allowed examples:

```text
calculateOrderTotal()
calculateTax()
applyDiscount()
validatePaymentAllocation()
validateReviewReply()
buildReviewReplyPrompt()
validateReservation()
```

Forbidden:

```text
database clients
Drizzle table definitions
Next.js cookies
HTTP request objects
environment-variable reads
filesystem access
tenant resolution
```

`core` must not import any database package.

---

### 8.2 `packages/contracts`

Contains transport-level shared definitions:

- Zod schemas;
- API request/response types;
- local API contracts;
- event payloads;
- branded IDs;
- enums shared across runtime boundaries;
- validation error formats.

It must not contain:

- database clients;
- Drizzle table objects;
- ORM relations;
- secrets;
- OAuth tokens;
- environment-specific code.

Do not export database row types as API contracts. Map persistence models to explicit DTOs.

---

### 8.3 `packages/auth`

For the current scope, `auth` is cloud authentication only.

Used by:

```text
apps/admin
cloud-protected routes in apps/web
optional cloud worker
```

Not used by:

```text
apps/yuta-pos
apps/yuta-display
apps/site-agent
```

Local POS authentication should be implemented as a local domain inside `site-agent`/`db-pos`, such as staff PIN sessions.

---

### 8.4 `packages/tenant`

Cloud only.

Responsibilities:

- resolve tenant from authenticated membership;
- resolve establishment context;
- check role/permission;
- expose scoped service context;
- prevent cross-tenant access.

It must not be imported by local-only apps.

---

### 8.5 `packages/local-runtime`

Optional shared local infrastructure utilities:

- local configuration loading;
- installation identity;
- local secret loading;
- local server URL helpers;
- health status types;
- filesystem paths;
- backup path helpers;
- local environment validation.

It must not contain POS domain tables.

---

## 9. Package dependency rules

```text
contracts ──────────────┐
core ───────────────────┼───────────────┐
ui ─────────────────────┤               │
                        │               │
auth ────────┐          │               │
tenant ──────┼── admin/web              │
db-cloud ────┘                          │
                                        │
local-runtime ─────┐                    │
db-pos ────────────┼── site-agent ──────┼── yuta-pos
                   │                    │
                   └────────────────────┘
```

### Forbidden dependency directions

```text
core → any database package
contracts → any database package
db-cloud → db-pos
db-pos → db-cloud
tenant → db-pos
site-agent → db-cloud
yuta-pos → db-cloud
yuta-display → db-cloud
```

These directions are enforced by `pnpm architecture:check` locally and in CI.
The repository checker also rejects legacy `@yuta/db` usage, ambiguous
`DATABASE_URL` configuration, database imports from client modules, and
invalid clean migration baselines. No large monorepo framework is required.

---

## 10. Environment variables

Remove ambiguous shared usage of:

```env
DATABASE_URL=
```

Use explicit runtime-specific variables.

### Cloud

```env
CLOUD_DATABASE_URL=
CLOUD_DATABASE_SSL=
AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_TOKEN_ENCRYPTION_KEY=
```

### Local POS server

```env
POS_DATABASE_URL=
SITE_AGENT_HOST=
SITE_AGENT_PORT=
YUTA_INSTALLATION_ID=
YUTA_SITE_ID=
LOCAL_BACKUP_PATH=
```

### Standalone display, only if needed

```env
DISPLAY_DATABASE_URL=
```

Rules:

- `apps/admin` and cloud server code may receive `CLOUD_DATABASE_URL`.
- `apps/site-agent` may receive `POS_DATABASE_URL`.
- `apps/yuta-pos` browser code must receive neither database URL.
- `apps/yuta-display` receives `DISPLAY_DATABASE_URL` only in standalone server-side mode.
- no environment file may contain both cloud and POS database URLs unless it is a root development orchestration file that does not expose them to application bundles.

Validate environment variables with Zod at application startup.

---

## 11. Database package layout

### `packages/db-cloud`

```text
packages/db-cloud/
├── src/
│   ├── client.ts
│   ├── index.ts
│   ├── schema/
│   │   ├── auth.ts
│   │   ├── tenants.ts
│   │   ├── establishments.ts
│   │   ├── google-business-profile.ts
│   │   ├── reviews.ts
│   │   └── reservations.ts
│   └── repositories/
├── drizzle/
│   └── 0000_initial.sql
├── drizzle.config.ts
└── package.json
```

### `packages/db-pos`

```text
packages/db-pos/
├── src/
│   ├── client.ts
│   ├── index.ts
│   ├── schema/
│   │   ├── configuration.ts
│   │   ├── catalog.ts
│   │   ├── orders.ts
│   │   ├── payments.ts
│   │   ├── kitchen.ts
│   │   └── printing.ts
│   └── repositories/
├── drizzle/
│   └── 0000_initial.sql
├── drizzle.config.ts
└── package.json
```

### Package exports

Do not expose internal schema files indiscriminately.

Prefer explicit exports:

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./client": "./src/client.ts",
    "./schema": "./src/schema/index.ts",
    "./repositories/*": "./src/repositories/*.ts"
  }
}
```

Client-only applications must not be able to import server database clients accidentally.

---

## 12. Clean reset implementation plan

### Phase 1 — Audit existing usage

Codex must first identify:

- every import from the current `packages/db`;
- every table currently defined;
- every application using the database package;
- every environment variable using `DATABASE_URL`;
- every migration/script referencing the current database;
- every Docker service/volume related to the current DB.

Produce a temporary classification table:

```text
entity/table | current consumers | target database | keep/rewrite/delete
```

Do not copy all current tables automatically.

---

### Phase 2 — Classify current entities

For each current entity:

- move to `db-cloud`;
- move to `db-pos`;
- keep in the app-owned display database;
- replace with a contract/core type;
- delete because obsolete or speculative.

Rules:

- tenant, account, Google, review, SaaS reservation data → cloud;
- POS operational data → POS local;
- current display-only persistent state → `apps/yuta-display/src/db`;
- shared enums/DTOs → contracts;
- pure calculations/rules → core.

---

### Phase 3 — Delete the old DB architecture

Delete:

```text
packages/db
current DB migration history
obsolete database scripts
obsolete root database exports
old database aliases
temporary compatibility adapters
```

Do not leave a deprecated `@yuta/db` package that re-exports the new packages. Such an adapter would hide boundary violations.

Imports must be updated explicitly to:

```text
@yuta/db-cloud
@yuta/db-pos
```

as applicable.

---

### Phase 4 — Reset development databases

Because there is no production data, remove the development database volumes.

Example destructive workflow:

```bash
docker compose -f docker-compose.cloud.dev.yml down -v
docker compose -f docker-compose.local.dev.yml down -v
```

Delete generated migration history from the old package.

Add a guarded root script:

```text
db:reset:dev
```

The script must:

- refuse to run when `NODE_ENV=production`;
- require an explicit confirmation variable such as `CONFIRM_DB_RESET=true`;
- delete only development Docker volumes/databases;
- recreate clean cloud and local databases;
- push the current schemas;
- optionally seed minimal development data.

Never provide a production reset script.

Implementation status: `pnpm db:reset:dev` now provides production and
confirmation guards, an unprivileged `--dry-run`, fixed Compose/legacy targets,
clean baseline migration, and opt-in cloud/POS seeding. The explicit
data-discard checkpoint was approved and completed on 2026-07-28 without seed
data.

---

### Phase 5 — Develop with disposable schemas

During the redesign stage:

```text
db:cloud:push
db:pos:push
db:display:push
```

may be used against disposable development databases.

Do not generate many incremental migrations while the schema is still being reorganized.

Once the target schema is accepted:

1. reset the DB one final time;
2. delete generated temporary migrations;
3. generate one `0000_initial` migration for `db-cloud`;
4. generate one `0000_initial` migration for `db-pos`;
5. generate one app-owned `0000_initial` migration for `yuta-display`;
6. test a fresh install using migrations only.

---

### Phase 6 — Add `site-agent`

Create `apps/site-agent` as the only owner of runtime access to `db-pos`.

Initial API surface should be limited to the current POS requirements.

Example structure:

```text
apps/site-agent/
├── src/
│   ├── server.ts
│   ├── env.ts
│   ├── routes/
│   │   ├── health.ts
│   │   ├── catalog.ts
│   │   ├── orders.ts
│   │   ├── payments.ts
│   │   └── printers.ts
│   ├── services/
│   └── realtime/
└── package.json
```

Minimum endpoints:

```text
GET  /health
GET  /api/catalog
GET  /api/tables
GET  /api/orders
POST /api/orders
PATCH /api/orders/:id
POST /api/orders/:id/payments
GET  /api/printers
POST /api/print-jobs
```

The exact endpoints must be based on actual current POS usage, not speculative functionality.

Use contracts from `packages/contracts`.

---

### Phase 7 — Update application dependencies

#### Admin

Replace old database imports with `@yuta/db-cloud`.

Ensure all tenant-owned queries are scoped through tenant-aware services/repositories.

Remove cloud admin pages and server actions for POS menu/catalog, printers,
order/payment reports, and local POS user management. Reintroduce required
workflows only in a local UI through `site-agent`.

#### Web

Use `@yuta/db-cloud` only in server-side code.

Marketing/legal pages should not require DB access.

#### POS

Replace database calls with local `site-agent` API calls.

Where an immediate full extraction is too large, document the temporary direct local DB access and create a concrete removal task.

#### Display

Keep the current standalone display database app-owned under
`apps/yuta-display/src/db`. Rename its connection variable to
`DISPLAY_DATABASE_URL`, reset its migration history to one clean
`0000_initial`, and keep it independent from both cloud and POS data.

Do not create `packages/db-display` unless a second legitimate server-side
consumer appears.

---

## 13. Docker development topology

### Cloud development

```yaml
services:
  cloud-db:
    image: postgres:17
    environment:
      POSTGRES_DB: yuta_cloud
    volumes:
      - yuta_cloud_dev_data:/var/lib/postgresql/data
```

### Local restaurant development

```yaml
services:
  pos-db:
    image: postgres:17
    environment:
      POSTGRES_DB: yuta_pos
    volumes:
      - yuta_pos_dev_data:/var/lib/postgresql/data

  site-agent:
    depends_on:
      - pos-db

  yuta-pos:
    depends_on:
      - site-agent
```

Cloud and local databases must not share:

- a Docker volume;
- a database name;
- a connection string;
- a migration folder;
- a Drizzle config;
- a DB user in real deployment.

---

## 14. Repository/service access pattern

Avoid arbitrary DB calls throughout React components and route handlers.

Prefer:

```text
route/action
    ↓
application service
    ↓
repository
    ↓
database
```

Example:

```ts
const review = await reviewService.getReview({
  organizationId: tenantContext.organizationId,
  establishmentId: tenantContext.establishmentId,
  reviewId,
});
```

The service/repository owns tenant scoping.

For local POS:

```ts
const order = await orderService.createOrder(input);
```

No tenant context is required.

Do not force cloud and local repositories to implement one generic shared repository abstraction. Their data and constraints are different.

---

## 15. IDs and timestamps

Use UUIDv7 for new business records.

Reasons:

- local creation does not depend on a cloud sequence;
- safe across independent installations;
- easier export/backup;
- avoids collision if local databases are later imported manually.

Generate UUIDv7 values in the application/service layer and pass them
explicitly when inserting records. The target PostgreSQL 17 runtime does not
provide a native `uuidv7()` function, so the architecture must not depend on a
database extension or a PostgreSQL major upgrade solely for ID generation.

UUIDv7 exposes approximate creation time through the identifier. Do not use it
as an authentication credential, password-reset token, OAuth state, API secret,
or other security secret. Generate those values from a dedicated
cryptographically secure random-token mechanism.

A POS order may additionally use a local human-readable sequence:

```text
id: UUID
order_number: 42
```

Store timestamps in UTC in both cloud and local databases.

Display them using the configured establishment timezone.

---

## 16. Security requirements

### Cloud

- encrypt Google OAuth refresh tokens at rest at the application layer;
- never expose tokens to client components;
- scope all tenant queries;
- log sensitive integration actions;
- validate all server inputs;
- keep cloud DB inaccessible from local apps.

### Local

- bind `site-agent` to the local network or configured trusted interfaces;
- do not expose PostgreSQL publicly;
- do not expose POS DB credentials to browser code;
- authenticate sensitive manager endpoints;
- store printer/device secrets locally;
- provide local backups;
- do not upload operational POS data to cloud.

---

## 17. Root scripts

Suggested root scripts:

```json
{
  "scripts": {
    "db:cloud:push": "pnpm --filter @yuta/db-cloud db:push",
    "db:cloud:generate": "pnpm --filter @yuta/db-cloud db:generate",
    "db:cloud:migrate": "pnpm --filter @yuta/db-cloud db:migrate",

    "db:pos:push": "pnpm --filter @yuta/db-pos db:push",
    "db:pos:generate": "pnpm --filter @yuta/db-pos db:generate",
    "db:pos:migrate": "pnpm --filter @yuta/db-pos db:migrate",

    "db:reset:dev": "node ./scripts/reset-dev-databases.mjs",
    "architecture:check": "node ./scripts/check-import-boundaries.mjs"
  }
}
```

Display keeps its app-local database scripts under the `@yuta/display` package.

---

## 18. Seed strategy

Create separate seeds.

### Cloud seed

May include:

- one demo tenant;
- one demo establishment;
- one owner user;
- demo feature flags;
- mock reviews only when clearly marked as demo data.

Do not seed real Google tokens.

### POS seed

May include:

- restaurant profile;
- sample tables;
- sample categories/products;
- local employee roles;
- printer placeholders;
- sample order data only in development.

Do not use the cloud tenant seed to initialize the POS database.

---

## 19. Testing requirements

### Architecture tests

`pnpm architecture:check` runs in CI and fails when:

- `yuta-pos` imports `db-cloud`;
- `site-agent` imports `db-cloud`;
- `admin` imports `db-pos`;
- `core` imports any DB package;
- `contracts` imports any DB package;
- local apps import `tenant`;
- a client module imports a database package or references a database URL;
- the legacy `@yuta/db` package/import or generic `DATABASE_URL` returns;
- a database boundary loses its single clean `0000_initial` baseline.

### Cloud DB tests

- fresh database can be created from `0000_initial`;
- tenant A cannot access tenant B data;
- Google tokens are not returned in public DTOs;
- cloud schema contains no POS operational tables.

### POS DB tests

- fresh local DB can be created from `0000_initial`;
- POS can create an order with Internet unavailable;
- payment/order transactions remain consistent;
- printer jobs persist locally;
- POS runs without `CLOUD_DATABASE_URL`;
- POS schema contains no cloud account/OAuth/tenant tables.

### Integration tests

- `yuta-pos` communicates with `site-agent`;
- `site-agent` is functional with only `POS_DATABASE_URL`;
- `admin` is functional with only `CLOUD_DATABASE_URL`;
- stopping cloud services does not prevent local POS operation.

---

## 20. Acceptance criteria

The refactor is complete only when all conditions below are true.

### Structure

- [x] `packages/db` has been removed.
- [x] `packages/db-cloud` exists.
- [x] `packages/db-pos` exists.
- [x] `packages/db-display` has not been created without a second legitimate consumer.
- [x] The standalone display schema remains app-owned under `apps/yuta-display/src/db`.
- [x] `apps/site-agent` exists or a clearly documented temporary local backend boundary exists.

### Data boundaries

- [x] Cloud schema contains no POS operational tables.
- [x] POS schema contains no cloud OAuth, Google Business Profile, subscription, or tenant membership tables.
- [x] POS has no cloud DB connection.
- [x] There is no POS-to-cloud operational data synchronization.
- [x] Local apps do not depend on `packages/tenant`.

### Reset

- [x] Existing development DB data was discarded.
- [x] Existing migration history was removed.
- [x] No transitional migration/backfill code remains.
- [x] Each active DB package has one clean `0000_initial` baseline before first deployment.
- [x] A fresh environment can be recreated from code and migrations.

### Code boundaries

- [x] `core` is database-independent.
- [x] `contracts` is database-independent.
- [x] Client bundles do not include DB clients or connection strings.
- [x] Forbidden imports are checked in CI.

### Runtime

- [x] Admin/web use the cloud DB.
- [x] POS uses the local server and local POS DB only.
- [x] Display uses either the local POS API or its own justified local DB.
- [x] Local POS continues to work when cloud/Internet is unavailable.

---

## 21. Explicit non-goals

Do not implement the following as part of this refactor:

- POS order synchronization to cloud;
- cloud POS dashboards;
- cross-site POS aggregation;
- remote cloud queries into the POS database;
- generic multi-database ORM abstraction;
- generic “one schema works everywhere” solution;
- premature microservices;
- Kubernetes;
- event streaming infrastructure;
- speculative databases for future products;
- preservation of current development data.

---

## 22. Codex execution order

Codex should execute in this order:

1. Audit current `@yuta/db` usage.
2. Classify all current tables and consumers.
3. Present the classification before destructive deletion.
4. Create `db-cloud` and `db-pos` packages.
5. Move/rewrite only required schemas.
6. Update environment validation.
7. Update Docker development topology.
8. Update admin/web to use `db-cloud`.
9. Create or formalize `site-agent`.
10. Update POS to use the local API.
11. Keep the standalone display DB app-owned and reset its baseline migration.
12. Remove the old `packages/db`.
13. Delete old migrations and development DB volumes.
14. Push and test clean schemas.
15. Add architecture import checks.
16. Generate clean `0000_initial` migrations.
17. Verify fresh installation from zero.
18. Update README and architecture documentation.

At each step, prefer deletion and explicit boundaries over compatibility wrappers.

---

## 23. Final architecture

```text
                         YUTA CLOUD
┌────────────────────────────────────────────────────────┐
│                                                        │
│  apps/web                 apps/admin                   │
│      │                         │                       │
│      └──────────────┬──────────┘                       │
│                     ▼                                  │
│              packages/db-cloud                        │
│                     │                                  │
│              Managed PostgreSQL                        │
│                                                        │
│  Multi-tenant: YES                                     │
│  POS operational data: FORBIDDEN                       │
└────────────────────────────────────────────────────────┘


                    RESTAURANT LOCAL SERVER
┌────────────────────────────────────────────────────────┐
│                                                        │
│  apps/yuta-pos ──────▶ apps/site-agent                 │
│                              │                         │
│                              ▼                         │
│                       packages/db-pos                  │
│                              │                         │
│                       Local PostgreSQL                  │
│                                                        │
│  Multi-tenant: NO                                      │
│  Internet required for service: NO                     │
│  Cloud DB access: FORBIDDEN                            │
└────────────────────────────────────────────────────────┘


                       LOCAL DISPLAY
┌────────────────────────────────────────────────────────┐
│                                                        │
│  yuta-display → apps/yuta-display/src/db               │
│                 standalone display-owned data           │
│                                                        │
└────────────────────────────────────────────────────────┘
```

The core principle is:

> Cloud SaaS data and local operational data are separate products, separate schemas, separate credentials, separate deployments, and separate failure domains.
