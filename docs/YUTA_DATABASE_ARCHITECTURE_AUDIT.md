# YUTA Database Architecture Audit and Entity Classification

**Status:** Review checkpoint before destructive reset  
**Audit date:** 2026-07-27  
**Authority:** `docs/YUTA_DATABASE_ARCHITECTURE_RESET_SPEC.md`  
**Scope:** Current database schemas, consumers, migrations, environment
variables, scripts, Docker topology, and target classification

## 1. Safety checkpoint

This audit performs no destructive action.

The following have not been deleted or reset:

- `packages/db`;
- legacy migration files;
- development databases or Docker volumes;
- current application routes;
- current environment files.

The classification in this document must be reviewed before the implementation
reaches deletion of the legacy package, migrations, or development volumes.

## 2. Executive summary

The current architecture has:

- 34 tables in the shared `packages/db` schema;
- 1 standalone table in the display app;
- 10 shared-database migrations;
- 1 display migration;
- one shared `DATABASE_URL` convention for cloud and POS;
- direct `@yuta/db` references in:
  - 22 admin TypeScript files;
  - 4 web TypeScript files;
  - 14 POS TypeScript/config files;
  - 10 core source/test files.

The target baseline should contain:

- `packages/db-cloud` for implemented cloud identity, organization,
  authentication, and reputation data;
- `packages/db-pos` for implemented local POS operations;
- the existing app-owned display database under
  `apps/yuta-display/src/db`;
- no compatibility `@yuta/db` package;
- no cloud copy of POS operational data;
- no speculative incident, AI-analysis, reservation, inventory, shift, cash,
  table-map, printer-configuration, or synchronization tables.

## 3. Critical findings

### 3.1 `users` crosses both runtime families

The current `users` table combines:

- cloud identity fields: email, password hash, email verification, last login,
  and auth version;
- POS fields: local role and active staff selection;
- foreign keys from cloud auth sessions;
- foreign keys from POS orders and allergy acknowledgements.

It must be split rather than copied:

```text
db-cloud.users
  cloud identity only
  no POS role column

db-pos.local_users
  local staff identity and local POS role only
  no cloud password/session fields
```

Cloud membership roles remain in `tenant_memberships`. POS roles remain local.
The cloud role enum should be pruned to roles used by implemented cloud
features; POS-only roles such as `cashier`, `kitchen`, and `waiter` must not be
used to model local staff.

### 3.2 `packages/core` is currently an application/data-access layer

The following core modules import Drizzle and `@yuta/db`:

- `combos.ts`;
- `menu.ts`;
- `orders.ts`;
- `payments.ts`;
- `pos.ts`;
- `prints.ts`;
- `users.ts`.

The print worker modules also read environment variables and access the
filesystem.

Required split:

- pure calculations, validation, formatting, date rules, and item-instruction
  rules remain in `packages/core`;
- request/response DTOs and Zod transport schemas move to or remain in
  `packages/contracts`;
- repositories, transactions, print processing, environment access, and
  filesystem/device integration move to `apps/site-agent`;
- DB row types must not be exported as contracts.

### 3.3 Cloud admin currently owns local POS surfaces

The following cloud admin areas violate the approved runtime boundary:

- `menu/**`;
- `operations/orders/**`;
- `operations/payments/**`;
- `operations/reports/**`;
- `operations/tables/**`;
- `settings/printers/**`;
- `team/staff/**`.

They must be removed from cloud navigation/routes and reintroduced only through
a local management UI backed by `site-agent`.

`settings/users/**` is different: it manages cloud users and organization
memberships and remains in cloud admin after it is decoupled from the shared
POS `users` table.

Other currently placeholder operational areas, including stock and local staff
planning/time tracking, must not silently receive cloud POS tables. They should
be removed from the cloud product or remain unimplemented until a separate
cloud SaaS specification establishes legitimate cloud-owned data.

### 3.4 Two reputation tables are ahead of implementation

`feedback_analyses` and `feedback_incidents` are seeded and read by repository
queries, but the current reputation backlog still marks AI analysis and the
incident workflow as unimplemented.

They should be omitted from `db-cloud/0000_initial`. Their seed data, read
scaffolding, filters, and unused contracts should be removed during the reset.
They can return in a future feature migration when the corresponding workflow
is implemented.

## 4. Entity classification

### 4.1 Cloud organization and authentication

