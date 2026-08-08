import {
  check,
  integer,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import {
  printJobSourceEnum,
  printJobStatusEnum,
  printJobTypeEnum,
} from './enums';

export const printSettings = pgTable(
  'print_settings',
  {
    id: varchar('id', { length: 32 }).primaryKey(),
    kitchenCopies: integer('kitchen_copies').default(1).notNull(),
    counterCopies: integer('counter_copies').default(1).notNull(),
    fontSizePreset: varchar('font_size_preset', {
      length: 16,
      enum: ['compact', 'standard', 'large'],
    })
      .default('standard')
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    check('print_settings_singleton_check', sql`${table.id} = 'default'`),
    check(
      'print_settings_kitchen_copies_check',
      sql`${table.kitchenCopies} between 1 and 3`,
    ),
    check(
      'print_settings_counter_copies_check',
      sql`${table.counterCopies} between 1 and 3`,
    ),
    check(
      'print_settings_font_size_preset_check',
      sql`${table.fontSizePreset} in ('compact', 'standard', 'large')`,
    ),
  ],
);
import { orders } from './orders';
import { checks, payments } from './payments';

export const printJobs = pgTable(
  'print_jobs',
  {
    id: uuid('id').primaryKey(),
    orderId: uuid('order_id').references(() => orders.id),
    checkId: uuid('check_id').references(() => checks.id),
    paymentId: uuid('payment_id').references(() => payments.id),
    source: printJobSourceEnum('source').notNull(),
    printerName: varchar('printer_name', { length: 255 }).notNull(),
    jobType: printJobTypeEnum('job_type').notNull(),
    status: printJobStatusEnum('status').default('pending').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    errorMessage: text('error_message'),
    idempotencyKey: uuid('idempotency_key'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
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

export type PrintJob = typeof printJobs.$inferSelect;
export type NewPrintJob = typeof printJobs.$inferInsert;
export type PrintSettings = typeof printSettings.$inferSelect;
