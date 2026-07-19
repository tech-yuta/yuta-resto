# YuTa POS User Guide

This guide describes how to use the current YuTa POS MVP for internal restaurant operations.

The app UI is in French. This documentation is in English to match the repository convention.

## Local URLs

```txt
POS orders:    http://localhost:3003
New POS order: http://localhost:3003/pos
Admin:         http://localhost:3001
```

Useful admin pages:

```txt
http://localhost:3001/pos/menu
http://localhost:3001/pos/staff
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

The QA checklist lives in:

```txt
docs/POS_QA_CHECKLIST.md
```

## Install As An App

The production POS can be installed as a PWA on a supported browser. Open the
POS over HTTPS and use the `Installer` action when the installation proposal
appears. The installed POS opens in a standalone window and may expose quick
shortcuts for `Nouvelle commande` and `Cuisine` from the device app launcher.

On iPhone or iPad, use Safari's Share menu and choose `Sur l'ecran d'accueil`.
Safari does not expose the same in-page install proposal as Chromium browsers.

Installing the PWA alone does not make POS operations browser-offline. The app
shell assets may be cached, but creating orders, sending items to the kitchen,
and taking payments still require a working connection to the POS server and
its PostgreSQL database.

When POS, PostgreSQL, and the print worker are deployed on the restaurant edge
server, an Internet outage does not stop local operations. The restaurant LAN,
edge server, and database must still be available. Browser-only order entry
while the edge server is unreachable is not supported.

Every POS screen shows a service strip below the main header:

```txt
En ligne             local server, database, and configured Internet check work
Mode local           local POS works; the configured Internet check is unavailable
Service local        local POS works; no Internet check is configured
Base indisponible    local server responds but PostgreSQL does not
Serveur indisponible browser cannot reach the local POS server
```

`Mode local` is an informational warning, not a reason to stop local cash or
kitchen operations. Follow the payment-terminal procedure before accepting a
card or restaurant-ticket payment during an Internet outage.

## POS Home / Orders

Open:

```txt
http://localhost:3003
```

The POS home is the command list for the current service. It lets staff:

```txt
Open active and recent orders
Start a new order from Nouvelle commande
Open the kitchen screen
```

The legacy order-list route `http://localhost:3003/orders` still opens the same command list.

## New Order

Open:

```txt
http://localhost:3003/pos
```

To create an order:

1. Choose the employee in `Employe`.
2. Enter a table or reference in `Table / Repere`.
3. Choose the order type:
   - `Sur place`
   - `A emporter`
   - `Livraison`
4. Add an optional note when needed.
5. Submit the form.
6. The app opens the item-entry screen so staff can add menu items.

The POS stores the selected employee on the order as `createdBy`. The employee
selector shows active users with `admin`, `manager`, or `staff` roles. If no
active employee exists, order creation is disabled until an employee is created
or reactivated in admin.

## Order Detail

The order detail screen is:

```txt
http://localhost:3003/orders/<orderId>
```

Use it during service to review and act on the current command.

The detail page shows:

```txt
Order reference and status
Active articles
Subtotal, discount, and total
Order timeline with created, kitchen, ready, served, paid, and cancelled states
Order information such as type, table/reference, kitchen printer, and note when present
```

Use `Ajouter` in the `Articles` panel to open the item-entry screen again:

```txt
http://localhost:3003/orders/<orderId>/items
```

Paid and cancelled orders cannot add more items.

### Cancel Order

Use `Annuler la commande` on the order detail page to cancel an unpaid order.

Cancelling an order:

```txt
Marks the order as cancelled
Marks all active articles as cancelled
Voids unpaid split checks
Removes the order from the open command list and kitchen work queue
```

Orders that are already paid, already cancelled, or have a paid payment cannot be cancelled in the MVP. Use a future refund flow for paid orders.

## Add Items

The item-entry screen is:

```txt
http://localhost:3003/orders/<orderId>/items
```

Use it during service to add menu items to the current order.

1. Select a category tab.
2. Search when needed.
3. Tap an item card.
4. The item appears in `Commande actuelle`.

Item name, price, and kitchen station are snapshotted when the item is added. Later menu changes do not rewrite old orders.