| Current entity/table    | Current consumers                                                      | Target                | Action            | Notes                                                                                |
| ----------------------- | ---------------------------------------------------------------------- | --------------------- | ----------------- | ------------------------------------------------------------------------------------ |
| `organizations`         | Tenant adapters, auth, reputation, seed, admin switcher                | `db-cloud`            | Keep and rewrite  | Preserve `organization_id` terminology; use application-generated UUIDv7             |
| `establishments`        | Tenant adapters, memberships, auth, reputation, admin                  | `db-cloud`            | Keep and rewrite  | Always verify parent `organization_id` in scoped operations                          |
| `tenant_domains`        | Public tenant resolution, seed                                         | `db-cloud`            | Keep and rewrite  | Cloud-only hostname resolution                                                       |
| `tenant_memberships`    | Auth, tenant resolution, cloud user management, reputation permissions | `db-cloud`            | Keep and rewrite  | Reference cloud users; prune POS-only roles                                          |
| `tenant_entitlements`   | Tenant resolution, public reputation configuration, seed               | `db-cloud`            | Keep and rewrite  | Cloud SaaS feature access only                                                       |
| `users`                 | Cloud auth/membership and local POS staff/orders                       | Split across both DBs | Split and rewrite | Create cloud `users` plus POS `local_users`; never share IDs as a runtime dependency |
| `auth_sessions`         | Admin authentication, session revocation                               | `db-cloud`            | Keep and rewrite  | Reference cloud users only                                                           |
| `password_reset_tokens` | Cloud password-reset repository                                        | `db-cloud`            | Keep and rewrite  | Token value remains a random secret, not UUIDv7                                      |
| `auth_login_attempts`   | Cloud login rate limiting                                              | `db-cloud`            | Keep and rewrite  | Cloud authentication only                                                            |
| `auth_audit_events`     | Cloud membership/user mutations                                        | `db-cloud`            | Keep and rewrite  | Reference cloud users and organization scope                                         |

### 4.2 Cloud reputation

| Current entity/table       | Current consumers                                   | Target                   | Action           | Notes                                                    |
| -------------------------- | --------------------------------------------------- | ------------------------ | ---------------- | -------------------------------------------------------- |
| `feedback_items`           | Public feedback API, admin inbox/detail, seed/tests | `db-cloud`               | Keep and rewrite | Require `organization_id` and `establishment_id` scoping |
| `feedback_replies`         | Manual reply drafts/detail, seed                    | `db-cloud`               | Keep and rewrite | Manual draft workflow is implemented                     |
| `feedback_analyses`        | Seed and read-only detail helper                    | None in initial baseline | Delete/defer     | AI provider/workflow is not implemented                  |
| `direct_customer_feedback` | Public submission and rate limiting                 | `db-cloud`               | Keep and rewrite | Current public feedback flow                             |
| `feedback_incidents`       | Seed, inbox filter, read-only detail                | None in initial baseline | Delete/defer     | Incident creation/lifecycle is not implemented           |
| `feedback_internal_notes`  | Admin note creation/detail                          | `db-cloud`               | Keep and rewrite | Current internal-note workflow                           |
| `reputation_connectors`    | Google OAuth connection and location selection      | `db-cloud`               | Keep and rewrite | Encrypt refresh credentials at application layer         |
| `reputation_settings`      | Public feedback configuration and seed              | `db-cloud`               | Keep and rewrite | Current establishment configuration                      |
| `reputation_audit_events`  | Reputation and connector mutations                  | `db-cloud`               | Keep and rewrite | Current audit trail                                      |

### 4.3 Local POS

