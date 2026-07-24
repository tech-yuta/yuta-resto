import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'manager',
  'staff',
  'kitchen',
]);
export const kitchenStationEnum = pgEnum('kitchen_station', [
  'kitchen',
  'bar',
  'dessert',
  'none',
]);
export const orderTypeEnum = pgEnum('order_type', [
  'dine_in',
  'takeaway',
  'delivery',
]);
export const orderStatusEnum = pgEnum('order_status', [
  'draft',
  'sent',
  'preparing',
  'ready',
  'served',
  'paid',
  'cancelled',
]);
export const orderItemStatusEnum = pgEnum('order_item_status', [
  'pending',
  'sent',
  'preparing',
  'ready',
  'served',
  'cancelled',
]);
export const paymentModeEnum = pgEnum('payment_mode', [
  'single',
  'split_by_items',
  'split_equally',
]);
export const checkSplitModeEnum = pgEnum('check_split_mode', [
  'items',
  'equal',
]);
export const checkStatusEnum = pgEnum('check_status', ['open', 'paid', 'void']);
export const paymentMethodEnum = pgEnum('payment_method', [
  'cash',
  'card',
  'ticket_resto',
  'other',
]);
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'failed',
  'refunded',
]);
export const printJobSourceEnum = pgEnum('print_job_source', [
  'pos',
  'kitchen',
  'delivery',
  'manual',
]);
export const printJobTypeEnum = pgEnum('print_job_type', [
  'kitchen_ticket',
  'customer_receipt',
  'test',
]);
export const printJobStatusEnum = pgEnum('print_job_status', [
  'pending',
  'printing',
  'printed',
  'failed',
]);
export const comboPricingModeEnum = pgEnum('combo_pricing_mode', [
  'fixed',
  'base_item_plus_delta',
]);
export const allergySeverityEnum = pgEnum('allergy_severity', [
  'intolerance',
  'allergy',
  'severe_no_traces',
]);

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

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 320 }),
    role: userRoleEnum('role').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    passwordHash: text('password_hash'),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    authVersion: integer('auth_version').default(0).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('users_email_unique_idx').on(table.email),
    index('users_role_idx').on(table.role),
    index('users_is_active_idx').on(table.isActive),
  ],
);

export const menuCategories = pgTable(
  'menu_categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('menu_categories_sort_order_idx').on(table.sortOrder),
    index('menu_categories_is_active_idx').on(table.isActive),
  ],
);

export const menuItems = pgTable(
  'menu_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => menuCategories.id),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    priceCents: integer('price_cents').notNull(),
    kitchenStation: kitchenStationEnum('kitchen_station').notNull(),
    isAvailable: boolean('is_available').default(true).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('menu_items_category_id_idx').on(table.categoryId),
    index('menu_items_kitchen_station_idx').on(table.kitchenStation),
    index('menu_items_is_available_idx').on(table.isAvailable),
    index('menu_items_sort_order_idx').on(table.sortOrder),
  ],
);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
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
      () => users.id,
    ),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
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
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
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
      () => users.id,
    ),
    allergyKitchenConfirmedAt: timestamp('allergy_kitchen_confirmed_at', {
      withTimezone: true,
    }),
    allergyKitchenConfirmedBy: uuid('allergy_kitchen_confirmed_by').references(
      () => users.id,
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
  ],
);

export const comboRules = pgTable(
  'combo_rules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    pricingMode: comboPricingModeEnum('pricing_mode')
      .default('fixed')
      .notNull(),
    comboPriceCents: integer('combo_price_cents').notNull(),
    priceDeltaCents: integer('price_delta_cents').default(0).notNull(),
    basePricingGroupName: varchar('base_pricing_group_name', { length: 255 }),
    priority: integer('priority').default(0).notNull(),
    maxApplications: integer('max_applications'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('combo_rules_priority_idx').on(table.priority),
    index('combo_rules_is_active_idx').on(table.isActive),
  ],
);

export const comboRuleGroups = pgTable(
  'combo_rule_groups',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    comboRuleId: uuid('combo_rule_id')
      .notNull()
      .references(() => comboRules.id),
    name: varchar('name', { length: 255 }).notNull(),
    minQuantity: integer('min_quantity').notNull(),
    maxQuantity: integer('max_quantity').notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('combo_rule_groups_combo_rule_id_idx').on(table.comboRuleId),
    index('combo_rule_groups_sort_order_idx').on(table.sortOrder),
  ],
);

