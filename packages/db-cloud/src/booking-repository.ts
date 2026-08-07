import {
  assertSlotAvailable,
  assertStatusTransition,
  generateAvailability,
  isCancellationAllowed,
  localDateTimeToInstant,
  normalizeEmail,
  normalizePhone,
  type AvailabilitySlot,
} from '@yuta/booking';
import type {
  BookingExceptionInput,
  BookingServicePeriodInput,
  BookingSettingsInput,
  CreatePublicReservationInput,
  ReservationStatus,
} from '@yuta/contracts/reservations';
import type { TenantContext } from '@yuta/tenant';
import { and, asc, desc, eq, gte, inArray, lte, ne, sql } from 'drizzle-orm';
import { createHash, randomBytes } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';
import type { CloudDatabaseClient } from './client';
import {
  bookingAuditEvents,
  bookingExceptions,
  bookingNotificationDeliveries,
  bookingPublicAttempts,
  bookingServicePeriods,
  bookingSettings,
  establishments,
  organizations,
  reservationInternalNotes,
  reservations,
  reservationStatusHistory,
  tenantEntitlements,
} from './schema';

export type PublicBookingConfiguration = {
  organizationId: string;
  establishmentId: string;
  establishmentName: string;
  slug: string;
  locale: string;
  timezone: string;
  enabled: boolean;
  confirmationMode: 'AUTOMATIC' | 'MANUAL';
  minimumPartySize: number;
  maximumPartySize: number;
  slotIntervalMinutes: number;
  averageDurationMinutes: number;
  minimumNoticeMinutes: number;
  bookingWindowDays: number;
  cancellationDeadlineMinutes: number;
  publicPhone: string | null;
  publicEmail: string | null;
  address: string | null;
  welcomeMessage: string | null;
  bookingPolicy: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
};

export type BookingRepositoryErrorCode =
  | 'BOOKING_NOT_FOUND'
  | 'BOOKING_DISABLED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'RATE_LIMITED'
  | 'SLOT_UNAVAILABLE'
  | 'CANCELLATION_NOT_ALLOWED';

export class BookingRepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: BookingRepositoryErrorCode,
  ) {
    super(message);
    this.name = 'BookingRepositoryError';
  }
}

const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex');
const timeValue = (value: string) => value.slice(0, 5);
type BookingTenantContext = TenantContext & { establishmentId: string };