| Current entity/table     | Current consumers                                                          | Target               | Action            | Notes                                                        |
| ------------------------ | -------------------------------------------------------------------------- | -------------------- | ----------------- | ------------------------------------------------------------ |
| POS portion of `users`   | POS staff selector, orders, allergy acknowledgement, admin POS staff pages | `db-pos.local_users` | Split and rewrite | Remove cloud password/session fields; management moves local |
| `menu_categories`        | POS item browser, menu service/import, admin menu                          | `db-pos`             | Keep and rewrite  | Management moves to local UI                                 |
| `menu_items`             | POS item browser/orders/combos, import, admin menu                         | `db-pos`             | Keep and rewrite  | Keep order snapshot behavior                                 |
| `orders`                 | POS order lifecycle, kitchen, payments, admin report                       | `db-pos`             | Keep and rewrite  | Remove all cloud consumers                                   |
| `order_items`            | POS order/kitchen/payment/combo lifecycle                                  | `db-pos`             | Keep and rewrite  | Preserve instruction/allergy snapshots                       |
| `combo_rules`            | Combo calculation/payment, import, admin menu                              | `db-pos`             | Keep and rewrite  | Management moves local                                       |
| `combo_rule_groups`      | Combo calculation/payment, import, admin menu                              | `db-pos`             | Keep and rewrite  | Local catalog rule                                           |
| `combo_rule_group_items` | Combo calculation/import/admin menu                                        | `db-pos`             | Keep and rewrite  | Local catalog rule                                           |
| `order_discounts`        | Applied combo result and tests                                             | `db-pos`             | Keep and rewrite  | Operational snapshot/history                                 |
| `order_discount_items`   | Applied combo allocation and tests                                         | `db-pos`             | Keep and rewrite  | Operational snapshot/history                                 |
| `checks`                 | Split payment lifecycle                                                    | `db-pos`             | Keep and rewrite  | Local payment operation                                      |
| `check_items`            | Split-by-item allocation                                                   | `db-pos`             | Keep and rewrite  | Local payment operation                                      |
| `check_discounts`        | Split-check combo result                                                   | `db-pos`             | Keep and rewrite  | Operational snapshot/history                                 |
| `check_discount_items`   | Split-check discount allocation                                            | `db-pos`             | Keep and rewrite  | Operational snapshot/history                                 |
| `payments`               | POS payment lifecycle, receipts, admin report                              | `db-pos`             | Keep and rewrite  | Remove cloud report access                                   |
| `print_jobs`             | Kitchen/receipt creation and legacy print worker                           | `db-pos`             | Keep and rewrite  | Queue processing moves to `site-agent`                       |

### 4.4 Standalone display

| Current entity/table | Current consumers                               | Target                     | Action           | Notes                                                                                 |
| -------------------- | ----------------------------------------------- | -------------------------- | ---------------- | ------------------------------------------------------------------------------------- |
| `display_media`      | `DisplayMediaService`, display admin/API/player | `apps/yuta-display/src/db` | Keep and rewrite | Rename env to `DISPLAY_DATABASE_URL`, use UUIDv7, regenerate app-owned `0000_initial` |

## 5. Entities intentionally absent from initial baselines

The reset must not create tables merely because they appear as examples in the
architecture specification.

Do not add these until an implemented workflow requires them:

- cloud reservations and reservation events;
- subscriptions and billing records;
- AI prompt/analysis jobs;
- reputation incidents;
- POS restaurant-profile/configuration tables beyond the minimum needed to
  start the local installation;
- physical printer and printer-route tables;
- table maps and table sessions;
- cash movements and shifts;
- inventory movements;
- local PIN sessions;
- POS-to-cloud outbox or synchronization events;
- display copies of POS tables.

The current POS uses free-text table labels and printer-name snapshots. Those
behaviors do not justify speculative `tables` or `printers` tables in the
initial baseline.

## 6. Consumer classification

| Consumer                             | Current dependency                                  | Target action                                                                   |
| ------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------- |
| `apps/admin` cloud auth              | `@yuta/db` auth/client/tenant adapters              | Move to `@yuta/db-cloud`; keep server-only                                      |
| `apps/admin` reputation/integrations | `@yuta/db` repositories/client                      | Move to tenant-scoped `@yuta/db-cloud` repositories                             |
| `apps/admin/settings/users`          | Shared users plus memberships                       | Keep cloud membership management; use cloud users only                          |
| `apps/admin/menu`                    | POS schema and core DB services                     | Remove from cloud; rebuild as local UI through `site-agent`                     |
| `apps/admin/operations/*` POS areas  | POS orders/payments or placeholders                 | Remove orders/payments/reports/tables from cloud                                |
| `apps/admin/settings/printers`       | POS print service                                   | Remove from cloud; rebuild locally                                              |
| `apps/admin/team/staff`              | Shared users and user service                       | Remove from cloud; rebuild local POS user management                            |
| `apps/web` public feedback           | `@yuta/db` repositories/client/adapters             | Move to server-only `@yuta/db-cloud`                                            |
| `apps/yuta-pos`                      | Direct DB client/schema and DB-backed core services | Replace with local HTTP/WebSocket calls to `site-agent`                         |
| `packages/core`                      | Drizzle, DB client/schema, filesystem/env           | Retain pure rules only; move runtime services to `site-agent`                   |
| `packages/contracts/orders`          | Unused contract containing `establishmentId`        | Rewrite for actual single-site local API; remove cloud establishment dependency |
| `packages/contracts/display`         | Unused POS kitchen event, test only                 | Delete/defer while display remains standalone                                   |
| `packages/auth`                      | Pure cloud auth helpers                             | Keep; cloud-only, no DB import                                                  |
| `packages/tenant`                    | Pure organization/establishment context             | Keep; cloud-only, no local import                                               |
| `apps/yuta-display`                  | App-owned Drizzle DB                                | Keep app-owned; rename connection variable                                      |