export const comboRuleGroupItems = pgTable(
  'combo_rule_group_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    comboRuleGroupId: uuid('combo_rule_group_id')
      .notNull()
      .references(() => comboRuleGroups.id),
    menuItemId: uuid('menu_item_id')
      .notNull()
      .references(() => menuItems.id),
    extraPriceCents: integer('extra_price_cents').default(0).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('combo_rule_group_items_combo_rule_group_id_idx').on(
      table.comboRuleGroupId,
    ),
    index('combo_rule_group_items_menu_item_id_idx').on(table.menuItemId),
  ],
);

export const orderDiscounts = pgTable(
  'order_discounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id),
    comboRuleId: uuid('combo_rule_id').references(() => comboRules.id),
    nameSnapshot: varchar('name_snapshot', { length: 255 }).notNull(),
    discountCents: integer('discount_cents').notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index('order_discounts_order_id_idx').on(table.orderId),
    index('order_discounts_combo_rule_id_idx').on(table.comboRuleId),
    index('order_discounts_created_at_idx').on(table.createdAt),
  ],
);

export const orderDiscountItems = pgTable(
  'order_discount_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderDiscountId: uuid('order_discount_id')
      .notNull()
      .references(() => orderDiscounts.id),
    orderItemId: uuid('order_item_id')
      .notNull()
      .references(() => orderItems.id),
    quantityApplied: integer('quantity_applied').notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index('order_discount_items_order_discount_id_idx').on(
      table.orderDiscountId,
    ),
    index('order_discount_items_order_item_id_idx').on(table.orderItemId),
  ],
);

export const checks = pgTable(
  'checks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
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
  ],
);

export const checkItems = pgTable(
  'check_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
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
  ],
);

export const checkDiscounts = pgTable(
  'check_discounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
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
  ],
);

export const checkDiscountItems = pgTable(
  'check_discount_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
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
  ],
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
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
  ],
);

export const printJobs = pgTable(
  'print_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id').references(() => orders.id),
    checkId: uuid('check_id').references(() => checks.id),
    paymentId: uuid('payment_id').references(() => payments.id),
    source: printJobSourceEnum('source').notNull(),
    printerName: varchar('printer_name', { length: 255 }).notNull(),
    jobType: printJobTypeEnum('job_type').notNull(),
    status: printJobStatusEnum('status').default('pending').notNull(),
    payload: jsonb('payload').notNull(),
    errorMessage: text('error_message'),
    idempotencyKey: uuid('idempotency_key'),
    createdAt: createdAt(),
    printedAt: timestamp('printed_at', { withTimezone: true }),
  },
  (table) => [
    index('print_jobs_status_idx').on(table.status),
    index('print_jobs_created_at_idx').on(table.createdAt),
    index('print_jobs_order_id_idx').on(table.orderId),
    index('print_jobs_check_id_idx').on(table.checkId),
    index('print_jobs_payment_id_idx').on(table.paymentId),
    uniqueIndex('print_jobs_idempotency_key_unique_idx').on(
      table.idempotencyKey,
    ),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const menuCategoriesRelations = relations(
  menuCategories,
  ({ many }) => ({
    items: many(menuItems),
  }),
);

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  category: one(menuCategories, {
    fields: [menuItems.categoryId],
    references: [menuCategories.id],
  }),
  orderItems: many(orderItems),
  comboRuleGroupItems: many(comboRuleGroupItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  creator: one(users, {
    fields: [orders.createdBy],
    references: [users.id],
  }),
  items: many(orderItems),
  discounts: many(orderDiscounts),
  checks: many(checks),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
  discountItems: many(orderDiscountItems),
  checkItems: many(checkItems),
}));

export const comboRulesRelations = relations(comboRules, ({ many }) => ({
  groups: many(comboRuleGroups),
  orderDiscounts: many(orderDiscounts),
  checkDiscounts: many(checkDiscounts),
}));

export const comboRuleGroupsRelations = relations(
  comboRuleGroups,
  ({ one, many }) => ({
    comboRule: one(comboRules, {
      fields: [comboRuleGroups.comboRuleId],
      references: [comboRules.id],
    }),
    items: many(comboRuleGroupItems),
  }),
);