Quantity controls follow the kitchen and payment lifecycle:

```txt
pending item                 + and - are available
pending quantity reduced to 0
                             the row is cancelled, never hard-deleted
sent/preparing/ready/served  quantity is locked
same item added after send   creates a new pending kitchen batch
paid or cancelled order      all item changes are locked
recorded partial payment     all item changes are locked
active split checks          all item changes are locked
```

Repeated taps on the same menu item merge into its existing pending row. They
never change the quantity of an item already sent to the kitchen. If an unpaid
split is cancelled and the order returns to single-payment mode, item editing
is available again as long as no payment has been recorded. Quantity changes
keep the row in its original display position; order items are displayed by
creation time with the item ID as a deterministic tie-breaker.

### Send To Kitchen

Use `Envoyer`.

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

Station tabs show the unfinished item count for that station across
`A preparer` and `En preparation`. Items already in `Pret` are not included in
the station badge count. When staff switch station, the POS keeps the current
status if that station has matching items; otherwise it opens the first
unfinished queue for that station, starting with `A preparer`.

The kitchen screen is a production queue, not a full order-history screen.
By default it opens `A preparer` and only loads the selected station/status
queue.
It shows active kitchen work only: items in `sent`, `preparing`, or `ready`.
It is limited to the current service day, from 05:00 to 05:00 local time. This keeps the queue from showing old unfinished history while allowing late-night orders to stay visible after midnight.
When the kitchen screen is open, it refreshes automatically every 10 seconds while the browser tab is visible. This keeps cancelled orders and status changes reasonably fresh without a permanent realtime connection.
Order-level notes are shown on the kitchen screen inside the matching order group, so staff can see food or drink instructions attached during order creation.

Kitchen staff can switch between:

```txt
A preparer       sent items
En preparation   preparing items
Pret             ready items; paid orders can still be reopened for kitchen corrections
```

The `Tous` view is intentionally not available in the MVP kitchen queue. Use
the POS home/orders list for full command lookup.

Items appear grouped by order/table.

Kitchen item statuses:

```txt
Cuisine      -> sent
Preparation  -> preparing
Pret         -> ready
```

Use:

```txt
Preparer    sent -> preparing
Pret        sent/preparing -> ready
Retour      preparing -> sent, for a mistaken Preparer tap
Reouvrir    ready -> preparing, for a mistaken Pret tap
Envoye      ready -> sent, when the item should return fully to the queue
```

Paid orders can still move through the kitchen workflow. Cancelled orders are read-only on the kitchen screen.

Cancelled items are removed from the active kitchen queue. If restored after being sent, they return to the queue as `sent`.

## Order History

Open:

```txt
http://localhost:3003
```

The legacy route `http://localhost:3003/orders` remains available for compatibility.

Views:

```txt
Ouvertes
Payees aujourd hui
Activite aujourd hui
```

Use this page to reopen old or active orders.

`Payees aujourd hui` uses the payment date. `Activite aujourd hui` shows orders created today or paid today.

## Payment

Open payment from an order with `Paiement`.

The current payment MVP supports:

```txt
Full order payment
Split equally
Split by items
```

The payment page first shows three compact choices:

```txt
Payer tout
Separer par articles
Partager en parts egales
```

Selecting a choice opens the matching payment dialog. This keeps the operator focused on the active payment mode instead of showing all three workflows at once.

`Separer par articles` opens inside the payment dialog. Staff assign item quantities with `-` and `+` controls for each client, then create the client tickets from the same modal without leaving the payment page.
The modal previews combo discounts per active client ticket, not as one order-level discount.
After tickets are created, the payment page reopens the same dialog so staff can immediately collect each client check.
Internally, the redirect uses `paymentDialog=item-split` to reopen that dialog.
When an item split already exists, reopening the dialog restores the existing client count and item quantities from the saved checks.

Combo discounts are optimized at payment time.

### Full Payment

Use the full payment section when one customer pays all or part of the remaining amount.

Payment amount fields use euro values, not cents:

```txt
31
31,00
31.00
```

Do not enter `3100` for 31 EUR.

`Montant a encaisser` is the amount recorded as paid. It cannot exceed the remaining amount.

