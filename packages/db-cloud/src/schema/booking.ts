import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { establishments, organizations } from './tenancy';
import { users } from './users';

export const bookingConfirmationModeEnum = pgEnum('booking_confirmation_mode', [
  'AUTOMATIC',
  'MANUAL',
]);
export const reservationStatusEnum = pgEnum('reservation_status', [
  'PENDING',
  'CONFIRMED',
  'DECLINED',
  'CANCELLED',
  'SEATED',
  'COMPLETED',
  'NO_SHOW',
]);
export const reservationSourceEnum = pgEnum('reservation_source', [
  'DIRECT',
  'GOOGLE',
  'FACEBOOK',
  'INSTAGRAM',
  'TIKTOK',
  'QR_CODE',
  'WEBSITE',
  'PHONE',
  'BACK_OFFICE',
  'OTHER',
]);
export const bookingExceptionKindEnum = pgEnum('booking_exception_kind', [
  'CLOSED_ALL_DAY',
  'CLOSED_SERVICE',
  'MODIFIED_HOURS',
  'BLOCKED_SLOT',
]);
export const bookingActorTypeEnum = pgEnum('booking_actor_type', [
  'GUEST',
  'USER',
  'SYSTEM',
]);
export const bookingNotificationStatusEnum = pgEnum(
  'booking_notification_status',
  ['PENDING', 'PROCESSING', 'SENT', 'FAILED'],
);

const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date());

export const bookingSettings = pgTable(
  'booking_settings',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    establishmentId: uuid('establishment_id')
      .notNull()
      .references(() => establishments.id, { onDelete: 'cascade' }),
    enabled: boolean('enabled').default(false).notNull(),
    confirmationMode: bookingConfirmationModeEnum('confirmation_mode')
      .default('MANUAL')
      .notNull(),
    minimumPartySize: integer('minimum_party_size').default(1).notNull(),
    maximumPartySize: integer('maximum_party_size').default(12).notNull(),
    slotIntervalMinutes: integer('slot_interval_minutes').default(30).notNull(),
    averageDurationMinutes: integer('average_duration_minutes')
      .default(90)
      .notNull(),
    minimumNoticeMinutes: integer('minimum_notice_minutes')
      .default(120)
      .notNull(),
    bookingWindowDays: integer('booking_window_days').default(60).notNull(),
    cancellationDeadlineMinutes: integer('cancellation_deadline_minutes')
      .default(120)
      .notNull(),
    publicPhone: varchar('public_phone', { length: 30 }),
    publicEmail: varchar('public_email', { length: 254 }),
    address: text('address'),
    welcomeMessage: text('welcome_message'),
    bookingPolicy: text('booking_policy'),
    logoUrl: text('logo_url'),
    coverImageUrl: text('cover_image_url'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('booking_settings_scope_unique_idx').on(
      table.organizationId,
      table.establishmentId,
    ),
    check(
      'booking_settings_party_size_check',
      sql`${table.minimumPartySize} > 0 and ${table.maximumPartySize} >= ${table.minimumPartySize}`,
    ),
    check(
      'booking_settings_intervals_check',
      sql`${table.slotIntervalMinutes} > 0 and ${table.averageDurationMinutes} > 0 and ${table.minimumNoticeMinutes} >= 0 and ${table.bookingWindowDays} >= 0 and ${table.cancellationDeadlineMinutes} >= 0`,
    ),
  ],
);

export const bookingServicePeriods = pgTable(
  'booking_service_periods',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    establishmentId: uuid('establishment_id')
      .notNull()
      .references(() => establishments.id),
    dayOfWeek: integer('day_of_week').notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    startTime: time('start_time', { precision: 0 }).notNull(),
    endTime: time('end_time', { precision: 0 }).notNull(),
    capacity: integer('capacity').notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('booking_service_periods_scope_day_idx').on(
      table.organizationId,
      table.establishmentId,
      table.dayOfWeek,
    ),
    check(
      'booking_service_periods_day_check',
      sql`${table.dayOfWeek} between 0 and 6`,
    ),
    check(
      'booking_service_periods_time_check',
      sql`${table.endTime} > ${table.startTime}`,
    ),
    check('booking_service_periods_capacity_check', sql`${table.capacity} > 0`),
  ],
);

export const bookingExceptions = pgTable(
  'booking_exceptions',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    establishmentId: uuid('establishment_id')
      .notNull()
      .references(() => establishments.id),
    exceptionDate: date('exception_date').notNull(),
    kind: bookingExceptionKindEnum('kind').notNull(),
    servicePeriodId: uuid('service_period_id').references(
      () => bookingServicePeriods.id,
      {
        onDelete: 'cascade',
      },
    ),
    startTime: time('start_time', { precision: 0 }),
    endTime: time('end_time', { precision: 0 }),
    capacityOverride: integer('capacity_override'),
    reason: text('reason'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('booking_exceptions_scope_date_idx').on(
      table.organizationId,
      table.establishmentId,
      table.exceptionDate,
    ),
    check(
      'booking_exceptions_capacity_check',
      sql`${table.capacityOverride} is null or ${table.capacityOverride} >= 0`,
    ),
  ],
);

