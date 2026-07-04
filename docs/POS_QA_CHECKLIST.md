# YuTa POS QA Checklist

Use this checklist to stabilize the POS MVP before adding larger features.

Run QA against the local apps:

```txt
POS:   http://localhost:3003
Admin: http://localhost:3001
```

Recommended local services:

```bash
docker compose -f docker-compose.db.dev.yml up -d
corepack pnpm --filter @yuta/pos dev
corepack pnpm --filter @yuta/admin dev
corepack pnpm --filter @yuta/core print:worker:watch
```

If a newly added route returns `404` in `next dev`, restart the affected dev
server before marking the case as failed. Turbopack can keep stale route state
after route files are added during development.

## Result Legend

```txt
PASS      works as expected
FAIL      broken or incorrect
BLOCKED   cannot test because another issue blocks it
N/A       not applicable for this run
```

## Preflight

| Case | Expected Result | Result | Notes |
|---|---|---:|---|
| Local database container is running | `yuta-postgres-dev` is healthy on port `55433` |  |  |
| POS dev server opens | `http://localhost:3003` loads without error |  |  |
| Admin dev server opens | `http://localhost:3001` loads without error |  |  |
| Print worker starts | Worker logs `print-worker polling` |  |  |
| Seed data exists | POS shows menu categories/items and staff users |  |  |

## POS Staff Selector

| Case | Expected Result | Result | Notes |
|---|---|---:|---|
| POS home shows employee selector | `Employe` select is visible |  |  |
| Select active staff and click `Changer` | Session text updates to selected employee |  |  |
| Create order after selecting employee | Order is created with selected employee as creator |  |  |
| Inactive staff is not selectable | Deactivated staff does not appear in POS selector |  |  |
| Kitchen-only user is not selectable for order creation | Role `kitchen` does not appear in POS selector |  |  |

## Create Order

| Case | Expected Result | Result | Notes |
|---|---|---:|---|
| Create dine-in order | Order screen opens with table label and order number |  |  |
| Create takeaway order | Order type saves as takeaway |  |  |
| Create delivery order | Order type saves as delivery |  |  |
| Missing table/reference | Form validation prevents empty order creation |  |  |

## Order Item Entry

| Case | Expected Result | Result | Notes |
|---|---|---:|---|
| Select menu category | Item grid changes to selected category |  |  |
| Add item | Item appears in `Commande en cours` |  |  |
| Add same item twice | Two rows or expected quantity behavior is visible |  |  |
| Item total displays correctly | Row amount equals snapshot unit price times quantity |  |  |
| Order total displays correctly | Total equals sum of active non-cancelled items minus discounts |  |  |

## Quantity, Cancel, Restore

| Case | Expected Result | Result | Notes |
|---|---|---:|---|
| Increase pending item quantity | Quantity and total increase |  |  |
| Decrease pending item quantity | Quantity and total decrease |  |  |
| Decrease quantity at `1` | Button is disabled or quantity remains `1` |  |  |
| Cancel pending item | Item becomes `Annule`; total excludes it |  |  |
| Restore pending-cancelled item | Item returns to `A envoyer`; total includes it again |  |  |
| Send item to kitchen then cancel | Item becomes `Annule`; kitchen queue excludes it |  |  |
| Restore sent-cancelled item | Item returns to `Cuisine` / `sent`; kitchen queue includes it |  |  |
| Sent item quantity controls | Quantity controls are disabled for sent item |  |  |

## Kitchen Flow

| Case | Expected Result | Result | Notes |
|---|---|---:|---|
| Send pending items to kitchen | Items become `Cuisine`; kitchen ticket job is created |  |  |
| Send button with no pending items | Button is disabled |  |  |
| Kitchen station filter `Cuisine` | Only kitchen station items are shown |  |  |
| Kitchen station filter `Bar` | Only bar station items are shown |  |  |
| Kitchen station filter `Dessert` | Only dessert station items are shown |  |  |
| Mark item `Preparer` | Item becomes `Preparation` |  |  |
| Mark item `Pret` | Item becomes `Pret` |  |  |
| Open kitchen `Historique` | Ready items are visible by station |  |  |
| Tap `Reouvrir` on a ready item | Item returns to `Preparation` and active kitchen queue |  |  |
| Tap `Retour` on a preparing item | Item returns to `Envoye` |  |  |
| Paid order in kitchen `A preparer` | Item can still be marked `Preparer` or `Pret` |  |  |
| Paid order in kitchen `Historique` | Ready item can still be reopened for kitchen correction |  |  |
| Cancelled order in kitchen | Item is read-only and does not show rollback buttons |  |  |
| Order status refreshes from item statuses | Order status reflects sent/preparing/ready state |  |  |

## Full Payment

| Case | Expected Result | Result | Notes |
|---|---|---:|---|
| Open payment page | Payment page shows total, paid, remaining |  |  |
| Submit payment with empty amount | Payment page shows a validation message, no server error overlay |  |  |
| Submit payment with empty tendered amount | Payment uses the amount being collected as the tendered amount |  |  |
| Select `Especes` and enter tendered amount above collected amount | Payment UI shows change to return |  |  |
| Enter collected amount above remaining amount | Submit is blocked and payment UI shows a validation message |  |  |
| Pay partial amount | Payment saves; order remains open |  |  |
| Partial payment receipt | No `customer_receipt` job is created before the order is fully paid |  |  |
| Pay remaining amount | Order becomes `Payee` |  |  |
| Overpay attempt | Payment is rejected |  |  |
| Tendered amount below amount | Payment is rejected |  |  |
| Full payment creates receipt job | `customer_receipt` print job is created |  |  |
| Full payment records staff | Payment `paidBy` equals selected POS employee |  |  |

