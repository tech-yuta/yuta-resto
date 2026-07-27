import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { menuItems } from './catalog';
import { comboPricingModeEnum } from './enums';
import { orderItems, orders } from './orders';

const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date());

export const comboRules = pgTable(
  'combo_rules',
  {
    id: uuid('id').primaryKey(),
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
    check(
      'combo_rules_max_applications_positive_check',
      sql`${table.maxApplications} is null or ${table.maxApplications} > 0`,
    ),
  ],
);

export const comboRuleGroups = pgTable(
  'combo_rule_groups',
  {
    id: uuid('id').primaryKey(),
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
    check(
      'combo_rule_groups_quantity_range_check',
      sql`${table.minQuantity} >= 0 and ${table.maxQuantity} >= ${table.minQuantity}`,
    ),
  ],
);

export const comboRuleGroupItems = pgTable(
  'combo_rule_group_items',
  {
    id: uuid('id').primaryKey(),
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
    id: uuid('id').primaryKey(),
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
    check(
      'order_discounts_amount_non_negative_check',
      sql`${table.discountCents} >= 0`,
    ),
  ],
);

export const orderDiscountItems = pgTable(
  'order_discount_items',
  {
    id: uuid('id').primaryKey(),
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
    check(
      'order_discount_items_quantity_positive_check',
      sql`${table.quantityApplied} > 0`,
    ),
  ],
);

export type ComboRule = typeof comboRules.$inferSelect;
export type ComboRuleGroup = typeof comboRuleGroups.$inferSelect;
export type ComboRuleGroupItem = typeof comboRuleGroupItems.$inferSelect;
