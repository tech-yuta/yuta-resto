import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { kitchenStationEnum } from './enums';

const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date());

export const menuCategories = pgTable(
  'menu_categories',
  {
    id: uuid('id').primaryKey(),
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
    id: uuid('id').primaryKey(),
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

export type MenuCategory = typeof menuCategories.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