## 7. Repository and script classification

| Current file/area                                            | Target action                                                           |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `packages/db/src/schema/tenant.ts`                           | Move/rewrite into `packages/db-cloud/src/schema`                        |
| `packages/db/src/schema/auth.ts`                             | Move/rewrite into `db-cloud`; reference cloud users                     |
| `packages/db/src/schema/reputation.ts`                       | Move implemented tables to `db-cloud`; omit analysis/incident tables    |
| `packages/db/src/schema/pos.ts`                              | Move/rewrite into `db-pos`; split local users                           |
| `packages/db/src/auth-repository.ts`                         | Move to `db-cloud`                                                      |
| `packages/db/src/tenant-adapters.ts`                         | Move to `db-cloud`                                                      |
| `packages/db/src/tenant-user-repository.ts`                  | Move to `db-cloud` and remove POS-role mapping                          |
| `packages/db/src/reputation-repository.ts`                   | Move to `db-cloud`; remove deferred analysis/incident scaffolding       |
| `packages/db/src/seed.ts`                                    | Split into independent cloud and POS seeds                              |
| `packages/db/src/import-luna-menu.ts`                        | Move to POS-local seed/import tooling                                   |
| `packages/db/src/luna-menu.json`                             | Move with POS-local seed/import tooling                                 |
| `packages/db/test/reputation-repository.integration.test.ts` | Move to `db-cloud` tests and use `CLOUD_DATABASE_URL`                   |
| `packages/core/test/services.test.ts`                        | Split pure core unit tests from `site-agent`/`db-pos` integration tests |
| `packages/core/src/print-worker*.ts`                         | Move to `site-agent`; no filesystem/env access remains in core          |
| `apps/yuta-pos/scripts/backup-db.sh`                         | Retarget to `POS_DATABASE_URL`; keep guarded local backup behavior      |
| `apps/yuta-pos/scripts/restore-db.sh`                        | Retain guarded restore; keep `POS_RESTORE_DATABASE_URL`                 |
| `apps/yuta-display/src/db/**`                                | Keep in app; rename env and generate clean baseline                     |

## 8. Environment-variable audit

| Current location                        | Current variable              | Target                                                          |
| --------------------------------------- | ----------------------------- | --------------------------------------------------------------- |
| `packages/db/src/client.ts`             | `DATABASE_URL`                | Delete with legacy client                                       |
| `packages/db/drizzle.config.ts`         | `DATABASE_URL`                | Split into `CLOUD_DATABASE_URL` and `POS_DATABASE_URL` configs  |
| `packages/db/.env.example`              | `DATABASE_URL`                | Replace with package-specific examples                          |
| `packages/db` integration test          | `DATABASE_URL`                | `CLOUD_DATABASE_URL`                                            |
| `apps/admin/.env.example`               | `DATABASE_URL`                | `CLOUD_DATABASE_URL`                                            |
| `apps/web/.env.example`                 | `DATABASE_URL`                | `CLOUD_DATABASE_URL`                                            |
| `apps/yuta-pos/.env.production.example` | `DATABASE_URL`                | Remove DB URL; add local `SITE_AGENT_URL`/runtime configuration |
| `apps/yuta-pos/Dockerfile`              | baked fallback `DATABASE_URL` | Remove entirely                                                 |
| `apps/yuta-pos/docker-compose.yml`      | DB URL on POS and worker      | Give only `site-agent`/migrate `POS_DATABASE_URL`               |
| POS backup script                       | `DATABASE_URL`                | `POS_DATABASE_URL`                                              |
| `apps/yuta-display/.env.example`        | `DATABASE_URL`                | `DISPLAY_DATABASE_URL`                                          |
| Display DB client/config/compose        | `DATABASE_URL`                | `DISPLAY_DATABASE_URL`                                          |