export async function findPublicBookingConfiguration(
  db: CloudDatabaseClient,
  slug: string,
): Promise<PublicBookingConfiguration | null> {
  const [row] = await db
    .select({
      organizationId: bookingSettings.organizationId,
      establishmentId: bookingSettings.establishmentId,
      establishmentName: establishments.name,
      slug: establishments.slug,
      locale: establishments.locale,
      timezone: establishments.timezone,
      enabled: bookingSettings.enabled,
      confirmationMode: bookingSettings.confirmationMode,
      minimumPartySize: bookingSettings.minimumPartySize,
      maximumPartySize: bookingSettings.maximumPartySize,
      slotIntervalMinutes: bookingSettings.slotIntervalMinutes,
      averageDurationMinutes: bookingSettings.averageDurationMinutes,
      minimumNoticeMinutes: bookingSettings.minimumNoticeMinutes,
      bookingWindowDays: bookingSettings.bookingWindowDays,
      cancellationDeadlineMinutes: bookingSettings.cancellationDeadlineMinutes,
      publicPhone: establishments.publicPhone,
      publicEmail: establishments.publicEmail,
      addressLine1: establishments.addressLine1,
      addressLine2: establishments.addressLine2,
      postalCode: establishments.postalCode,
      city: establishments.city,
      countryCode: establishments.countryCode,
      publicAddress: establishments.publicAddress,
      publicPhoneVisible: establishments.publicPhoneVisible,
      publicEmailVisible: establishments.publicEmailVisible,
      welcomeMessage: bookingSettings.welcomeMessage,
      bookingPolicy: bookingSettings.bookingPolicy,
      logoUrl: establishments.logoUrl,
      coverImageUrl: establishments.coverImageUrl,
    })
    .from(bookingSettings)
    .innerJoin(
      establishments,
      and(
        eq(establishments.id, bookingSettings.establishmentId),
        eq(establishments.organizationId, bookingSettings.organizationId),
      ),
    )
    .innerJoin(
      organizations,
      eq(organizations.id, bookingSettings.organizationId),
    )
    .innerJoin(
      tenantEntitlements,
      and(
        eq(tenantEntitlements.organizationId, bookingSettings.organizationId),
        eq(tenantEntitlements.establishmentId, bookingSettings.establishmentId),
        eq(tenantEntitlements.key, 'booking.enabled'),
        eq(tenantEntitlements.enabled, true),
      ),
    )
    .where(
      and(
        sql`lower(${establishments.slug}) = lower(${slug})`,
        eq(establishments.status, 'active'),
        eq(organizations.status, 'active'),
        eq(bookingSettings.enabled, true),
      ),
    )
    .limit(1);
  if (!row) return null;
  const address = row.publicAddress
    ? [
        row.addressLine1,
        row.addressLine2,
        [row.postalCode, row.city].filter(Boolean).join(' '),
        row.countryCode,
      ]
        .filter(Boolean)
        .join(', ') || null
    : null;
  return {
    organizationId: row.organizationId,
    establishmentId: row.establishmentId,
    establishmentName: row.establishmentName,
    slug: row.slug,
    locale: row.locale,
    timezone: row.timezone,
    enabled: row.enabled,
    confirmationMode: row.confirmationMode,
    minimumPartySize: row.minimumPartySize,
    maximumPartySize: row.maximumPartySize,
    slotIntervalMinutes: row.slotIntervalMinutes,
    averageDurationMinutes: row.averageDurationMinutes,
    minimumNoticeMinutes: row.minimumNoticeMinutes,
    bookingWindowDays: row.bookingWindowDays,
    cancellationDeadlineMinutes: row.cancellationDeadlineMinutes,
    publicPhone: row.publicPhoneVisible ? row.publicPhone : null,
    publicEmail: row.publicEmailVisible ? row.publicEmail : null,
    address,
    welcomeMessage: row.welcomeMessage,
    bookingPolicy: row.bookingPolicy,
    logoUrl: row.logoUrl,
    coverImageUrl: row.coverImageUrl,
  };
}

async function availabilityRows(
  db: CloudDatabaseClient,
  config: PublicBookingConfiguration,
  date: string,
) {
  const [periods, exceptions, consumed] = await Promise.all([
    db
      .select()
      .from(bookingServicePeriods)
      .where(
        and(
          eq(bookingServicePeriods.organizationId, config.organizationId),
          eq(bookingServicePeriods.establishmentId, config.establishmentId),
          eq(bookingServicePeriods.enabled, true),
        ),
      )
      .orderBy(
        asc(bookingServicePeriods.sortOrder),
        asc(bookingServicePeriods.startTime),
      ),
    db
      .select()
      .from(bookingExceptions)
      .where(
        and(
          eq(bookingExceptions.organizationId, config.organizationId),
          eq(bookingExceptions.establishmentId, config.establishmentId),
          eq(bookingExceptions.exceptionDate, date),
        ),
      ),
    db
      .select({
        time: reservations.localTime,
        seats: sql<number>`coalesce(sum(${reservations.partySize}), 0)::int`,
      })
      .from(reservations)
      .where(
        and(
          eq(reservations.organizationId, config.organizationId),
          eq(reservations.establishmentId, config.establishmentId),
          eq(reservations.localDate, date),
          inArray(reservations.status, ['PENDING', 'CONFIRMED', 'SEATED']),
        ),
      )
      .groupBy(reservations.localTime),
  ]);
  return { periods, exceptions, consumed };
}