## Split Equally

| Case | Expected Result | Result | Notes |
|---|---|---:|---|
| Create equal split with 2 parts | Two checks are created |  |  |
| Create equal split with 3 parts | Three checks are created and cents are distributed |  |  |
| Pay one check | Check becomes paid; order remains open if other checks unpaid |  |  |
| Pay partial check amount | Payment saves; check remains open |  |  |
| Pay all checks | Order becomes paid |  |  |
| Each paid check creates receipt job | One `customer_receipt` job per paid check |  |  |
| Partial check receipt | No `customer_receipt` job is created before the check is fully paid |  |  |
| Cancel unpaid equal split | Split checks become `void` and `Payer tout` is available again |  |  |
| Cancel split after paid check | Action is disabled or rejected |  |  |

## Split By Items

| Case | Expected Result | Result | Notes |
|---|---|---:|---|
| Open item split page | Two default client columns load |  |  |
| Choose 3 clients on item split page | `Client 1` through `Client 3` assignment UI loads |  |  |
| Equal split does not drive item split clients | Changing equal split parts does not change item split client count unless the item split client selector is changed |  |  |
| Assign valid item quantities | Checks are created |  |  |
| Assign no item | Action is rejected |  |  |
| Assign more than available quantity | Action is rejected |  |  |
| Assign total item quantity above available quantity across clients | User is returned to item split screen with an error message |  |  |
| Pay split-by-items check | Check becomes paid and receipt job is created |  |  |
| Combo discounts apply per check | Eligible check gets combo discount |  |  |
| Replace unpaid split mode | Old unpaid checks become `void` in the database and new checks are created |  |  |
| Replace split after payment | Action is rejected after any split check has been paid |  |  |
| Cancel unpaid item split | Split checks become `void` and `Payer tout` is available again |  |  |

## Print Jobs

| Case | Expected Result | Result | Notes |
|---|---|---:|---|
| Kitchen send creates print job | Admin prints page shows `kitchen_ticket` |  |  |
| Second kitchen send prints only new items | Later kitchen ticket excludes items printed by the earlier send |  |  |
| Payment creates print job | Admin prints page shows `customer_receipt` |  |  |
| Worker processes pending jobs | Job status changes to `printed` |  |  |
| Mark job failed manually | Job status changes to `failed` |  |  |
| Retry failed job | Job status changes back to `pending` |  |  |
| Optional output dir writes files | Text file is created when `PRINT_WORKER_OUTPUT_DIR` is set |  |  |

## Admin Staff

| Case | Expected Result | Result | Notes |
|---|---|---:|---|
| Open `/pos/staff` | Staff management page loads |  |  |
| Create staff user | User appears in staff list |  |  |
| Edit staff user | Name/email/role changes are saved |  |  |
| Deactivate staff user | User becomes inactive and is hidden from POS selector |  |  |
| Reactivate staff user | User becomes active and appears when role is selectable |  |  |
| Kitchen role user | User can be managed but is not shown in POS order creator selector |  |  |

## Admin Menu

| Case | Expected Result | Result | Notes |
|---|---|---:|---|
| Open `/pos/menu` | Menu management page loads |  |  |
| Create category | Category appears in POS category tabs |  |  |
| Create menu item | Item appears in POS item grid when available |  |  |
| Edit menu item price | New orders use new price; old order item snapshots stay unchanged |  |  |
| Change kitchen station | New order items use updated station snapshot |  |  |
| Deactivate item | Item disappears from POS item grid |  |  |
| Reactivate item | Item appears again in POS item grid |  |  |

## Admin Combos

| Case | Expected Result | Result | Notes |
|---|---|---:|---|
| Open `/pos/combos` | Combo management page loads |  |  |
| Create combo rule | Rule appears in combo list |  |  |
| Add combo group | Group appears under rule |  |  |
| Add eligible item | Item can be used by combo optimizer |  |  |
| Combo applies at full payment | Order total reflects discount |  |  |
| Combo applies at split check payment | Eligible check total reflects discount |  |  |

## Admin Reports

| Case | Expected Result | Result | Notes |
|---|---|---:|---|
| Open `/pos/reports` | Reports page loads |  |  |
| Paid revenue updates | Paid payment amount appears in daily revenue |  |  |
| Open order count updates | Active orders appear in open orders count |  |  |
| Paid order count updates | Paid orders appear in paid count |  |  |
| Open POS order from report | Link opens the correct POS order |  |  |

## Regression Checks

| Case | Expected Result | Result | Notes |
|---|---|---:|---|
| `@yuta/core` tests | `corepack pnpm --filter @yuta/core test` passes |  |  |
| POS typecheck | `corepack pnpm --filter @yuta/pos typecheck` passes |  |  |
| Admin typecheck | `corepack pnpm --filter @yuta/admin typecheck` passes |  |  |
| POS build | `corepack pnpm --filter @yuta/pos build` passes |  |  |
| Admin build | `corepack pnpm --filter @yuta/admin build` passes |  |  |

## QA Notes

Use this section to record issues found during manual QA.

```txt
Date:
Tester:
Environment:

Issues:
- 

Follow-up:
- 
```
