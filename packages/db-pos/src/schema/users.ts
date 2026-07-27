import {
  boolean,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { localUserRoleEnum } from './enums';

export const localUsers = pgTable(
  'local_users',
  {
    id: uuid('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 320 }),
    role: localUserRoleEnum('role').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    uniqueIndex('local_users_email_unique_idx').on(table.email),
    index('local_users_role_idx').on(table.role),
    index('local_users_is_active_idx').on(table.isActive),
  ],
);

export type LocalUser = typeof localUsers.$inferSelect;
export type NewLocalUser = typeof localUsers.$inferInsert;
