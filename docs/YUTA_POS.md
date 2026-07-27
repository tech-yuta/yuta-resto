# YuTa POS App Notes

`apps/yuta-pos` is the internal restaurant POS application for YuTa.

It is a local-only client. Its operational data must remain at the restaurant
and must never be stored in or synchronized to the cloud database.

The target runtime boundary is:

```txt
apps/yuta-pos -> apps/site-agent -> packages/db-pos -> local PostgreSQL
```

The current direct use of the legacy `packages/db` is transitional and must be
removed by the database architecture reset. The POS must not reuse or modify
the standalone database inside `apps/yuta-display`.

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
`docs/POS_OFFLINE_STRATEGY.md`. Phases 1 and 2 (restaurant edge operation and
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

Follow `docs/DEPLOYMENT.md` for the exact Luna server commands and required
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

POS setup and reporting are local workflows, not cloud admin workflows:

```txt
Local POS users and PIN roles
Menu categories and items
Combo rules
Printers and printer routes
Daily orders and payments
```

These workflows must be implemented in a local UI backed by `site-agent`.
They must be removed from `apps/admin`.

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
docs/POS_USER_GUIDE.md
```

The QA checklist lives in:

```txt
docs/POS_QA_CHECKLIST.md
```

The detailed product and technical specification lives in:

```txt
docs/POS_MVP_Master_Spec.md
```

Local database setup lives in:

```txt
docs/LOCAL_DATABASE.md
```

The accepted offline architecture, failure boundaries, and implementation
phases live in:

```txt
docs/POS_OFFLINE_STRATEGY.md
```

## Mock Print Worker

The MVP print flow is database-backed:

```txt
POS send to kitchen or payment
Create print_jobs row with status pending
Worker claims pending job as printing
Worker writes mock output
Worker marks job printed or failed
```

Kitchen ticket jobs are batch-based. If an order is sent to kitchen, then more items are added and sent later, the second ticket contains only the newly sent items.

Run one batch locally:

```bash
corepack pnpm --filter @yuta/core print:worker
```

Run continuously:

```bash
corepack pnpm --filter @yuta/core print:worker:watch
```

The target `site-agent` owns the print queue and printer integration. During
the transition, the existing continuous `print-worker` service remains a
legacy implementation. Physical printer transport remains pending a hardware
and connection decision.

Optional env values:

```txt
PRINT_WORKER_OUTPUT_DIR=.tmp/prints
PRINT_WORKER_BATCH_SIZE=10
PRINT_WORKER_INTERVAL_MS=3000
PRINT_WORKER_FAIL_RATE=0
```

`PRINT_WORKER_OUTPUT_DIR` makes the mock printer write one text file per job.
Without it, the worker only updates job status in the database.

## Local installation identity

The POS database is single-site and is not cloud multi-tenant. POS tables do
not use `organization_id`, `establishment_id`, or `@yuta/tenant`.

A single local installation record may identify the restaurant/site for
licensing, backup metadata, and operator display. Local staff authentication
uses local users, roles, and PIN sessions managed by `site-agent`; it does not
reuse cloud memberships or cloud authentication sessions.

The current `@yuta/db-pos` development seed creates local admin, staff, and
kitchen identities plus catalog/combo fixtures. It intentionally creates no
cloud membership and no temporary local password. PIN credentials and sessions
remain part of the `site-agent` implementation phase.