export async function getPublicAvailability(
  db: CloudDatabaseClient,
  config: PublicBookingConfiguration,
  input: { date: string; partySize: number; now?: Date },
): Promise<AvailabilitySlot[]> {
  const rows = await availabilityRows(db, config, input.date);
  return generateAvailability({
    date: input.date,
    timezone: config.timezone,
    partySize: input.partySize,
    settings: config,
    periods: rows.periods.map((period) => ({
      ...period,
      startTime: timeValue(period.startTime),
      endTime: timeValue(period.endTime),
    })),
    exceptions: rows.exceptions.map((exception) => ({
      ...exception,
      startTime: exception.startTime ? timeValue(exception.startTime) : null,
      endTime: exception.endTime ? timeValue(exception.endTime) : null,
    })),
    reservedSeatsByTime: new Map(
      rows.consumed.map((item) => [timeValue(item.time), item.seats]),
    ),
    now: input.now ?? new Date(),
  });
}

export async function createPublicReservation(
  db: CloudDatabaseClient,
  config: PublicBookingConfiguration,
  input: CreatePublicReservationInput,
  now = new Date(),
) {
  const publicToken = randomBytes(32).toString('base64url');
  const tokenHash = hash(publicToken);
  const idempotencyHash = hash(input.idempotencyKey);
  const requestFingerprint = hash(JSON.stringify(input));
  const startAt = localDateTimeToInstant(
    input.date,
    input.time,
    config.timezone,
  );
  const endAt = new Date(
    startAt.getTime() + config.averageDurationMinutes * 60_000,
  );

  const created = await db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${`${config.establishmentId}:${input.date}:${input.time}`}, 0))`,
    );

    const [duplicate] = await tx
      .select({ fingerprint: reservations.requestFingerprint })
      .from(reservations)
      .where(
        and(
          eq(reservations.organizationId, config.organizationId),
          eq(reservations.establishmentId, config.establishmentId),
          eq(reservations.idempotencyHash, idempotencyHash),
        ),
      )
      .limit(1);
    if (duplicate) {
      throw new BookingRepositoryError(
        duplicate.fingerprint === requestFingerprint
          ? 'This reservation request has already been processed.'
          : 'The idempotency key was reused for a different request.',
        'IDEMPOTENCY_CONFLICT',
      );
    }

    const periods = await tx
      .select()
      .from(bookingServicePeriods)
      .where(
        and(
          eq(bookingServicePeriods.organizationId, config.organizationId),
          eq(bookingServicePeriods.establishmentId, config.establishmentId),
          eq(bookingServicePeriods.enabled, true),
        ),
      );
    const exceptionRows = await tx
      .select()
      .from(bookingExceptions)
      .where(
        and(
          eq(bookingExceptions.organizationId, config.organizationId),
          eq(bookingExceptions.establishmentId, config.establishmentId),
          eq(bookingExceptions.exceptionDate, input.date),
        ),
      );
    const consumed = await tx
      .select({
        time: reservations.localTime,
        seats: sql<number>`coalesce(sum(${reservations.partySize}), 0)::int`,
      })
      .from(reservations)
      .where(
        and(
          eq(reservations.organizationId, config.organizationId),
          eq(reservations.establishmentId, config.establishmentId),
          eq(reservations.localDate, input.date),
          inArray(reservations.status, ['PENDING', 'CONFIRMED', 'SEATED']),
        ),
      )
      .groupBy(reservations.localTime);
    const slots = generateAvailability({
      date: input.date,
      timezone: config.timezone,
      partySize: input.partySize,
      settings: config,
      periods: periods.map((period) => ({
        ...period,
        startTime: timeValue(period.startTime),
        endTime: timeValue(period.endTime),
      })),
      exceptions: exceptionRows.map((item) => ({
        ...item,
        startTime: item.startTime ? timeValue(item.startTime) : null,
        endTime: item.endTime ? timeValue(item.endTime) : null,
      })),
      reservedSeatsByTime: new Map(
        consumed.map((item) => [timeValue(item.time), item.seats]),
      ),
      now,
    });
    try {
      assertSlotAvailable(slots, input.time);
    } catch {
      throw new BookingRepositoryError(
        'The selected slot is no longer available.',
        'SLOT_UNAVAILABLE',
      );
    }

    const id = uuidv7();
    const status =
      config.confirmationMode === 'AUTOMATIC' ? 'CONFIRMED' : 'PENDING';
    const reference = `YT-${now.getUTCFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;
    const [reservation] = await tx
      .insert(reservations)
      .values({
        id,
        organizationId: config.organizationId,
        establishmentId: config.establishmentId,
        reference,
        status,
        source: input.source,
        localDate: input.date,
        localTime: input.time,
        timezone: config.timezone,
        startAt,
        endAt,
        partySize: input.partySize,
        guestFirstName: input.guest.firstName.trim(),
        guestLastName: input.guest.lastName.trim(),
        guestEmail: normalizeEmail(input.guest.email),
        guestPhone: normalizePhone(input.guest.phone),
        specialRequirements: input.specialRequirements || null,
        marketingConsent: input.marketingConsent,
        policyAcceptedAt: now,
        publicTokenHash: tokenHash,
        idempotencyHash,
        requestFingerprint,
        establishmentNameSnapshot: config.establishmentName,
      })
      .returning();
    await tx.insert(reservationStatusHistory).values({
      id: uuidv7(),
      organizationId: config.organizationId,
      establishmentId: config.establishmentId,
      reservationId: id,
      fromStatus: null,
      toStatus: status,
      actorType: 'GUEST',
    });
    await tx.insert(bookingAuditEvents).values({
      id: uuidv7(),
      organizationId: config.organizationId,
      establishmentId: config.establishmentId,
      reservationId: id,
      actorType: 'GUEST',
      eventType: 'RESERVATION_CREATED',
      metadata: { source: input.source },
    });
    await tx.insert(bookingNotificationDeliveries).values({
      id: uuidv7(),
      organizationId: config.organizationId,
      establishmentId: config.establishmentId,
      reservationId: id,
      eventType: 'RESERVATION_CREATED',
      recipient: normalizeEmail(input.guest.email),
    });
    return reservation;
  });

  return {
    reservation: toPublicReservation(created, config, now),
    publicToken,
  };
}

