# YuTa POS App Notes

Status: Current

Visibility: Engineering

Owner: YUTA engineering and restaurant operations

Last updated: 2026-08-05

`apps/yuta-pos` is the internal restaurant POS application for YuTa.

It is a local-only client. Its operational data must remain at the restaurant
and must never be stored in or synchronized to the cloud database.

The target runtime boundary is:

```txt
apps/yuta-pos -> apps/site-agent -> packages/db-pos -> local PostgreSQL
```

The legacy shared database package has been removed. The POS must not reuse or
modify the standalone database inside `apps/yuta-display`.

## Scope

The first version of `apps/yuta-pos` includes:

```txt
Order creation
Free text table labels
Fast menu item entry
Kitchen workflow
Combo discounts at payment time
Full and partial payment
Split by items
Split equally
Mock print jobs
Kitchen ticket print job for each sent item batch
Customer receipt print job when an order or check is fully paid
Order cancellation before payment
```

Out of scope:

```txt
VAT and fiscal receipt compliance
Certified cash-register behavior
Table maps
Advanced reservations
Staff scheduling
Physical ESC/POS printer integration
```

## UI Language

All customer/operator-facing UI text in `apps/yuta-pos` must be French.

Examples:

```txt
Nouvelle commande
Table / Repere
Sur place
A emporter
Livraison
Envoyer cuisine
Paiement
Preparer
Pret
Retour
Reouvrir
```

Code, comments, types, commit messages, and documentation stay in English.

## App Metadata

`apps/yuta-pos` defines internal-app SEO/PWA metadata in `src/app/layout.tsx`
and `public/site.webmanifest`. The POS is an internal tool and must stay
`noindex,nofollow`.

The level-one PWA implementation registers `public/sw.js` in production and
offers an install action when the browser exposes its native install prompt.
Installed instances launch in standalone mode and provide shortcuts to new
order entry and the kitchen screen.

The service worker caches only the manifest, app icons, and immutable Next.js
static build assets. It deliberately does not cache page navigations, database
data, Server Actions, order operations, or payments. Offline order entry and
background synchronization are not supported at this level.

Every POS page includes a compact local-service status strip. It polls
`/api/health` and distinguishes a reachable local service, an unavailable
database, an unavailable POS server, and (when `POS_INTERNET_CHECK_URL` is
configured) an Internet outage while local operation remains available. The
Docker healthcheck uses the same endpoint but depends only on application and
database readiness, not on Internet access.

The accepted offline architecture and phased implementation roadmap live in
`docs/products/pos/OFFLINE_STRATEGY.md`. Phases 1 and 2 (restaurant edge operation and
data-integrity hardening) are approved for implementation. Cloud
synchronization and browser emergency mode remain deferred. Do not describe
roadmap items as implemented behavior until their acceptance criteria have
been verified and the operator documentation has been updated.

Set `NEXT_PUBLIC_POS_URL` in production when the deployed POS URL differs from
the local default `http://localhost:3003`; this value is used as the metadata
base for Open Graph, Twitter, manifest, and icon URLs.

## Production Deployment

Production deployment uses `apps/yuta-pos/Dockerfile` and
`apps/yuta-pos/docker-compose.yml`. The target local stack contains the POS
client, `site-agent`, and a POS-only PostgreSQL database. Database migrations
run through a one-shot migrate service using `packages/db-pos`.

The POS browser/server bundle must receive neither `POS_DATABASE_URL` nor
`CLOUD_DATABASE_URL`. Only `site-agent` receives `POS_DATABASE_URL`.

Run `pnpm test:pos:offline` before a local production release. This acceptance
test uses a disposable POS database, starts the real site-agent and production
POS bundle without cloud configuration, creates an order through the local
API, and requires POS health to stay available while the Internet probe is
unavailable.

Follow `docs/operations/DEPLOYMENT.md` for the exact Luna server commands and required
`apps/yuta-pos/.env.production` values.

## Architecture

Use:

```txt
apps/yuta-pos
apps/site-agent
packages/db-pos
packages/contracts
packages/core
packages/ui
```

`packages/db-pos` owns the local POS schema, migrations, and repositories.
`apps/site-agent` is the only runtime owner of POS database access.
`apps/yuta-pos` communicates with `site-agent` through contracts from
`packages/contracts`.

`packages/core` contains pure POS calculations and validation only. Database
transactions for kitchen sends, payment capture, cancellation, splitting, and
print-job creation belong to application services inside `site-agent`.
Commands use UUIDv7 idempotency keys supplied through the local API. Replaying
the same command returns the existing result; reusing a key with different
input is rejected.

### Site-agent API status

`apps/site-agent` is now scaffolded as a local Node HTTP service. Its defaults
are:

```env
SITE_AGENT_HOST=127.0.0.1
SITE_AGENT_PORT=3004
SITE_AGENT_ALLOWED_ORIGIN=http://localhost:3003
SITE_AGENT_URL=http://127.0.0.1:3004
```

Start it with:

```bash
pnpm dev:site-agent
```

The initial implemented API is:

```text
GET  /health
GET  /api/v1/local-users
GET  /api/v1/catalog
POST /api/v1/catalog/combo-rules
PATCH /api/v1/catalog/combo-rules/:ruleId
POST /api/v1/catalog/combo-groups
PATCH /api/v1/catalog/combo-groups/:groupId
DELETE /api/v1/catalog/combo-groups/:groupId
POST /api/v1/catalog/combo-group-items
PATCH /api/v1/catalog/combo-group-items/:groupItemId
DELETE /api/v1/catalog/combo-group-items/:groupItemId
GET  /api/v1/orders
POST /api/v1/orders
GET  /api/v1/orders/:orderId
POST /api/v1/orders/:orderId/items
POST /api/v1/orders/:orderId/commands
PATCH /api/v1/order-items/:orderItemId
POST /api/v1/order-items/:orderItemId/commands
GET  /api/v1/orders/:orderId/payment-summary
POST /api/v1/orders/:orderId/checks/equal
POST /api/v1/orders/:orderId/checks/by-items
DELETE /api/v1/orders/:orderId/checks
POST /api/v1/orders/:orderId/payments
POST /api/v1/orders/:orderId/checks/:checkId/payments
GET  /api/v1/print-jobs
POST /api/v1/print-jobs/:printJobId/commands
```

Request and response schemas live under `@yuta/contracts/local-pos`. Contracts
also define the existing order-item, kitchen, split-payment, payment-capture,
and print-job commands so those workflows can move without inventing a second
transport model.

Order-item editing, cancellation/restore, kitchen status changes, allergy
confirmation, order cancellation, and send-to-kitchen are now implemented in
`site-agent`. Kitchen sends lock the order, require a UUIDv7 idempotency key,
acknowledge pending allergy warnings, snapshot the ticket payload, and create
the kitchen print job in one transaction.

Payment capture, split checks, combo allocation, receipt creation, and
print-job maintenance are now implemented in `site-agent`. Financial mutations
lock the order and run in one transaction. Full-order and check payments
validate UUIDv7 replay input; a fully paid target creates its receipt snapshot
and print job in the same transaction. Payment summaries expose the persisted
combo discount and item-allocation snapshots for both full orders and
item-based split checks, so the POS can render the applied offer details
without recalculating pricing in the client.

The new financial integration tests have passed against a disposable
PostgreSQL database. The POS connectivity/health slice now calls
`site-agent /health` through a validated server-side client and no longer opens
the database directly for that probe. The same client now validates the
staff/catalog/order/item/kitchen endpoints, and the order-detail contracts
carry the allergy acknowledgement and lifecycle snapshots required by the
existing UI. Catalog responses include active and inactive combo-rule
snapshots, and the client also covers payment summary, equal/item splits,
split cancellation, and order/check payment capture. The POS pages and server
actions now use this client for staff selection, order entry, kitchen, and
payment workflows. `apps/yuta-pos/src` no longer imports `@yuta/db`, Drizzle,
or a database client, and its container receives only `SITE_AGENT_URL`.
The offline acceptance run also verifies real local-user, catalog, and combo
management against a freshly seeded database and creates a UUIDv7 order
without cloud services.

