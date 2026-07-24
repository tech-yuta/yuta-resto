import { relations } from 'drizzle-orm';
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
import { users } from './pos';
import { establishments, organizations } from './tenant';

const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).defaultNow().notNull();

export const authSessions = pgTable(
  'auth_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    establishmentId: uuid('establishment_id')
      .notNull()
      .references(() => establishments.id),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    authVersion: integer('auth_version').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    ipHash: varchar('ip_hash', { length: 64 }),
    userAgent: varchar('user_agent', { length: 500 }),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex('auth_sessions_token_hash_unique_idx').on(table.tokenHash),
    index('auth_sessions_user_id_idx').on(table.userId),
    index('auth_sessions_scope_idx').on(
      table.organizationId,
      table.establishmentId,
    ),
    index('auth_sessions_expires_at_idx').on(table.expiresAt),
    index('auth_sessions_active_idx').on(table.userId, table.revokedAt),
  ],
);

export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex('password_reset_tokens_hash_unique_idx').on(table.tokenHash),
    index('password_reset_tokens_user_id_idx').on(table.userId),
    index('password_reset_tokens_expires_at_idx').on(table.expiresAt),
  ],
);

export const authLoginAttempts = pgTable(
  'auth_login_attempts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    keyHash: varchar('key_hash', { length: 64 }).notNull(),
    attemptedAt: timestamp('attempted_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    succeeded: boolean('succeeded').default(false).notNull(),
  },
  (table) => [
    index('auth_login_attempts_key_time_idx').on(
      table.keyHash,
      table.attemptedAt,
    ),
    index('auth_login_attempts_attempted_at_idx').on(table.attemptedAt),
  ],
);

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(users, {
    fields: [authSessions.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [authSessions.organizationId],
    references: [organizations.id],
  }),
  establishment: one(establishments, {
    fields: [authSessions.establishmentId],
    references: [establishments.id],
  }),
}));

export const passwordResetTokensRelations = relations(
  passwordResetTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [passwordResetTokens.userId],
      references: [users.id],
    }),
  }),
);

export type AuthSession = typeof authSessions.$inferSelect;
