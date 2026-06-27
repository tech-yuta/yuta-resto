# YuTa POS MVP Master Specification

## 0. Purpose

This document is the master specification for building the YuTa internal restaurant POS MVP.

The app is for internal restaurant operations only. The restaurant already uses a separate certified cash register system, so fiscal/tax-compliant receipts, VAT accounting, and legal cash-register certification are out of scope for this MVP.

The MVP must be simple, reliable, tablet-friendly, and able to run on a local mini PC server 24/7.

## 1. Repository Fit

YuTa is an existing pnpm monorepo. The POS MVP must follow the current repository conventions instead of creating a greenfield structure.

Use:

```txt
apps/yuta-pos       POS, kitchen workflow, payments, and split payment MVP
apps/admin          Existing admin dashboard for back-office POS management
packages/db         Shared database package for YuTa ecosystem apps
packages/core       Shared business logic where appropriate
packages/ui         Shared UI component library (@yuta/ui)
```

Important exception:

```txt
apps/yuta-display
```

`apps/yuta-display` is a separate signage app and keeps its own local database setup. Do not move or merge the display database into `packages/db` as part of the POS MVP.

## 2. Tech Stack

Use the existing project stack:

```txt
pnpm
Next.js App Router
React 19
TypeScript strict mode
Tailwind CSS 4
PostgreSQL
Drizzle ORM
Zod
Docker Compose
Local server
Tailscale remote access
```

All UI must use `@yuta/ui`. Do not introduce MUI, Ant Design, Chakra UI, Mantine, or another component library. Use `lucide-react` for icons.

## 3. Language Rules

- Code, comments, types, variables, commit messages, and documentation: English.
- `apps/yuta-pos` UI text: French.
- Admin POS UI text: French.

## 4. Core POS Flow

The MVP must support this main flow:

```txt
Create order
  -> enter table label as free text
  -> add menu items quickly
  -> send items to kitchen
  -> kitchen prepares items
  -> payment screen
  -> auto-apply combo discounts
  -> full payment or split payment
  -> close order
```

There is no table management module for MVP. Do not create a table map, table state screen, or `restaurant_tables` table.

Store table information as:

```ts
orders.tableLabel: string;
```

Examples:

```txt
Table 3
Terrasse 5
Emporter
Uber Eats
Deliveroo
Client Martin
```

## 5. Business Rules

### 5.1 Historical Accuracy

Menu prices and names can change later. Old orders must remain correct.

Every order item must store snapshots:

```txt
itemNameSnapshot
unitPriceCentsSnapshot
kitchenStationSnapshot
```

### 5.2 Kitchen Display

Kitchen must see real production items only. Kitchen must not see combo names or combo discounts.

Example:

```txt
Customer gets Combo A from Bun bo + Coca.
Kitchen sees:
- Bun bo
- Coca
```

Combos are payment/discount logic, not kitchen production logic.

### 5.3 Combo Handling

Staff should add individual menu items quickly without thinking about combos.

Correct workflow:

```txt
Add Bun bo 13 EUR
Add Coca 3 EUR

At payment:
System detects Combo A = main dish + drink = 14 EUR
System adds discount -2 EUR

Final:
Bun bo 13 EUR
Coca 3 EUR
Combo A discount -2 EUR
Total 14 EUR
```

Combos are represented as automatic discounts. Do not replace order items with combo items.

### 5.4 Split Payment

The system must support:

```txt
1. Pay full order
2. Split by items
3. Split equally
```

Rules:

- Full payment optimizes combo discounts on the whole order.
- Split by items creates checks and recalculates combo discounts inside each check.
- Split equally optimizes the full order first, then divides the final total.
- For split by items, combo discounts apply only inside the same check.

### 5.5 No Hard Delete

Do not hard-delete historical data:

```txt
orders
order_items
payments
discounts
checks
print_jobs
```

Use statuses such as:

```txt
cancelled
void
refunded
failed
```

## 6. Status Model

### 6.1 Order Status

```ts
type OrderStatus =
  | 'draft'
  | 'sent'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'paid'
  | 'cancelled';
```

Normal flow:

```txt
draft -> sent -> preparing -> ready -> served -> paid
```

Cancelled flow:

```txt
draft/sent/preparing/ready/served -> cancelled
```

### 6.2 Order Item Status

```ts
type OrderItemStatus =
  | 'pending'
  | 'sent'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'cancelled';
```

Rules:

- `pending` items can be edited freely.
- `sent`, `preparing`, `ready`, and `served` items should not be deleted.
- Sent or later items can only be cancelled.
- Kitchen display shows `sent` and `preparing` items.
- Ready items can be shown separately or hidden depending on UI.
- For MVP, status applies to the whole order item row quantity. Partial kitchen status for a single row is out of scope.

## 7. Database Rules

Use PostgreSQL + Drizzle ORM in `packages/db`.

General rules:

- Use UUID primary keys.
- Use integer cents for money fields. Never use floats for money.
- Use enums where appropriate.
- Add `createdAt` and `updatedAt` where records can change.
- Add indexes for common lookup fields such as `orderId`, `checkId`, `status`, `createdAt`, and `orderNumber`.
- Use foreign keys.
- Keep snapshot fields for historical accuracy.
- VAT/tax-compliant receipt fields are out of scope for MVP.

## 8. Database Tables

### 8.1 users

```ts
users {
  id: string;
  name: string;
  email?: string;
  role: 'admin' | 'manager' | 'staff' | 'kitchen';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 8.2 menu_categories

```ts
menuCategories {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 8.3 menu_items

```ts
menuItems {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  priceCents: number;
  kitchenStation: 'kitchen' | 'bar' | 'dessert' | 'none';
  isAvailable: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

Menu items are real sellable items. Do not represent combo rules as normal menu items for MVP.

### 8.4 orders

```ts
orders {
  id: string;
  orderNumber: string;
  tableLabel: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  status: 'draft' | 'sent' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';

  subtotalCents: number;
  discountCents: number;
  totalCents: number;

  paymentMode: 'single' | 'split_by_items' | 'split_equally';
  note?: string;
  createdBy: string;

  sentAt?: Date;
  paidAt?: Date;
  cancelledAt?: Date;
  cancelledReason?: string;

  createdAt: Date;
  updatedAt: Date;
}
```

### 8.5 order_items

```ts
orderItems {
  id: string;
  orderId: string;
  menuItemId: string;

  itemNameSnapshot: string;
  unitPriceCentsSnapshot: number;
  kitchenStationSnapshot: 'kitchen' | 'bar' | 'dessert' | 'none';

  quantity: number;
  note?: string;

  status: 'pending' | 'sent' | 'preparing' | 'ready' | 'served' | 'cancelled';

  sentAt?: Date;
  readyAt?: Date;
  servedAt?: Date;
  cancelledAt?: Date;
  cancelledReason?: string;

  createdAt: Date;
  updatedAt: Date;
}
```

### 8.6 combo_rules

```ts
comboRules {
  id: string;
  name: string;
  comboPriceCents: number;
  priority: number;
  maxApplications?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

Lower `priority` means higher priority.

### 8.7 combo_rule_groups

```ts
comboRuleGroups {
  id: string;
  comboRuleId: string;
  name: string;
  minQuantity: number;
  maxQuantity: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 8.8 combo_rule_group_items

```ts
comboRuleGroupItems {
  id: string;
  comboRuleGroupId: string;
  menuItemId: string;
  extraPriceCents: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 8.9 order_discounts

```ts
orderDiscounts {
  id: string;
  orderId: string;
  comboRuleId?: string;
  nameSnapshot: string;
  discountCents: number;
  createdAt: Date;
}
```

### 8.10 order_discount_items

```ts
orderDiscountItems {
  id: string;
  orderDiscountId: string;
  orderItemId: string;
  quantityApplied: number;
  createdAt: Date;
}
```

### 8.11 checks

```ts
checks {
  id: string;
  orderId: string;
  checkLabel: string;
  splitMode: 'items' | 'equal';
  status: 'open' | 'paid' | 'void';

  subtotalCents: number;
  discountCents: number;
  totalCents: number;

  createdAt: Date;
  updatedAt: Date;
}
```

For equal split checks, `check_items` may be empty and the check total is stored directly on the check.

### 8.12 check_items

```ts
checkItems {
  id: string;
  checkId: string;
  orderItemId: string;
  quantity: number;
  amountCentsSnapshot: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 8.13 check_discounts

```ts
checkDiscounts {
  id: string;
  checkId: string;
  comboRuleId?: string;
  nameSnapshot: string;
  discountCents: number;
  createdAt: Date;
}
```

### 8.14 check_discount_items

```ts
checkDiscountItems {
  id: string;
  checkDiscountId: string;
  checkItemId: string;
  quantityApplied: number;
  createdAt: Date;
}
```

### 8.15 payments

```ts
payments {
  id: string;
  orderId: string;
  checkId?: string;

  method: 'cash' | 'card' | 'ticket_resto' | 'other';
  amountCents: number;
  tenderedCents?: number;
  changeCents?: number;
  tipCents: number;

  status: 'pending' | 'paid' | 'failed' | 'refunded';

  paidBy?: string;
  paidAt?: Date;
  refundedAt?: Date;
  refundReason?: string;

  createdAt: Date;
}
```

Rules:

- `amountCents` is the amount applied to the order or check.
- For cash, `tenderedCents` is the money received and `changeCents` is the change returned.
- Full order payment uses `checkId = null`.
- Split payment points `checkId` to the relevant check.
- Mark an order as paid only when the correct amount has been paid.

### 8.16 print_jobs

```ts
printJobs {
  id: string;

  source: 'pos' | 'kitchen' | 'delivery' | 'manual';
  printerName: string;

  jobType: 'kitchen_ticket' | 'customer_receipt' | 'test';
  status: 'pending' | 'printing' | 'printed' | 'failed';

  payload: json;
  errorMessage?: string;

  createdAt: Date;
  printedAt?: Date;
}
```

For MVP, print gateway behavior can run in mock mode and write printable content to logs or files.

## 9. Order Service Requirements

Implement:

```ts
createOrder({ tableLabel, orderType, createdBy })
addOrderItem({ orderId, menuItemId, quantity, note })
updateOrderItemQuantity({ orderItemId, quantity })
cancelOrderItem({ orderItemId, reason })
sendOrderToKitchen(orderId)
markOrderItemPreparing(orderItemId)
markOrderItemReady(orderItemId)
markOrderItemServed(orderItemId)
getOpenOrders()
getOrderDetail(orderId)
```

Rules:

- `createOrder` creates an order with status `draft`.
- `addOrderItem` copies menu item snapshots into `order_items`.
- Only `pending` items can be modified freely.
- Sent or preparing items cannot be deleted; use cancellation.
- `sendOrderToKitchen` updates pending items to `sent`.
- `sendOrderToKitchen` sets `sentAt`.
- Order totals must be recalculated after item changes.
- Combo discounts should not be calculated inside the basic order service.
- Combo optimization happens at payment or explicitly from the payment screen.

## 10. Combo Engine

Implement:

```ts
optimizeOrderCombos(orderId)
clearOrderComboDiscounts(orderId)
calculateComboDiscountsForItems(items, comboRules)
optimizeCheckCombos(checkId)
clearCheckComboDiscounts(checkId)
```

Rules:

- Apply combo rules by priority.
- Lower priority number means higher priority.
- One item quantity can only be used once.
- If an order item has quantity 3, it can be expanded into 3 unit items internally.
- Do not modify order items.
- Do not replace order items with combo items.
- Only create a discount if `discountCents > 0`.
- Store discount-to-item mapping.

Tie-breaker for deterministic results:

```txt
When several item combinations match the same combo rule:
1. Choose the combination with the highest positive discount.
2. Then choose older order items first.
3. Then choose lower item id as the final tie-breaker.
```

## 11. Payment and Split Payment

Implement:

```ts
payFullOrder({ orderId, method, amountCents, tenderedCents?, paidBy })
createChecksByItems({ orderId, checks })
splitOrderEqually({ orderId, parts })
payCheck({ checkId, method, amountCents, tenderedCents?, paidBy })
getPaymentSummary(orderId)
```

### 11.1 Full Payment

Flow:

```txt
Open payment screen
  -> run optimizeOrderCombos(orderId)
  -> show final total
  -> create payment
  -> mark order as paid if paid amount covers total
```

### 11.2 Split By Items

Flow:

```txt
Create checks
  -> assign item quantities to each check
  -> validate assigned quantities
  -> run optimizeCheckCombos for each check
  -> each check can be paid separately
  -> order is paid when all checks are paid
```

Assigned check item quantities cannot exceed the original order item quantity.

### 11.3 Split Equally

Flow:

```txt
Run optimizeOrderCombos(orderId)
  -> take final optimized total
  -> split into N checks
  -> handle rounding by cents
  -> each check can be paid separately
```

Rounding rule:

```txt
If total is 10000 cents and parts = 3:
- Part 1: 3334
- Part 2: 3333
- Part 3: 3333
```

The sum must always equal the original optimized total.

## 12. POS UI Requirements

The UI must be simple, tablet-friendly, and in French.

Screens in `apps/yuta-pos`:

```txt
Create order
Order detail
Kitchen
Payment
Split by items
Split equally
```

Do not build a table map.

Use `@yuta/ui` components and YuTa design tokens.

## 13. Admin MVP

Use the existing `apps/admin` app for back-office POS management:

```txt
Manage menu categories
Manage menu items
Manage combo rules
Manage combo rule groups
Manage combo group items
View daily orders
View daily revenue
```

Rules:

- Combo rules must be configurable without code.
- Extra price per eligible combo item must be supported.
- Menu item availability must be toggleable.

## 14. Print Gateway MVP

For MVP, the print gateway can be implemented as a mock workflow before physical printer integration.

Required features:

```txt
Create print job by HTTP API or service function
Store job in print_jobs
Worker processes pending jobs
Mock printer output to text/log file
Mark job as printed or failed
Retry failed jobs
```

Later, this can become `apps/yuta-print-gateway` and convert jobs to ESC/POS for a real thermal printer.

## 15. Implementation Order

Do not build the full system in one giant step.

Recommended order:

```txt
1. Inspect repository structure
2. Create packages/db Drizzle schema
3. Create migrations
4. Add seed data
5. Implement order service
6. Implement combo engine
7. Implement payment/split service
8. Create apps/yuta-pos shell
9. Build POS order UI
10. Build kitchen screen inside yuta-pos
11. Build payment and split screens
12. Add admin menu/combos screens to apps/admin
13. Add print job mock workflow
14. Add unit tests
15. Add Docker Compose following docs/DEPLOYMENT.md
```

## 16. Seed Data

Categories:

```txt
Entrees
Plats
Boissons
Desserts
```

Menu items:

```txt
Bun bo - 13.00 EUR - Plats - kitchen
Com ga - 12.00 EUR - Plats - kitchen
Pho - 14.00 EUR - Plats - kitchen
Coca - 3.00 EUR - Boissons - bar
The glace maison - 4.00 EUR - Boissons - bar
Che - 5.00 EUR - Desserts - dessert
Mochi - 4.00 EUR - Desserts - dessert
```

Combo rules:

```txt
Combo A: main dish + drink = 14.00 EUR
- Main dish: Bun bo, Com ga, Pho (+1 EUR)
- Drink: Coca, The glace maison (+1 EUR)

Combo B: main dish + drink + dessert = 17.00 EUR
- Main dish: Bun bo, Com ga, Pho (+1 EUR)
- Drink: Coca, The glace maison (+1 EUR)
- Dessert: Che, Mochi
```

## 17. Acceptance Criteria

The MVP is acceptable when:

1. Staff can create an order with a free text table label.
2. Staff can add menu items quickly.
3. Staff can send items to kitchen.
4. Kitchen screen shows real items only.
5. Staff can mark items preparing and ready.
6. Payment screen auto-applies combo discounts.
7. Full payment works.
8. Split by items works.
9. Split equally works.
10. Order is marked paid only when all required payments are completed.
11. Historical order data stays correct after menu price changes.
12. Print job mock can create and process print jobs.
13. Unit tests cover core business rules.
