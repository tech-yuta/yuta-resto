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
Full payment
Split by items
Split equally
Mock print jobs
Kitchen ticket print job on send to kitchen
Customer receipt print job on payment
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
Menu categories
Menu items
Combo rules
Daily orders
Daily revenue
```

## UX Principles

The POS is used during service, often on a tablet. Favor speed, clarity, and large touch targets.

Do:

```txt
Use a fast item grid
Keep the current order visible
Make Send to kitchen and Payment easy to reach
Show kitchen items grouped by table label/order
Keep payment totals clear
```

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
