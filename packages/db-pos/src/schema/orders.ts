import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { menuItems } from './catalog';
import {
  allergySeverityEnum,
  kitchenStationEnum,
  orderItemStatusEnum,
  orderStatusEnum,
  orderTypeEnum,
  paymentModeEnum,
} from './enums';
import { localUsers } from './users';

export type SelectedInstructionSnapshot = {
  instructionId: string;
  code: string;
  labelSnapshot: string;
};

export type ItemVariantSnapshot = {
  code: string;
  labelSnapshot: string;
  quantity: number;
};

const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date());

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey(),
    orderNumber: varchar('order_number', { length: 64 }).notNull(),
    tableLabel: varchar('table_label', { length: 255 }).notNull(),
    orderType: orderTypeEnum('order_type').notNull(),
    status: orderStatusEnum('status').default('draft').notNull(),
    subtotalCents: integer('subtotal_cents').default(0).notNull(),
    discountCents: integer('discount_cents').default(0).notNull(),
    totalCents: integer('total_cents').default(0).notNull(),
    paymentMode: paymentModeEnum('payment_mode').default('single').notNull(),
    note: text('note'),
    hasAllergy: boolean('has_allergy').default(false).notNull(),
    allergyNote: text('allergy_note'),
    allergyAcknowledgedAt: timestamp('allergy_acknowledged_at', {
      withTimezone: true,
    }),
    allergyAcknowledgedBy: uuid('allergy_acknowledged_by').references(
      () => localUsers.id,
    ),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => localUsers.id),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancelledReason: text('cancelled_reason'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('orders_order_number_unique_idx').on(table.orderNumber),
    index('orders_status_idx').on(table.status),
    index('orders_created_at_idx').on(table.createdAt),
    index('orders_created_by_idx').on(table.createdBy),
    check(
      'orders_amounts_non_negative_check',
      sql`
      ${table.subtotalCents} >= 0
      and ${table.discountCents} >= 0
      and ${table.totalCents} >= 0
    `,
    ),
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id),
    menuItemId: uuid('menu_item_id')
      .notNull()
      .references(() => menuItems.id),
    itemNameSnapshot: varchar('item_name_snapshot', { length: 255 }).notNull(),
    unitPriceCentsSnapshot: integer('unit_price_cents_snapshot').notNull(),
    kitchenStationSnapshot: kitchenStationEnum(
      'kitchen_station_snapshot',
    ).notNull(),
    quantity: integer('quantity').notNull(),
    note: text('note'),
    quickInstructions: jsonb('quick_instructions')
      .$type<SelectedInstructionSnapshot[]>()
      .default([])
      .notNull(),
    selectedVariants: jsonb('selected_variants')
      .$type<ItemVariantSnapshot[]>()
      .default([])
      .notNull(),
    hasAllergy: boolean('has_allergy').default(false).notNull(),
    allergenCodes: jsonb('allergen_codes')
      .$type<string[]>()
      .default([])
      .notNull(),
    allergySeverity: allergySeverityEnum('allergy_severity'),
    allergyNote: text('allergy_note'),
    allergyAcknowledgedAt: timestamp('allergy_acknowledged_at', {
      withTimezone: true,
    }),
    allergyAcknowledgedBy: uuid('allergy_acknowledged_by').references(
      () => localUsers.id,
    ),
    allergyKitchenConfirmedAt: timestamp('allergy_kitchen_confirmed_at', {
      withTimezone: true,
    }),
    allergyKitchenConfirmedBy: uuid('allergy_kitchen_confirmed_by').references(
      () => localUsers.id,
    ),
    status: orderItemStatusEnum('status').default('pending').notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    readyAt: timestamp('ready_at', { withTimezone: true }),
    servedAt: timestamp('served_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancelledReason: text('cancelled_reason'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('order_items_order_id_idx').on(table.orderId),
    index('order_items_menu_item_id_idx').on(table.menuItemId),
    index('order_items_status_idx').on(table.status),
    index('order_items_created_at_idx').on(table.createdAt),
    check('order_items_quantity_positive_check', sql`${table.quantity} > 0`),
    check(
      'order_items_price_non_negative_check',
      sql`${table.unitPriceCentsSnapshot} >= 0`,
    ),
  ],
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