function toPublicReservation(
  reservation: typeof reservations.$inferSelect,
  config: PublicBookingConfiguration,
  now: Date,
) {
  return {
    reference: reservation.reference,
    establishmentName: reservation.establishmentNameSnapshot,
    establishmentSlug: config.slug,
    date: reservation.localDate,
    time: timeValue(reservation.localTime),
    timezone: reservation.timezone,
    partySize: reservation.partySize,
    status: reservation.status,
    guestFirstName: reservation.guestFirstName,
    cancellable:
      !['CANCELLED', 'DECLINED', 'COMPLETED', 'NO_SHOW'].includes(
        reservation.status,
      ) &&
      isCancellationAllowed({
        startAt: reservation.startAt,
        now,
        cancellationDeadlineMinutes: config.cancellationDeadlineMinutes,
      }),
  };
}

export async function findPublicReservation(
  db: CloudDatabaseClient,
  config: PublicBookingConfiguration,
  publicToken: string,
  now = new Date(),
) {
  const [row] = await db
    .select()
    .from(reservations)
    .where(
      and(
        eq(reservations.organizationId, config.organizationId),
        eq(reservations.establishmentId, config.establishmentId),
        eq(reservations.publicTokenHash, hash(publicToken)),
      ),
    )
    .limit(1);
  return row ? toPublicReservation(row, config, now) : null;
}