export const reservations = pgTable(
  'reservations',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    establishmentId: uuid('establishment_id')
      .notNull()
      .references(() => establishments.id),
    reference: varchar('reference', { length: 30 }).notNull(),
    status: reservationStatusEnum('status').notNull(),
    source: reservationSourceEnum('source').default('DIRECT').notNull(),
    localDate: date('local_date').notNull(),
    localTime: time('local_time', { precision: 0 }).notNull(),
    timezone: varchar('timezone', { length: 100 }).notNull(),
    startAt: timestamp('start_at', { withTimezone: true }).notNull(),
    endAt: timestamp('end_at', { withTimezone: true }).notNull(),
    partySize: integer('party_size').notNull(),
    guestFirstName: varchar('guest_first_name', { length: 100 }).notNull(),
    guestLastName: varchar('guest_last_name', { length: 100 }).notNull(),
    guestEmail: varchar('guest_email', { length: 254 }).notNull(),
    guestPhone: varchar('guest_phone', { length: 30 }).notNull(),
    specialRequirements: text('special_requirements'),
    marketingConsent: boolean('marketing_consent').default(false).notNull(),
    policyAcceptedAt: timestamp('policy_accepted_at', { withTimezone: true }),
    publicTokenHash: varchar('public_token_hash', { length: 64 }).notNull(),
    idempotencyHash: varchar('idempotency_hash', { length: 64 }).notNull(),
    requestFingerprint: varchar('request_fingerprint', {
      length: 64,
    }).notNull(),
    establishmentNameSnapshot: varchar('establishment_name_snapshot', {
      length: 255,
    }).notNull(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('reservations_reference_unique_idx').on(table.reference),
    uniqueIndex('reservations_public_token_hash_unique_idx').on(
      table.publicTokenHash,
    ),
    uniqueIndex('reservations_scope_idempotency_unique_idx').on(
      table.organizationId,
      table.establishmentId,
      table.idempotencyHash,
    ),
    index('reservations_scope_start_idx').on(
      table.organizationId,
      table.establishmentId,
      table.startAt,
    ),
    index('reservations_capacity_idx').on(
      table.organizationId,
      table.establishmentId,
      table.localDate,
      table.localTime,
      table.status,
    ),
    check('reservations_party_size_check', sql`${table.partySize} > 0`),
    check(
      'reservations_time_order_check',
      sql`${table.endAt} > ${table.startAt}`,
    ),
  ],
);

export const reservationStatusHistory = pgTable(
  'reservation_status_history',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    establishmentId: uuid('establishment_id')
      .notNull()
      .references(() => establishments.id),
    reservationId: uuid('reservation_id')
      .notNull()
      .references(() => reservations.id, {
        onDelete: 'cascade',
      }),
    fromStatus: reservationStatusEnum('from_status'),
    toStatus: reservationStatusEnum('to_status').notNull(),
    actorType: bookingActorTypeEnum('actor_type').notNull(),
    actorUserId: uuid('actor_user_id').references(() => users.id),
    reason: text('reason'),
    createdAt: createdAt(),
  },
  (table) => [
    index('reservation_status_history_reservation_idx').on(table.reservationId),
  ],
);

export const reservationInternalNotes = pgTable(
  'reservation_internal_notes',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    establishmentId: uuid('establishment_id')
      .notNull()
      .references(() => establishments.id),
    reservationId: uuid('reservation_id')
      .notNull()
      .references(() => reservations.id, {
        onDelete: 'cascade',
      }),
    authorUserId: uuid('author_user_id')
      .notNull()
      .references(() => users.id),
    body: text('body').notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index('reservation_internal_notes_reservation_idx').on(table.reservationId),
  ],
);

export const bookingAuditEvents = pgTable(
  'booking_audit_events',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    establishmentId: uuid('establishment_id')
      .notNull()
      .references(() => establishments.id),
    reservationId: uuid('reservation_id').references(() => reservations.id, {
      onDelete: 'set null',
    }),
    actorType: bookingActorTypeEnum('actor_type').notNull(),
    actorUserId: uuid('actor_user_id').references(() => users.id),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    metadata: jsonb('metadata')
      .$type<Record<string, string | number | boolean | null>>()
      .default({})
      .notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index('booking_audit_events_scope_idx').on(
      table.organizationId,
      table.establishmentId,
    ),
  ],
);

export const bookingNotificationDeliveries = pgTable(
  'booking_notification_deliveries',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    establishmentId: uuid('establishment_id')
      .notNull()
      .references(() => establishments.id),
    reservationId: uuid('reservation_id')
      .notNull()
      .references(() => reservations.id, {
        onDelete: 'cascade',
      }),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    channel: varchar('channel', { length: 30 }).default('EMAIL').notNull(),
    recipient: varchar('recipient', { length: 254 }).notNull(),
    status: bookingNotificationStatusEnum('status')
      .default('PENDING')
      .notNull(),
    attemptCount: integer('attempt_count').default(0).notNull(),
    providerMessageId: text('provider_message_id'),
    lastError: text('last_error'),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('booking_notification_outbox_idx').on(
      table.status,
      table.nextAttemptAt,
    ),
  ],
);

export const bookingPublicAttempts = pgTable(
  'booking_public_attempts',
  {
    id: uuid('id').primaryKey(),
    establishmentId: uuid('establishment_id')
      .notNull()
      .references(() => establishments.id),
    action: varchar('action', { length: 30 }).notNull(),
    subjectHash: varchar('subject_hash', { length: 64 }).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index('booking_public_attempts_lookup_idx').on(
      table.establishmentId,
      table.action,
      table.subjectHash,
      table.createdAt,
    ),
    index('booking_public_attempts_cleanup_idx').on(table.createdAt),
  ],
);

export type Reservation = typeof reservations.$inferSelect;
export type BookingSettings = typeof bookingSettings.$inferSelect;
