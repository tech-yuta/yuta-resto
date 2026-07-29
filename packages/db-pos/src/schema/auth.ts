import {
  boolean,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { localUsers } from './users';

export const localAuthSessions = pgTable(
  'local_auth_sessions',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => localUsers.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    authVersion: integer('auth_version').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('local_auth_sessions_token_hash_unique_idx').on(
      table.tokenHash,
    ),
    index('local_auth_sessions_user_id_idx').on(table.userId),
    index('local_auth_sessions_expires_at_idx').on(table.expiresAt),
  ],
);

export const localAuthLoginAttempts = pgTable(
  'local_auth_login_attempts',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => localUsers.id, { onDelete: 'cascade' }),
    attemptedAt: timestamp('attempted_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    succeeded: boolean('succeeded').default(false).notNull(),
  },
  (table) => [
    index('local_auth_login_attempts_user_time_idx').on(
      table.userId,
      table.attemptedAt,
    ),
  ],
);

export type LocalAuthSession = typeof localAuthSessions.$inferSelect;