There is intentionally no `/tables` or physical `/printers` configuration
resource. The current POS uses free-text table labels and printer-name
snapshots; physical table maps and printer configuration remain deferred until
a real hardware transport is selected. The authenticated `/api/v1/print-jobs`
resource is the implemented local queue boundary.

POS setup and reporting are local workflows, not cloud back-office workflows:

```txt
Local POS users and PIN roles
Menu categories and items
Combo rules
Printers and printer routes
Daily orders and payments
```

These workflows must be implemented in a local UI backed by `site-agent`.
They must be removed from `apps/backoffice`.

Combo rules support two pricing modes:

```txt
fixed
  Final combo price = comboPriceCents + eligible item extras.

base_item_plus_delta
  Final combo price = selected item price from basePricingGroupName + priceDeltaCents + eligible item extras.
```

Use `base_item_plus_delta` for Luna-style formulas such as `Menu Express`
(`Plat + 4 EUR`), `Menu Gourmand` (`Plat + 8 EUR`), and `Combo Ete`
(`Plat du jour + 2.50 EUR`). The base pricing group name must match a combo
group name, usually `Plat`.

## UX Principles

The POS is used during service, often on a tablet. Favor speed, clarity, and large touch targets.

Route convention:

```txt
/       Command list / service home
/pos    New order entry
/orders Legacy alias for the command list
/orders/<orderId> Command detail
```

Do:

```txt
Keep command details readable on mobile, tablet, and desktop
Make Send to kitchen and Payment easy to reach
Show kitchen items grouped by table label/order
Keep the kitchen screen as a station/status work queue, not a full command list
Limit the kitchen screen to the current service day, using a 05:00 local cutoff
Keep payment totals clear
```

Order cancellation is allowed only before payment. Cancelling an order marks active articles as cancelled, voids unpaid split checks, and marks the order cancelled. Paid orders or partially paid orders are not cancellable in the MVP because refund handling is out of scope.

Order item quantity changes are allowed only for `pending` rows before payment
starts. Repeated additions merge into the matching pending row; additions after
a kitchen send create a separate pending row so kitchen tickets remain
batch-accurate. Sent or later kitchen states are immutable from the quantity
controls. Any recorded payment or active split locks all item mutations. A
pending row reduced below one is status-cancelled rather than deleted.

Preparation preferences use `order_items.quick_instructions` for structured
code/label snapshots and `order_items.note` for optional free text. Product or
category configuration determines the visible choices; conflicting codes are
also rejected by the service. `order_items.selected_variants` stores structured
quantity snapshots for Mochi flavours.

Allergies are stored per item with `has_allergy`, `allergen_codes`,
`allergy_severity`, and `allergy_note`. `allergy_acknowledged_at/by` records the
POS send acknowledgement. `allergy_kitchen_confirmed_at/by` records a separate
KDS confirmation; an allergic item cannot become `ready` until it is set. A
later allergic item requires both confirmations again. Legacy order-level
allergy fields remain readable for compatibility with existing local data.

The kitchen screen uses lightweight 10-second client polling with `router.refresh()` while the browser tab is visible. This avoids WebSocket/SSE infrastructure for the MVP while still reflecting cancellations and kitchen status changes quickly enough during service.

Kitchen station tabs show unfinished items per station across `sent` and
`preparing`; items in `ready` are intentionally excluded from station badge
counts. Switching station keeps the selected status only when that station has
matching items; otherwise the tab routes to the first unfinished queue for that
station, preferring `sent`, then `preparing`.

Do not:

```txt
Build marketing-style screens
Hide core actions behind dense menus
Show combo discounts on the kitchen screen
Create table-management UI for MVP
```

## Implementation Reference