export async function cancelPublicReservation(
  db: CloudDatabaseClient,
  config: PublicBookingConfiguration,
  publicToken: string,
  now = new Date(),
) {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${hash(publicToken)}, 0))`,
    );
    const [row] = await tx
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.organizationId, config.organizationId),
          eq(reservations.establishmentId, config.establishmentId),
          eq(reservations.publicTokenHash, hash(publicToken)),
        ),
      )
      .limit(1);
    if (!row)
      throw new BookingRepositoryError(
        'Reservation not found.',
        'BOOKING_NOT_FOUND',
      );
    if (row.status === 'CANCELLED')
      return toPublicReservation(row, config, now);
    if (
      !isCancellationAllowed({
        startAt: row.startAt,
        now,
        cancellationDeadlineMinutes: config.cancellationDeadlineMinutes,
      })
    ) {
      throw new BookingRepositoryError(
        'The online cancellation deadline has passed.',
        'CANCELLATION_NOT_ALLOWED',
      );
    }
    assertStatusTransition(row.status, 'CANCELLED');
    const [updated] = await tx
      .update(reservations)
      .set({ status: 'CANCELLED', cancelledAt: now })
      .where(eq(reservations.id, row.id))
      .returning();
    await tx.insert(reservationStatusHistory).values({
      id: uuidv7(),
      organizationId: config.organizationId,
      establishmentId: config.establishmentId,
      reservationId: row.id,
      fromStatus: row.status,
      toStatus: 'CANCELLED',
      actorType: 'GUEST',
    });
    await tx.insert(bookingNotificationDeliveries).values({
      id: uuidv7(),
      organizationId: config.organizationId,
      establishmentId: config.establishmentId,
      reservationId: row.id,
      eventType: 'RESERVATION_CANCELLED',
      recipient: row.guestEmail,
    });
    return toPublicReservation(updated, config, now);
  });
}

export async function enforcePublicBookingRateLimit(
  db: CloudDatabaseClient,
  input: {
    establishmentId: string;
    action: 'AVAILABILITY' | 'CREATE' | 'READ' | 'CANCEL';
    subject: string;
    secret: string;
    limit: number;
    windowMinutes: number;
  },
): Promise<void> {
  const subjectHash = hash(`${input.secret}:${input.subject}`);
  const since = new Date(Date.now() - input.windowMinutes * 60_000);
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingPublicAttempts)
    .where(
      and(
        eq(bookingPublicAttempts.establishmentId, input.establishmentId),
        eq(bookingPublicAttempts.action, input.action),
        eq(bookingPublicAttempts.subjectHash, subjectHash),
        gte(bookingPublicAttempts.createdAt, since),
      ),
    );
  if ((row?.count ?? 0) >= input.limit) {
    throw new BookingRepositoryError('Too many requests.', 'RATE_LIMITED');
  }
  await db.insert(bookingPublicAttempts).values({
    id: uuidv7(),
    establishmentId: input.establishmentId,
    action: input.action,
    subjectHash,
  });
}

const scopeWhere = (context: BookingTenantContext) =>
  and(
    eq(reservations.organizationId, context.organizationId),
    eq(reservations.establishmentId, context.establishmentId),
  );

export async function listReservations(
  db: CloudDatabaseClient,
  context: BookingTenantContext,
  fromDate: string,
  toDate: string,
) {
  return db
    .select()
    .from(reservations)
    .where(
      and(
        scopeWhere(context),
        gte(reservations.localDate, fromDate),
        lte(reservations.localDate, toDate),
      ),
    )
    .orderBy(asc(reservations.startAt));
}

export async function findBookingEstablishmentSlug(
  db: CloudDatabaseClient,
  context: BookingTenantContext,
): Promise<string | null> {
  const [row] = await db
    .select({ slug: establishments.slug })
    .from(establishments)
    .where(
      and(
        eq(establishments.organizationId, context.organizationId),
        eq(establishments.id, context.establishmentId),
      ),
    )
    .limit(1);
  return row?.slug ?? null;
}

export async function findReservationForTenant(
  db: CloudDatabaseClient,
  context: BookingTenantContext,
  reservationId: string,
) {
  const [row] = await db
    .select()
    .from(reservations)
    .where(and(scopeWhere(context), eq(reservations.id, reservationId)))
    .limit(1);
  return row ?? null;
}

export async function getReservationDetails(
  db: CloudDatabaseClient,
  context: BookingTenantContext,
  reservationId: string,
) {
  const reservation = await findReservationForTenant(
    db,
    context,
    reservationId,
  );
  if (!reservation) return null;
  const [history, notes] = await Promise.all([
    db
      .select()
      .from(reservationStatusHistory)
      .where(
        and(
          eq(reservationStatusHistory.organizationId, context.organizationId),
          eq(reservationStatusHistory.establishmentId, context.establishmentId),
          eq(reservationStatusHistory.reservationId, reservationId),
        ),
      )
      .orderBy(desc(reservationStatusHistory.createdAt)),
    db
      .select()
      .from(reservationInternalNotes)
      .where(
        and(
          eq(reservationInternalNotes.organizationId, context.organizationId),
          eq(reservationInternalNotes.establishmentId, context.establishmentId),
          eq(reservationInternalNotes.reservationId, reservationId),
        ),
      )
      .orderBy(desc(reservationInternalNotes.createdAt)),
  ]);
  return { reservation, history, notes };
}

export async function updateReservationStatus(
  db: CloudDatabaseClient,
  context: BookingTenantContext,
  reservationId: string,
  nextStatus: ReservationStatus,
  reason?: string,
) {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${reservationId}, 0))`,
    );
    const [row] = await tx
      .select()
      .from(reservations)
      .where(and(scopeWhere(context), eq(reservations.id, reservationId)))
      .limit(1);
    if (!row)
      throw new BookingRepositoryError(
        'Reservation not found.',
        'BOOKING_NOT_FOUND',
      );
    assertStatusTransition(row.status, nextStatus);
    const [updated] = await tx
      .update(reservations)
      .set({
        status: nextStatus,
        cancelledAt: nextStatus === 'CANCELLED' ? new Date() : row.cancelledAt,
      })
      .where(and(scopeWhere(context), eq(reservations.id, reservationId)))
      .returning();
    await tx.insert(reservationStatusHistory).values({
      id: uuidv7(),
      organizationId: context.organizationId,
      establishmentId: context.establishmentId,
      reservationId,
      fromStatus: row.status,
      toStatus: nextStatus,
      actorType: 'USER',
      actorUserId: context.actor.type === 'user' ? context.actor.userId : null,
      reason,
    });
    await tx.insert(bookingAuditEvents).values({
      id: uuidv7(),
      organizationId: context.organizationId,
      establishmentId: context.establishmentId,
      reservationId,
      actorType: 'USER',
      actorUserId: context.actor.type === 'user' ? context.actor.userId : null,
      eventType: `STATUS_${nextStatus}`,
      metadata: { from: row.status, to: nextStatus },
    });
    if (['CONFIRMED', 'DECLINED', 'CANCELLED'].includes(nextStatus)) {
      await tx.insert(bookingNotificationDeliveries).values({
        id: uuidv7(),
        organizationId: context.organizationId,
        establishmentId: context.establishmentId,
        reservationId,
        eventType: `RESERVATION_${nextStatus}`,
        recipient: row.guestEmail,
      });
    }
    return updated;
  });
}

