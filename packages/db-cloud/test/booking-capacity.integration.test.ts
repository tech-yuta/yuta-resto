import { config } from 'dotenv';
import { and, eq } from 'drizzle-orm';
import type { CreatePublicReservationInput } from '@yuta/contracts/reservations';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import {
  BookingRepositoryError,
  createPublicReservation,
  type PublicBookingConfiguration,
} from '../src/booking-repository';
import {
  createCloudDatabaseClient,
  type CloudDatabaseClient,
} from '../src/client';
import {
  bookingAuditEvents,
  bookingNotificationDeliveries,
  bookingServicePeriods,
  establishments,
  organizations,
  reservations,
  reservationStatusHistory,
} from '../src/schema';

config({ path: '.env.test' });
config({ path: '.env.local' });

const integrationTest =
  process.env.CLOUD_DATABASE_URL &&
  process.env.YUTA_ALLOW_DATABASE_INTEGRATION_TESTS === 'true'
    ? describe
    : describe.skip;

integrationTest('booking capacity concurrency', () => {
  let db: CloudDatabaseClient;
  const organizationId = uuidv7();
  const establishmentId = uuidv7();
  const servicePeriodId = uuidv7();
  const bookingDate = '2030-01-07';
  const bookingTime = '12:00';
  const now = new Date('2029-01-01T10:00:00.000Z');

  const bookingConfig: PublicBookingConfiguration = {
    organizationId,
    establishmentId,
    establishmentName: 'Capacity concurrency establishment',
    slug: `booking-capacity-${establishmentId}`,
    locale: 'fr-FR',
    timezone: 'Europe/Paris',
    enabled: true,
    confirmationMode: 'AUTOMATIC',
    minimumPartySize: 1,
    maximumPartySize: 12,
    slotIntervalMinutes: 30,
    averageDurationMinutes: 90,
    minimumNoticeMinutes: 0,
    bookingWindowDays: 3650,
    cancellationDeadlineMinutes: 0,
    publicPhone: null,
    publicEmail: null,
    address: null,
    welcomeMessage: null,
    bookingPolicy: null,
    logoUrl: null,
    coverImageUrl: null,
  };

  const bookingInput = (guestNumber: number): CreatePublicReservationInput => ({
    date: bookingDate,
    time: bookingTime,
    partySize: 3,
    guest: {
      firstName: `Guest ${guestNumber}`,
      lastName: 'Concurrency',
      email: `booking-capacity-${guestNumber}-${establishmentId}@example.test`,
      phone: `+3354900000${guestNumber}`,
    },
    source: 'DIRECT',
    marketingConsent: false,
    policyAccepted: true,
    idempotencyKey: `booking-capacity-${guestNumber}-${uuidv7()}`,
  });

  beforeAll(async () => {
    db = createCloudDatabaseClient(process.env);
    await db.insert(organizations).values({
      id: organizationId,
      name: 'Booking capacity concurrency organization',
      slug: `booking-capacity-${organizationId}`,
    });
    await db.insert(establishments).values({
      id: establishmentId,
      organizationId,
      name: bookingConfig.establishmentName,
      slug: bookingConfig.slug,
    });
    await db.insert(bookingServicePeriods).values({
      id: servicePeriodId,
      organizationId,
      establishmentId,
      dayOfWeek: 1,
      name: 'Monday lunch',
      startTime: '12:00',
      endTime: '14:00',
      capacity: 4,
    });
  });

  afterAll(async () => {
    if (!db) return;

    for (const table of [
      bookingNotificationDeliveries,
      bookingAuditEvents,
      reservationStatusHistory,
    ]) {
      await db.delete(table).where(eq(table.organizationId, organizationId));
    }
    await db
      .delete(reservations)
      .where(eq(reservations.organizationId, organizationId));
    await db
      .delete(bookingServicePeriods)
      .where(eq(bookingServicePeriods.organizationId, organizationId));
    await db
      .delete(establishments)
      .where(eq(establishments.id, establishmentId));
    await db.delete(organizations).where(eq(organizations.id, organizationId));
    await db.$client.end({ timeout: 5 });
  });

  it('serializes competing requests and accepts only the reservation that fits', async () => {
    const outcomes = await Promise.allSettled([
      createPublicReservation(db, bookingConfig, bookingInput(1), now),
      createPublicReservation(db, bookingConfig, bookingInput(2), now),
    ]);

    const fulfilled = outcomes.filter(
      (outcome) => outcome.status === 'fulfilled',
    );
    const rejected = outcomes.filter(
      (outcome) => outcome.status === 'rejected',
    );

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.reason).toBeInstanceOf(BookingRepositoryError);
    expect(rejected[0]?.reason).toMatchObject({ code: 'SLOT_UNAVAILABLE' });

    const persistedReservations = await db
      .select({
        id: reservations.id,
        partySize: reservations.partySize,
        status: reservations.status,
      })
      .from(reservations)
      .where(
        and(
          eq(reservations.organizationId, organizationId),
          eq(reservations.establishmentId, establishmentId),
          eq(reservations.localDate, bookingDate),
        ),
      );

    expect(persistedReservations).toHaveLength(1);
    expect(persistedReservations[0]).toMatchObject({
      partySize: 3,
      status: 'CONFIRMED',
    });

    const reservationId = persistedReservations[0]?.id;
    expect(reservationId).toBeDefined();
    if (!reservationId) return;

    await expect(
      db
        .select({ id: reservationStatusHistory.id })
        .from(reservationStatusHistory)
        .where(eq(reservationStatusHistory.reservationId, reservationId)),
    ).resolves.toHaveLength(1);
    await expect(
      db
        .select({ id: bookingAuditEvents.id })
        .from(bookingAuditEvents)
        .where(eq(bookingAuditEvents.reservationId, reservationId)),
    ).resolves.toHaveLength(1);
    await expect(
      db
        .select({ id: bookingNotificationDeliveries.id })
        .from(bookingNotificationDeliveries)
        .where(eq(bookingNotificationDeliveries.reservationId, reservationId)),
    ).resolves.toHaveLength(1);
  });
});