export const comboRuleGroupItemsRelations = relations(
  comboRuleGroupItems,
  ({ one }) => ({
    group: one(comboRuleGroups, {
      fields: [comboRuleGroupItems.comboRuleGroupId],
      references: [comboRuleGroups.id],
    }),
    menuItem: one(menuItems, {
      fields: [comboRuleGroupItems.menuItemId],
      references: [menuItems.id],
    }),
  }),
);

export const orderDiscountsRelations = relations(
  orderDiscounts,
  ({ one, many }) => ({
    order: one(orders, {
      fields: [orderDiscounts.orderId],
      references: [orders.id],
    }),
    comboRule: one(comboRules, {
      fields: [orderDiscounts.comboRuleId],
      references: [comboRules.id],
    }),
    items: many(orderDiscountItems),
  }),
);

export const orderDiscountItemsRelations = relations(
  orderDiscountItems,
  ({ one }) => ({
    discount: one(orderDiscounts, {
      fields: [orderDiscountItems.orderDiscountId],
      references: [orderDiscounts.id],
    }),
    orderItem: one(orderItems, {
      fields: [orderDiscountItems.orderItemId],
      references: [orderItems.id],
    }),
  }),
);

export const checksRelations = relations(checks, ({ one, many }) => ({
  order: one(orders, {
    fields: [checks.orderId],
    references: [orders.id],
  }),
  items: many(checkItems),
  discounts: many(checkDiscounts),
  payments: many(payments),
}));

export const checkItemsRelations = relations(checkItems, ({ one, many }) => ({
  check: one(checks, {
    fields: [checkItems.checkId],
    references: [checks.id],
  }),
  orderItem: one(orderItems, {
    fields: [checkItems.orderItemId],
    references: [orderItems.id],
  }),
  discountItems: many(checkDiscountItems),
}));

export const checkDiscountsRelations = relations(
  checkDiscounts,
  ({ one, many }) => ({
    check: one(checks, {
      fields: [checkDiscounts.checkId],
      references: [checks.id],
    }),
    comboRule: one(comboRules, {
      fields: [checkDiscounts.comboRuleId],
      references: [comboRules.id],
    }),
    items: many(checkDiscountItems),
  }),
);

export const checkDiscountItemsRelations = relations(
  checkDiscountItems,
  ({ one }) => ({
    discount: one(checkDiscounts, {
      fields: [checkDiscountItems.checkDiscountId],
      references: [checkDiscounts.id],
    }),
    checkItem: one(checkItems, {
      fields: [checkDiscountItems.checkItemId],
      references: [checkItems.id],
    }),
  }),
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
  check: one(checks, {
    fields: [payments.checkId],
    references: [checks.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type MenuCategory = typeof menuCategories.$inferSelect;
export type NewMenuCategory = typeof menuCategories.$inferInsert;
export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type ComboRule = typeof comboRules.$inferSelect;
export type NewComboRule = typeof comboRules.$inferInsert;
export type ComboRuleGroup = typeof comboRuleGroups.$inferSelect;
export type NewComboRuleGroup = typeof comboRuleGroups.$inferInsert;
export type ComboRuleGroupItem = typeof comboRuleGroupItems.$inferSelect;
export type NewComboRuleGroupItem = typeof comboRuleGroupItems.$inferInsert;
export type OrderDiscount = typeof orderDiscounts.$inferSelect;
export type NewOrderDiscount = typeof orderDiscounts.$inferInsert;
export type OrderDiscountItem = typeof orderDiscountItems.$inferSelect;
export type NewOrderDiscountItem = typeof orderDiscountItems.$inferInsert;
export type Check = typeof checks.$inferSelect;
export type NewCheck = typeof checks.$inferInsert;
export type CheckItem = typeof checkItems.$inferSelect;
export type NewCheckItem = typeof checkItems.$inferInsert;
export type CheckDiscount = typeof checkDiscounts.$inferSelect;
export type NewCheckDiscount = typeof checkDiscounts.$inferInsert;
export type CheckDiscountItem = typeof checkDiscountItems.$inferSelect;
export type NewCheckDiscountItem = typeof checkDiscountItems.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type PrintJob = typeof printJobs.$inferSelect;
export type NewPrintJob = typeof printJobs.$inferInsert;