For `Especes`, `Montant recu du client` can be higher than `Montant a encaisser`; the POS shows the change to return. It can be left empty when the customer gives exactly the amount being collected.

Supported methods:

```txt
cash
card
ticket_resto
other
```

When a payment is saved:

```txt
The paid amount is recorded
The selected POS employee is stored as paidBy
The order stays open until the remaining amount reaches 0
```

Payment submission and its final customer receipt job are committed in one
database transaction. Retrying the same browser submission cannot create a
second payment. The same protection applies to a kitchen send and its kitchen
ticket job.

When the full order is completely paid:

```txt
The order is marked paid
A customer_receipt print job is created
```

### Split Equally

Use equal split when the table wants to divide the total into N parts.

1. Enter the number of parts.
2. Create the split.
3. Pay each check fully or in partial payments.

The order is marked paid only when all checks are paid.

Use the page-level `Annuler le partage` action to return to full-order payment when no split ticket has been paid yet. Once a split ticket is paid, the split cannot be cancelled.

After equal split tickets are created, the payment page reopens the equal split dialog with `paymentDialog=equal-split`. Reopening the dialog restores the existing number of parts from the saved checks instead of defaulting back to 2.

### Split By Items

Open the `Separer par articles` payment choice:

```txt
Payer -> Separer par articles
```

Choose the number of clients directly in the modal. This is independent from equal split.

```txt
Default -> 2 clients
Choose 3 -> Client 1, Client 2, Client 3
Choose 4 -> Client 1, Client 2, Client 3, Client 4
```

Assign item quantities to each client, then create checks. Each check can be paid fully or in partial payments. A `customer_receipt` print job is created when the check is completely paid.

The selected POS employee is stored as `paidBy` for each payment.

Use the page-level `Annuler le partage` action to return to full-order payment when no split ticket has been paid yet. Once a split ticket is paid, the split cannot be cancelled.

## Admin Staff

Open:

```txt
http://localhost:3001/pos/staff
```

Use this page to manage POS staff users:

```txt
Create employee
Edit name
Edit email
Set role
Activate or deactivate
```

Roles:

```txt
Admin
Manager
Service
Cuisine
```

The POS employee selector shows active users with these roles:

```txt
admin
manager
staff
```

Kitchen-only users are managed here but are not shown in the POS order creator selector.

Do not delete users from the database. Deactivate users to preserve order and payment history.

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

On the order item screen, the search field filters the items in the selected
category immediately as staff type. It does not require submitting the search
or reloading the page. Changing category loads that category's available items.
On mobile, `Voir commande` opens the current order summary over the item grid
without navigating away or reloading the page. Closing it preserves the current
category, search, and grid position.

Do not delete old menu items for historical correction. Toggle availability instead.

## Admin Combos

Open:

```txt
http://localhost:3001/pos/combos
```

Combos are payment discounts, not kitchen production rules.

Combo behavior:

```txt
Rules can define a fixed combo price
Rules can also define "plat + supplement" pricing
Groups define required choices
Eligible menu items can have extra price
Higher-priority rules are applied first
The same item quantity cannot be reused twice
```

For Luna-style formulas, use the `Plat + supplement` pricing mode:

```txt
Menu Express   = selected plat price + 4 EUR
Menu Gourmand  = selected plat price + 8 EUR
Combo Ete      = selected plat price + 2.50 EUR
```

The `Groupe base` field must match the combo group that contains the priced
main dish, usually `Plat`.

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
void replaced split checks
```

This keeps historical order data consistent.

When an unpaid split is replaced by another split mode, the old open checks are marked `void` instead of being deleted. Once any split check is paid, the split mode cannot be replaced.

### Menu Snapshots

Order items store:

```txt
item name snapshot
unit price snapshot
kitchen station snapshot
```

Changing the menu later does not change old order totals or kitchen history.

### Kitchen Ticket Batches

Each `Envoyer cuisine` action creates a kitchen ticket only for the items that were still `A envoyer` at the moment of that send. Adding more items later and sending again creates a new ticket for the new batch.

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
Split by items client count is selected directly on the split-by-items screen
No partial kitchen status inside a single item row quantity
```

These are intentional MVP limits, not bugs.
