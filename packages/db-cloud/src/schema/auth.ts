import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { establishments, organizations } from './tenancy';
import { users } from './users';

const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).defaultNow().notNull();

export const authSessions = pgTable(
  'auth_sessions',
  {
    id: uuid('id').primaryKey(),
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
  ],
);

export const authSelectionTickets = pgTable(
  'auth_selection_tickets',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    authVersion: integer('auth_version').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    ipHash: varchar('ip_hash', { length: 64 }),
    userAgent: varchar('user_agent', { length: 500 }),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex('auth_selection_tickets_token_hash_unique_idx').on(
      table.tokenHash,
    ),
    index('auth_selection_tickets_user_id_idx').on(table.userId),
    index('auth_selection_tickets_expires_at_idx').on(table.expiresAt),
  ],
);

export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: uuid('id').primaryKey(),
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
    id: uuid('id').primaryKey(),
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
  ],
);

export const authAuditEvents = pgTable(
  'auth_audit_events',
  {
    id: uuid('id').primaryKey(),
    event: varchar('event', { length: 100 }).notNull(),
    actorUserId: uuid('actor_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    subjectUserId: uuid('subject_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    organizationId: uuid('organization_id').references(() => organizations.id),
    establishmentId: uuid('establishment_id').references(
      () => establishments.id,
    ),
    metadata: jsonb('metadata')
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index('auth_audit_events_actor_user_id_idx').on(table.actorUserId),
    index('auth_audit_events_subject_user_id_idx').on(table.subjectUserId),
    index('auth_audit_events_scope_idx').on(
      table.organizationId,
      table.establishmentId,
    ),
    index('auth_audit_events_created_at_idx').on(table.createdAt),
  ],
);

export type AuthSession = typeof authSessions.$inferSelect;
export type AuthSelectionTicket = typeof authSelectionTickets.$inferSelect;
export type AuthAuditEvent = typeof authAuditEvents.$inferSelect;
