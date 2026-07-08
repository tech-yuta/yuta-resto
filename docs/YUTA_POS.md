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
Limit the kitchen screen to orders created today
Keep payment totals clear
```

Order cancellation is allowed only before payment. Cancelling an order marks active articles as cancelled, voids unpaid split checks, and marks the order cancelled. Paid orders or partially paid orders are not cancellable in the MVP because refund handling is out of scope.

The kitchen screen uses lightweight 10-second client polling with `router.refresh()` while the browser tab is visible. This avoids WebSocket/SSE infrastructure for the MVP while still reflecting cancellations and kitchen status changes quickly enough during service.

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
