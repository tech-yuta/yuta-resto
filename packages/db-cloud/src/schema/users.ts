import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const userStatusEnum = pgEnum('user_status', ['ACTIVE', 'DISABLED']);
export const systemRoleEnum = pgEnum('system_role', [
  'YUTA_ADMIN',
  'YUTA_SUPPORT',
]);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(),
    authProviderId: varchar('auth_provider_id', { length: 191 })
      .notNull()
      .unique(),
    displayName: varchar('display_name', { length: 160 }),
    email: varchar('email', { length: 320 }).notNull(),
    status: userStatusEnum('status').default('ACTIVE').notNull(),
    systemRole: systemRoleEnum('system_role'),
    passwordHash: text('password_hash'),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    authVersion: integer('auth_version').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    uniqueIndex('users_email_unique_idx').on(sql`lower(${table.email})`),
    index('users_status_idx').on(table.status),
    index('users_system_role_idx').on(table.systemRole),
  ],
);

export type CloudUser = typeof users.$inferSelect;
export type NewCloudUser = typeof users.$inferInsert;