export async function updateReservationDetails(
  db: CloudDatabaseClient,
  context: BookingTenantContext,
  input: {
    reservationId: string;
    date: string;
    time: string;
    partySize: number;
    guestFirstName: string;
    guestLastName: string;
    guestEmail: string;
    guestPhone: string;
    specialRequirements: string | null;
  },
  now = new Date(),
) {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${`${context.establishmentId}:${input.date}:${input.time}`}, 0))`,
    );
    const [current] = await tx
      .select()
      .from(reservations)
      .where(and(scopeWhere(context), eq(reservations.id, input.reservationId)))
      .limit(1);
    if (!current) {
      throw new BookingRepositoryError(
        'Reservation not found.',
        'BOOKING_NOT_FOUND',
      );
    }

    const [settings] = await tx
      .select({
        minimumPartySize: bookingSettings.minimumPartySize,
        maximumPartySize: bookingSettings.maximumPartySize,
        slotIntervalMinutes: bookingSettings.slotIntervalMinutes,
        averageDurationMinutes: bookingSettings.averageDurationMinutes,
        minimumNoticeMinutes: bookingSettings.minimumNoticeMinutes,
        bookingWindowDays: bookingSettings.bookingWindowDays,
        timezone: establishments.timezone,
      })
      .from(bookingSettings)
      .innerJoin(
        establishments,
        and(
          eq(establishments.id, bookingSettings.establishmentId),
          eq(establishments.organizationId, bookingSettings.organizationId),
        ),
      )
      .where(
        and(
          eq(bookingSettings.organizationId, context.organizationId),
          eq(bookingSettings.establishmentId, context.establishmentId),
        ),
      )
      .limit(1);
    if (!settings) {
      throw new BookingRepositoryError(
        'Booking is not configured.',
        'BOOKING_DISABLED',
      );
    }

    const periods = await tx
      .select()
      .from(bookingServicePeriods)
      .where(
        and(
          eq(bookingServicePeriods.organizationId, context.organizationId),
          eq(bookingServicePeriods.establishmentId, context.establishmentId),
          eq(bookingServicePeriods.enabled, true),
        ),
      );
    const exceptionRows = await tx
      .select()
      .from(bookingExceptions)
      .where(
        and(
          eq(bookingExceptions.organizationId, context.organizationId),
          eq(bookingExceptions.establishmentId, context.establishmentId),
          eq(bookingExceptions.exceptionDate, input.date),
        ),
      );
    const consumed = await tx
      .select({
        time: reservations.localTime,
        seats: sql<number>`coalesce(sum(${reservations.partySize}), 0)::int`,
      })
      .from(reservations)
      .where(
        and(
          scopeWhere(context),
          eq(reservations.localDate, input.date),
          inArray(reservations.status, ['PENDING', 'CONFIRMED', 'SEATED']),
          ne(reservations.id, current.id),
        ),
      )
      .groupBy(reservations.localTime);
    const slots = generateAvailability({
      date: input.date,
      timezone: settings.timezone,
      partySize: input.partySize,
      settings,
      periods: periods.map((period) => ({
        ...period,
        startTime: timeValue(period.startTime),
        endTime: timeValue(period.endTime),
      })),
      exceptions: exceptionRows.map((item) => ({
        ...item,
        startTime: item.startTime ? timeValue(item.startTime) : null,
        endTime: item.endTime ? timeValue(item.endTime) : null,
      })),
      reservedSeatsByTime: new Map(
        consumed.map((item) => [timeValue(item.time), item.seats]),
      ),
      now,
    });
    try {
      assertSlotAvailable(slots, input.time);
    } catch {
      throw new BookingRepositoryError(
        'The selected slot is no longer available.',
        'SLOT_UNAVAILABLE',
      );
    }

    const startAt = localDateTimeToInstant(
      input.date,
      input.time,
      settings.timezone,
    );
    const [updated] = await tx
      .update(reservations)
      .set({
        localDate: input.date,
        localTime: input.time,
        timezone: settings.timezone,
        startAt,
        endAt: new Date(
          startAt.getTime() + settings.averageDurationMinutes * 60_000,
        ),
        partySize: input.partySize,
        guestFirstName: input.guestFirstName.trim(),
        guestLastName: input.guestLastName.trim(),
        guestEmail: normalizeEmail(input.guestEmail),
        guestPhone: normalizePhone(input.guestPhone),
        specialRequirements: input.specialRequirements,
      })
      .where(and(scopeWhere(context), eq(reservations.id, input.reservationId)))
      .returning();
    await tx.insert(bookingAuditEvents).values({
      id: uuidv7(),
      organizationId: context.organizationId,
      establishmentId: context.establishmentId,
      reservationId: input.reservationId,
      actorType: 'USER',
      actorUserId: context.actor.type === 'user' ? context.actor.userId : null,
      eventType: 'RESERVATION_UPDATED',
      metadata: { date: input.date, time: input.time },
    });
    await tx.insert(bookingNotificationDeliveries).values({
      id: uuidv7(),
      organizationId: context.organizationId,
      establishmentId: context.establishmentId,
      reservationId: input.reservationId,
      eventType: 'RESERVATION_UPDATED',
      recipient: normalizeEmail(input.guestEmail),
    });
    return updated;
  });
}

export async function addReservationInternalNote(
  db: CloudDatabaseClient,
  context: BookingTenantContext,
  reservationId: string,
  body: string,
) {
  const existing = await findReservationForTenant(db, context, reservationId);
  if (!existing)
    throw new BookingRepositoryError(
      'Reservation not found.',
      'BOOKING_NOT_FOUND',
    );
  if (context.actor.type !== 'user')
    throw new BookingRepositoryError(
      'Reservation not found.',
      'BOOKING_NOT_FOUND',
    );
  const [note] = await db
    .insert(reservationInternalNotes)
    .values({
      id: uuidv7(),
      organizationId: context.organizationId,
      establishmentId: context.establishmentId,
      reservationId,
      authorUserId: context.actor.userId,
      body: body.trim(),
    })
    .returning();
  return note;
}

export async function getBookingAdministration(
  db: CloudDatabaseClient,
  context: BookingTenantContext,
) {
  const establishmentRows = await db
    .select({
      name: establishments.name,
      slug: establishments.slug,
      locale: establishments.locale,
      timezone: establishments.timezone,
    })
    .from(establishments)
    .where(
      and(
        eq(establishments.organizationId, context.organizationId),
        eq(establishments.id, context.establishmentId),
      ),
    )
    .limit(1);
  const settingsRows = await db
    .select()
    .from(bookingSettings)
    .where(
      and(
        eq(bookingSettings.organizationId, context.organizationId),
        eq(bookingSettings.establishmentId, context.establishmentId),
      ),
    )
    .limit(1);
  const periods = await db
    .select()
    .from(bookingServicePeriods)
    .where(
      and(
        eq(bookingServicePeriods.organizationId, context.organizationId),
        eq(bookingServicePeriods.establishmentId, context.establishmentId),
      ),
    )
    .orderBy(
      asc(bookingServicePeriods.dayOfWeek),
      asc(bookingServicePeriods.startTime),
    );
  const exceptions = await db
    .select()
    .from(bookingExceptions)
    .where(
      and(
        eq(bookingExceptions.organizationId, context.organizationId),
        eq(bookingExceptions.establishmentId, context.establishmentId),
      ),
    )
    .orderBy(desc(bookingExceptions.exceptionDate));
  return {
    establishment: establishmentRows[0] ?? null,
    settings: settingsRows[0] ?? null,
    periods,
    exceptions,
  };
}

export async function saveBookingSettings(
  db: CloudDatabaseClient,
  context: BookingTenantContext,
  input: BookingSettingsInput,
) {
  return db
    .insert(bookingSettings)
    .values({
      id: uuidv7(),
      organizationId: context.organizationId,
      establishmentId: context.establishmentId,
      ...input,
    })
    .onConflictDoUpdate({
      target: [bookingSettings.organizationId, bookingSettings.establishmentId],
      set: input,
    })
    .returning();
}

export async function createBookingServicePeriod(
  db: CloudDatabaseClient,
  context: BookingTenantContext,
  input: BookingServicePeriodInput,
) {
  const [row] = await db
    .insert(bookingServicePeriods)
    .values({
      id: uuidv7(),
      organizationId: context.organizationId,
      establishmentId: context.establishmentId,
      ...input,
    })
    .returning();
  return row;
}

export async function deleteBookingServicePeriod(
  db: CloudDatabaseClient,
  context: BookingTenantContext,
  id: string,
) {
  await db
    .delete(bookingServicePeriods)
    .where(
      and(
        eq(bookingServicePeriods.organizationId, context.organizationId),
        eq(bookingServicePeriods.establishmentId, context.establishmentId),
        eq(bookingServicePeriods.id, id),
      ),
    );
}

export async function createBookingException(
  db: CloudDatabaseClient,
  context: BookingTenantContext,
  input: BookingExceptionInput,
) {
  const [row] = await db
    .insert(bookingExceptions)
    .values({
      id: uuidv7(),
      organizationId: context.organizationId,
      establishmentId: context.establishmentId,
      exceptionDate: input.date,
      kind: input.kind,
      servicePeriodId: input.servicePeriodId,
      startTime: input.startTime,
      endTime: input.endTime,
      capacityOverride: input.capacityOverride,
      reason: input.reason,
    })
    .returning();
  return row;
}

export async function deleteBookingException(
  db: CloudDatabaseClient,
  context: BookingTenantContext,
  id: string,
) {
  await db
    .delete(bookingExceptions)
    .where(
      and(
        eq(bookingExceptions.organizationId, context.organizationId),
        eq(bookingExceptions.establishmentId, context.establishmentId),
        eq(bookingExceptions.id, id),
      ),
    );
}
