import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { comboRules } from './combos';
import {
  checkSplitModeEnum,
  checkStatusEnum,
  paymentMethodEnum,
  paymentStatusEnum,
} from './enums';
import { orderItems, orders } from './orders';

const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date());

export const checks = pgTable(
  'checks',
  {
    id: uuid('id').primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id),
    checkLabel: varchar('check_label', { length: 255 }).notNull(),
    splitMode: checkSplitModeEnum('split_mode').notNull(),
    status: checkStatusEnum('status').default('open').notNull(),
    subtotalCents: integer('subtotal_cents').default(0).notNull(),
    discountCents: integer('discount_cents').default(0).notNull(),
    totalCents: integer('total_cents').default(0).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('checks_order_id_idx').on(table.orderId),
    index('checks_status_idx').on(table.status),
    index('checks_created_at_idx').on(table.createdAt),
    check(
      'checks_amounts_non_negative_check',
      sql`
      ${table.subtotalCents} >= 0
      and ${table.discountCents} >= 0
      and ${table.totalCents} >= 0
    `,
    ),
  ],
);

export const checkItems = pgTable(
  'check_items',
  {
    id: uuid('id').primaryKey(),
    checkId: uuid('check_id')
      .notNull()
      .references(() => checks.id),
    orderItemId: uuid('order_item_id')
      .notNull()
      .references(() => orderItems.id),
    quantity: integer('quantity').notNull(),
    amountCentsSnapshot: integer('amount_cents_snapshot').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('check_items_check_id_idx').on(table.checkId),
    index('check_items_order_item_id_idx').on(table.orderItemId),
    check('check_items_quantity_positive_check', sql`${table.quantity} > 0`),
    check(
      'check_items_amount_non_negative_check',
      sql`${table.amountCentsSnapshot} >= 0`,
    ),
  ],
);

export const checkDiscounts = pgTable(
  'check_discounts',
  {
    id: uuid('id').primaryKey(),
    checkId: uuid('check_id')
      .notNull()
      .references(() => checks.id),
    comboRuleId: uuid('combo_rule_id').references(() => comboRules.id),
    nameSnapshot: varchar('name_snapshot', { length: 255 }).notNull(),
    discountCents: integer('discount_cents').notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index('check_discounts_check_id_idx').on(table.checkId),
    index('check_discounts_combo_rule_id_idx').on(table.comboRuleId),
    check(
      'check_discounts_amount_non_negative_check',
      sql`${table.discountCents} >= 0`,
    ),
  ],
);

export const checkDiscountItems = pgTable(
  'check_discount_items',
  {
    id: uuid('id').primaryKey(),
    checkDiscountId: uuid('check_discount_id')
      .notNull()
      .references(() => checkDiscounts.id),
    checkItemId: uuid('check_item_id')
      .notNull()
      .references(() => checkItems.id),
    quantityApplied: integer('quantity_applied').notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index('check_discount_items_check_discount_id_idx').on(
      table.checkDiscountId,
    ),
    index('check_discount_items_check_item_id_idx').on(table.checkItemId),
    check(
      'check_discount_items_quantity_positive_check',
      sql`${table.quantityApplied} > 0`,
    ),
  ],
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id),
    checkId: uuid('check_id').references(() => checks.id),
    method: paymentMethodEnum('method').notNull(),
    amountCents: integer('amount_cents').notNull(),
    tenderedCents: integer('tendered_cents'),
    changeCents: integer('change_cents'),
    tipCents: integer('tip_cents').default(0).notNull(),
    status: paymentStatusEnum('status').default('pending').notNull(),
    paidBy: varchar('paid_by', { length: 255 }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    refundedAt: timestamp('refunded_at', { withTimezone: true }),
    refundReason: text('refund_reason'),
    idempotencyKey: uuid('idempotency_key'),
    createdAt: createdAt(),
  },
  (table) => [
    index('payments_order_id_idx').on(table.orderId),
    index('payments_check_id_idx').on(table.checkId),
    index('payments_status_idx').on(table.status),
    index('payments_created_at_idx').on(table.createdAt),
    uniqueIndex('payments_idempotency_key_unique_idx').on(table.idempotencyKey),
    check('payments_amount_positive_check', sql`${table.amountCents} > 0`),
    check('payments_tip_non_negative_check', sql`${table.tipCents} >= 0`),
  ],
);

export type Check = typeof checks.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
