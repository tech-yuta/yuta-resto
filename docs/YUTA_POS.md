# YuTa POS App Notes

`apps/yuta-pos` is the internal restaurant POS application for YuTa.

It is part of the YuTa restaurant operations ecosystem and should share database access through `packages/db`. It must not reuse or modify the database setup inside `apps/yuta-display`; the display app is intentionally separate.

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

Set `NEXT_PUBLIC_POS_URL` in production when the deployed POS URL differs from
the local default `http://localhost:3003`; this value is used as the metadata
base for Open Graph, Twitter, manifest, and icon URLs.

## Production Deployment

Production deployment uses `apps/yuta-pos/Dockerfile` and
`apps/yuta-pos/docker-compose.yml`. The runtime service is `pos`; database
migrations run through the compose `migrate` profile and execute
`packages/db` migrations against the shared `yuta_resto` database.

Routes that read POS data directly, including `/pos`, must remain dynamically
rendered so Docker image builds never require a live database connection.

Follow `docs/DEPLOYMENT.md` for the exact Luna server commands and required
`apps/yuta-pos/.env.production` values.

## Architecture

Use:

```txt
apps/yuta-pos
packages/db
packages/core
packages/ui
```

`packages/db` owns POS database schema, migrations, and shared database access for YuTa ecosystem apps. `apps/yuta-pos` should consume exported schema and service helpers instead of defining a private POS schema inside the app.

`apps/admin` is the back-office surface for POS setup and reporting:

```txt
Staff users
Menu categories
Menu items
Combo rules
Daily orders
Daily revenue
```

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

Optional env values:

```txt
PRINT_WORKER_OUTPUT_DIR=.tmp/prints
PRINT_WORKER_BATCH_SIZE=10
PRINT_WORKER_INTERVAL_MS=3000
PRINT_WORKER_FAIL_RATE=0
```

`PRINT_WORKER_OUTPUT_DIR` makes the mock printer write one text file per job.
Without it, the worker only updates job status in the database.