The operator guide lives in:

```txt
docs/products/pos/USER_GUIDE.md
```

The QA checklist lives in:

```txt
docs/products/pos/QA_CHECKLIST.md
```

The detailed product and technical specification lives in:

```txt
docs/products/pos/PRODUCT_SPEC.md
```

Local database setup lives in:

```txt
docs/operations/LOCAL_DEVELOPMENT.md
```

The accepted offline architecture, failure boundaries, and implementation
phases live in:

```txt
docs/products/pos/OFFLINE_STRATEGY.md
```

## Local print queue

The MVP print flow is site-agent-owned:

```txt
POS send to kitchen or payment
Create print_jobs row with status pending
Local printer adapter claims the pending job
Adapter sends the snapshot to the configured device
Adapter marks the job printed or failed
```

Kitchen ticket jobs are batch-based. If an order is sent to kitchen, then more items are added and sent later, the second ticket contains only the newly sent items.

`site-agent` owns print-job creation and queue maintenance. The legacy
continuous `@yuta/core` print worker has been removed from the POS Compose
topology. Physical printer transport remains pending a hardware and connection
decision.

`@yuta/core` is now database-independent. Its legacy repositories,
transactions, print worker, environment loading, and filesystem code have been
removed. `site-agent` consumes the shared pure combo calculator and owns POS
persistence plus print-job state transitions.

## Local installation identity

The POS database is single-site and is not cloud multi-tenant. POS tables do
not use `organization_id`, `establishment_id`, or `@yuta/tenant`.

A single local installation record may identify the restaurant/site for
licensing, backup metadata, and operator display. Local staff authentication
uses local users, roles, and PIN sessions managed by `site-agent`; it does not
reuse cloud memberships or cloud authentication sessions.

The current `@yuta/db-pos` development seed creates local admin, staff, and
kitchen identities plus catalog/combo fixtures. Migration `0001_local_auth`
adds hashed PIN credentials, authentication attempts, and revocable local
sessions. `site-agent` validates PINs, limits repeated failures, stores only a
session-token hash, and authorizes the local management shell independently of
cloud authentication.

`apps/yuta-pos` exposes the management shell at `/management`. The opaque
session token is kept in an HttpOnly, SameSite=Strict cookie and is forwarded
only by the POS Next.js server to `site-agent`. The first slice protects the
management shell for `admin` and `manager`. `/management/users` provides local
user creation, profile/role updates, activation, and PIN replacement. Admins
can manage every role; managers can manage only `staff` and `kitchen`.
`site-agent` rejects attempts to disable or demote the last active admin.
Role, active-state, and PIN changes increment `authVersion`, invalidating the
affected user's existing sessions.

The unauthenticated local-user list remains available because the login and
order-entry screens must present selectable local identities before a
management session exists. All local-user mutations require a bearer
management session. Existing operator service endpoints remain unchanged
until the operator-login cutover is designed.

`/management/catalog` provides authenticated local management for categories
and menu items. Admins and managers can create or edit categories and items,
change prices and kitchen stations, reorder entries, hide a category, or mark
an item unavailable. The workflow performs no physical deletes. Existing POS
order entry already filters inactive categories and unavailable items, so
catalog changes take effect on the next server render without cloud access.

`/management/combos` provides authenticated local management for combo rules,
selection groups, eligible menu items, and item supplements. A new rule starts
inactive. Its group structure may be edited only while inactive, and
`site-agent` validates required groups and base-pricing configuration before
activation. Rules are deactivated rather than deleted so historical discount
references remain valid; inactive group structures may be removed.

`/management/printing` provides authenticated local queue management. It lists
safe print-job summaries and applies the persisted state machine:
`pending -> printing -> printed` or
`pending/printing -> failed -> pending` through retry. Queue reads and manual
commands require a local admin or manager session. Raw payloads remain inside
`site-agent`; the browser receives only order/table/item-count summaries.
Physical ESC/POS transport and printer-routing configuration remain outside
the current MVP.