Ignored real `.env*` values were not read during this audit. Operators must
replace their variable names and credentials during deployment migration
without exposing secrets in repository output.

## 9. Migration audit

### Shared legacy history

| Migration                                | Current responsibility                       | Target                                                   |
| ---------------------------------------- | -------------------------------------------- | -------------------------------------------------------- |
| `0000_workable_harpoon.sql`              | Initial POS schema                           | Delete after `db-pos` target schema is validated         |
| `0001_dynamic_combo_pricing.sql`         | POS combo pricing                            | Fold into `db-pos/0000_initial`                          |
| `0002_keen_satana.sql`                   | Organizations/establishments/memberships     | Fold into `db-cloud/0000_initial`                        |
| `0003_lucky_lady_bullseye.sql`           | POS idempotency and print references         | Fold into `db-pos/0000_initial`                          |
| `0004_closed_golden_guardian.sql`        | Order allergy fields                         | Fold into `db-pos/0000_initial`                          |
| `0005_tan_steve_rogers.sql`              | Order-item allergy fields                    | Fold into `db-pos/0000_initial`                          |
| `0006_colorful_supreme_intelligence.sql` | Structured instructions/allergy confirmation | Fold into `db-pos/0000_initial`                          |
| `0007_overjoyed_spencer_smythe.sql`      | Reputation schema                            | Fold implemented subset into `db-cloud/0000_initial`     |
| `0008_elite_the_twelve.sql`              | Cloud authentication                         | Fold into `db-cloud/0000_initial` with split cloud users |
| `0009_sparkling_galactus.sql`            | Cloud auth audit                             | Fold into `db-cloud/0000_initial`                        |

Delete all shared migration SQL, snapshots, and journal only after both new
schemas can be pushed to disposable databases and their contents are reviewed.

### Display history

`apps/yuta-display/drizzle/0000_loud_exodus.sql` is already isolated, but it
must be regenerated as the clean app-owned `0000_initial` after the UUIDv7 and
environment changes are applied.

## 10. Docker and volume audit

| Current topology                    | Finding                                                                   | Target                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `docker-compose.db.dev.yml`         | One `yuta_resto` DB and `yuta-postgres-dev-data` volume for cloud and POS | Replace with separate cloud/local dev compose files and volumes              |
| POS `pos` service                   | Receives `DATABASE_URL` directly                                          | Remove DB credential; depend on `site-agent`                                 |
| POS `print-worker` service          | Runs DB/filesystem logic from `@yuta/core`                                | Move processing into local `site-agent` runtime                              |
| POS `migrate` service               | Runs in `/app/packages/db`                                                | Run `@yuta/db-pos` migrations with `POS_DATABASE_URL`                        |
| Display production compose          | Receives generic `DATABASE_URL`                                           | Rename to `DISPLAY_DATABASE_URL`                                             |
| Display dev compose                 | Uses PostgreSQL 16 and generic `yuta` user                                | Align to PostgreSQL 17 and display-specific DB user/credentials              |
| External `postgres_default` network | Shared reachability                                                       | May remain, but credentials and DB grants must prevent cross-boundary access |

The current development volume identified for later guarded deletion is:

```text
yuta-postgres-dev-data
```

The display development volume is:

```text
luna_display_dev
```

Do not delete either volume until the explicit destructive reset checkpoint.

## 11. Boundary enforcement gap

The repository currently has:

- no ESLint configuration;
- no dependency-boundary checker;
- no CI workflow enforcing forbidden imports;
- no root `architecture:check` script.

The reset should add a small repository script rather than a large monorepo
framework. At minimum it must fail when:

- cloud apps import `db-pos`;
- local apps import `db-cloud` or `tenant`;
- `core` or `contracts` imports any database package;
- POS client code imports a DB client/schema;
- browser code receives a database URL.

## 12. Proposed next implementation sequence

After this classification is reviewed:

1. Create `packages/db-cloud` and `packages/db-pos` without deleting
   `packages/db`.
2. Add application-level UUIDv7 generation.
3. Build the clean cloud schema, including split cloud users and excluding
   deferred analysis/incident tables.
4. Build the clean POS schema, including `local_users`.
5. Split seeds and integration tests.
6. Add `apps/site-agent` and local API contracts based on actual POS actions.
7. Move POS persistence/transactions/printing out of `packages/core`.
8. Replace POS direct DB access with the local API.
9. Remove local POS surfaces from cloud admin.
10. Update cloud consumers to `db-cloud`.
11. Update display environment naming while keeping its DB app-owned.
12. Add architecture import checks.
13. Only then remove legacy `packages/db`, old migrations, and guarded
    development volumes.
