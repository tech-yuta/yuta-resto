# YuTa POS User Guide

This guide describes how to use the current YuTa POS MVP for internal restaurant operations.

The app UI is in French. This documentation is in English to match the repository convention.

## Local URLs

```txt
POS:   http://localhost:3003
Admin: http://localhost:3001
```

Useful admin pages:

```txt
http://localhost:3001/pos/menu
http://localhost:3001/pos/combos
http://localhost:3001/pos/reports
http://localhost:3001/pos/prints
```

## Run Locally

Start the local PostgreSQL database:

```bash
docker compose -f docker-compose.db.dev.yml up -d
```

Run the POS app:

```bash
corepack pnpm --filter @yuta/pos dev
```

Run the admin app:

```bash
corepack pnpm --filter @yuta/admin dev
```

Run the mock print worker:

```bash
corepack pnpm --filter @yuta/core print:worker:watch
```

The print worker processes `print_jobs` rows created by kitchen sends and payments.

## POS Home

Open:

```txt
http://localhost:3003
```

The POS home lets staff:

```txt
Create a new order
Open the kitchen screen
Open the order history
```

To create an order:

1. Enter a table or reference in `Table / Repere`.
2. Choose the order type:
   - `Sur place`
   - `A emporter`
   - `Livraison`
3. Submit the form.
4. The app opens the order screen.

## Order Screen

The order screen is:

```txt
http://localhost:3003/orders/<orderId>
```

Use it during service to add menu items and manage the current order.

### Add Items

1. Select a category tab.
2. Tap an item card.
3. The item appears in `Commande en cours`.

Item name, price, and kitchen station are snapshotted when the item is added. Later menu changes do not rewrite old orders.

### Change Quantity

For items still marked `A envoyer`:

```txt
- decreases quantity
+ increases quantity
```

Only pending items can be quantity-edited. Once an item has been sent to the kitchen, quantity editing is disabled.

### Cancel An Item

Use `Annuler` on an item row.

The item becomes `Annule` and is excluded from the order total. The row remains visible for history.

### Restore A Cancelled Item

Use `Restaurer` on an `Annule` item.

Restore behavior:

```txt
Cancelled before kitchen send -> returns to A envoyer / pending
Cancelled after kitchen send  -> returns to Cuisine / sent
```

Paid orders and cancelled orders cannot restore items.

### Send To Kitchen

Use `Envoyer cuisine`.

This does three things:

```txt
Marks pending items as sent
Makes items appear on the kitchen screen
Creates a kitchen_ticket print job
```

If no item is pending, the send button is disabled.

### Go To Payment

Use `Paiement` to open:

```txt
http://localhost:3003/orders/<orderId>/payment
```

## Kitchen Screen

Open:

```txt
http://localhost:3003/kitchen
```

Kitchen staff can filter by station:

```txt
Cuisine
Bar
Dessert
```

Items appear grouped by order/table.

Kitchen item statuses:

```txt
Cuisine      -> sent
Preparation  -> preparing
Pret         -> ready
```

Use:

```txt
Preparer
Pret
```

Cancelled items are removed from the active kitchen queue. If restored after being sent, they return to the queue as `sent`.

## Order History

Open:

```txt
http://localhost:3003/orders
```

Views:

```txt
Ouvertes
Payees aujourd hui
Aujourd hui
```

Use this page to reopen old or active orders.

## Payment

Open payment from an order with `Paiement`.

The current payment MVP supports:

```txt
Full order payment
Split equally
Split by items
```

Combo discounts are optimized at payment time.

### Full Payment

Use the full payment section when one customer pays the whole remaining amount.

Supported methods:

```txt
cash
card
ticket_resto
other
```

When the full order is paid:

```txt
The order is marked paid
A customer_receipt print job is created
```

### Split Equally

Use equal split when the table wants to divide the total into N parts.

1. Enter the number of parts.
2. Create the split.
3. Pay each check.

The order is marked paid only when all checks are paid.

### Split By Items

Open:

```txt
Choisir les articles
```

The current MVP supports two fixed clients:

```txt
Client 1
Client 2
```

Assign item quantities to each client, then create checks. Each paid check creates its own `customer_receipt` print job.

## Admin Menu

Open:

```txt
http://localhost:3001/pos/menu
```

Use this page to manage:

```txt
Menu categories
Menu items
Item price
Kitchen station
Availability
Sort order
```

Stations:

```txt
Cuisine
Bar
Dessert
Aucune
```

Availability controls whether an item appears in the POS item grid.

Do not delete old menu items for historical correction. Toggle availability instead.

## Admin Combos

Open:

```txt
http://localhost:3001/pos/combos
```

Combos are payment discounts, not kitchen production rules.

Combo behavior:

```txt
Rules define a fixed combo price
Groups define required choices
Eligible menu items can have extra price
Higher-priority rules are applied first
The same item quantity cannot be reused twice
```

Combos are applied during payment optimization.

## Admin Reports

Open:

```txt
http://localhost:3001/pos/reports
```

The current reports page shows:

```txt
Paid revenue today
Paid orders today
Open orders
Today order list
```

Each order can be opened in POS from the report page.

## Admin Prints

Open:

```txt
http://localhost:3001/pos/prints
```

This page shows recent print jobs:

```txt
pending
printing
printed
failed
```

Print job types:

```txt
kitchen_ticket     created when staff sends items to kitchen
customer_receipt   created after full payment or paid split check
```

Manual actions:

```txt
Marquer imprime
Echec
Reessayer
```

When the mock worker is running, it will automatically process pending jobs.

## Mock Print Worker

Run continuously:

```bash
corepack pnpm --filter @yuta/core print:worker:watch
```

Run one batch:

```bash
corepack pnpm --filter @yuta/core print:worker
```

Optional environment values:

```txt
PRINT_WORKER_OUTPUT_DIR=.tmp/prints
PRINT_WORKER_BATCH_SIZE=10
PRINT_WORKER_INTERVAL_MS=3000
PRINT_WORKER_FAIL_RATE=0
```

`PRINT_WORKER_OUTPUT_DIR` writes one mock text file per printed job. Without it, the worker only updates database status.

## Important Behavior Notes

### No VAT In This App

YuTa POS is internal and does not implement VAT or certified cash-register behavior. The restaurant uses separate certified cash-register software.

### No Hard Deletes For Operational History

For orders and items, prefer status changes instead of deletion:

```txt
cancel item
restore item
toggle menu availability
mark payment status
```

This keeps historical order data consistent.

### Menu Snapshots

Order items store:

```txt
item name snapshot
unit price snapshot
kitchen station snapshot
```

Changing the menu later does not change old order totals or kitchen history.

### Display App Is Separate

`apps/yuta-display` is separate from the POS operations ecosystem and has its own database setup.

POS and admin use:

```txt
packages/db
packages/core
packages/ui
```

## Current MVP Limits

Known MVP constraints:

```txt
No table map
No staff login flow
No physical ESC/POS printer integration
No real fiscal receipt
Split by items UI is currently fixed to two clients
No partial kitchen status inside a single item row quantity
```

These are intentional MVP limits, not bugs.