14. Generate and verify clean `0000_initial` migrations.

No compatibility re-export, dual read, dual write, or data backfill is
permitted.

## 13. Implementation checkpoint

The first non-destructive implementation slice is now present:

- `packages/db-cloud` contains 17 cloud tables covering cloud users, tenancy,
  authentication, and the currently implemented reputation workflows;
- `packages/db-pos` contains 16 local tables covering local users, catalog,
  orders, combos, payments, and printing;
- `feedback_analyses` and `feedback_incidents` are intentionally absent;
- all business-record primary keys are required inputs with no database-side
  random UUID default;
- each package validates its own explicit database URL and has independent
  Drizzle commands;
- the legacy `packages/db`, its migrations, its consumers, and all database
  volumes remain untouched.

Application services must generate UUIDv7 values when their repositories are
moved to the new packages. That generator is deliberately not placed in the
schema or database client layer. Clean `0000_initial` migrations remain deferred
until the legacy consumers have moved and the final schemas have been verified,
as required by the reset sequence.

The seed and integration-test foundation is now split by boundary:

- `@yuta/db-cloud` owns the organization, establishment, cloud owner,
  entitlement, and reputation-settings seed;
- `@yuta/db-pos` owns local users, catalog, and combo fixtures;
- both seed services generate new IDs with UUIDv7;
- cloud and POS schema integration tests use their respective database URL and
  require an explicit opt-in flag;
- the legacy reputation repository integration test remains in `packages/db`
  until that repository is rewritten for `db-cloud`; it is not re-exported or
  imported by either new package.

The initial `apps/site-agent` and local API contract slice is now present:

- `@yuta/contracts/local-pos` defines versioned local users, catalog, order,
  kitchen, payment, split-check, and print-job transport schemas;
- new idempotent commands require UUIDv7 keys;
- `apps/site-agent` validates its local-only environment and imports
  `@yuta/db-pos`, never `@yuta/db-cloud`;
- health, local-user, catalog, order-list, and order-creation routes are
  implemented under `/api/v1`;
- exact-origin CORS prevents arbitrary browser origins from using the local
  agent;
- speculative table-map and physical-printer resources remain absent.

Order-item and kitchen persistence are now implemented in `site-agent`:

- order detail, item creation, item editing, cancellation, restore, and kitchen
  status commands use `@yuta/db-pos`;
- new order items and kitchen print jobs receive application-generated
  UUIDv7 IDs;
- send-to-kitchen uses an order row lock and one transaction for allergy
  acknowledgement, status changes, ticket snapshotting, and print-job
  creation;
- replaying a kitchen UUIDv7 idempotency key returns its existing result, while
  cross-command reuse is rejected.

The combo calculation engine has been extracted into
`site-agent` and covered for fixed and base-item-plus-delta pricing, repeated
quantities, deterministic matching, and no unit reuse. Its `db-pos` adapter
rebuilds order and check discount snapshots with UUIDv7 IDs.

The financial persistence slice is now implemented in `site-agent`:

- equal and item-based splits use UUIDv7 check/check-item IDs;
- item-based checks calculate and persist their own combo allocations;
- payment capture locks the order, validates remaining amounts and staff
  identity, and rejects mismatched idempotency replays;
- completed order/check payments create a receipt snapshot and print job in the
  same transaction;
- print jobs can be listed and moved through printing, printed, failed, and
  retry states.

The `db-pos` schema tests and the `site-agent` financial transaction tests have
now passed against a disposable PostgreSQL database. The first POS client
migration slice is complete: `/api/health` uses a validated server-side
`SITE_AGENT_URL` client and probes `site-agent` instead of the legacy database.
The client adapter now also covers local users, catalog, order list/detail,
order creation, item mutations, item commands, cancellation, and kitchen send.
Order and item responses expose the serialized allergy and lifecycle snapshots
used by the existing screens; these mappings pass the database-backed
site-agent integration suite. Catalog responses now include nested combo rules,
groups, and eligible items, and the POS client covers the financial
summary/split/payment endpoints. Operational cutover remains disabled until
the pages and actions can switch together, because order-entry and payment
share the same order IDs and staff selection. This keeps the transition from
writing one database and reading the other.
