import { createHash } from 'node:crypto';
import { config } from 'dotenv';
import { and, eq } from 'drizzle-orm';
import type { TenantContext } from '@yuta/tenant';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import {
  addReservationInternalNote,
  cancelPublicReservation,
  createBookingException,
  deleteBookingException,
  deleteBookingServicePeriod,
  findPublicReservation,
  findReservationForTenant,
  getReservationDetails,
  listReservations,
  updateReservationDetails,
  updateReservationStatus,
  type PublicBookingConfiguration,
} from '../src/booking-repository';
import {
  createCloudDatabaseClient,
  type CloudDatabaseClient,
} from '../src/client';
import {
  bookingAuditEvents,
  bookingExceptions,
  bookingNotificationDeliveries,
  bookingServicePeriods,
  establishments,
  organizations,
  reservationInternalNotes,
  reservations,
  reservationStatusHistory,
  users,
} from '../src/schema';

config({ path: '.env.test' });
config({ path: '.env.local' });

const integrationTest =
  process.env.CLOUD_DATABASE_URL &&
  process.env.YUTA_ALLOW_DATABASE_INTEGRATION_TESTS === 'true'
    ? describe
    : describe.skip;

const tokenHash = (value: string) =>
  createHash('sha256').update(value).digest('hex');

integrationTest('booking repository tenant isolation', () => {
  let db: CloudDatabaseClient;
  const organizationAId = uuidv7();
  const organizationBId = uuidv7();
  const establishmentAId = uuidv7();
  const establishmentA2Id = uuidv7();
  const establishmentBId = uuidv7();
  const actorUserId = uuidv7();
  const reservationAId = uuidv7();
  const servicePeriodAId = uuidv7();
  const servicePeriodA2Id = uuidv7();
  const servicePeriodBId = uuidv7();
  const exceptionAId = uuidv7();
  const publicToken = `booking-isolation-${uuidv7()}`;

  const contextA: TenantContext & { establishmentId: string } = {
    organizationId: organizationAId,
    establishmentId: establishmentAId,
    actor: {
      type: 'user',
      userId: actorUserId,
      role: 'OWNER',
      membershipId: uuidv7(),
    },
    locale: 'fr-FR',
    timezone: 'Europe/Paris',
    entitlements: new Set(['booking.enabled']),
  };
  const contextWrongEstablishment = {
    ...contextA,
    establishmentId: establishmentA2Id,
  };
  const contextWrongOrganization = {
    ...contextA,
    organizationId: organizationBId,
    establishmentId: establishmentBId,
  };

  const publicConfig = (
    organizationId: string,
    establishmentId: string,
    slug: string,
  ): PublicBookingConfiguration => ({
    organizationId,
    establishmentId,
    establishmentName: slug,
    slug,
    locale: 'fr-FR',
    timezone: 'Europe/Paris',
    enabled: true,
    confirmationMode: 'MANUAL',
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
  });

  beforeAll(async () => {
    db = createCloudDatabaseClient(process.env);
    await db.insert(organizations).values([
      {
        id: organizationAId,
        name: 'Booking isolation organization A',
        slug: `booking-isolation-a-${organizationAId}`,
      },
      {
        id: organizationBId,
        name: 'Booking isolation organization B',
        slug: `booking-isolation-b-${organizationBId}`,
      },
    ]);
    await db.insert(establishments).values([
      {
        id: establishmentAId,
        organizationId: organizationAId,
        name: 'Booking isolation A1',
        slug: `booking-isolation-a1-${establishmentAId}`,
      },
      {
        id: establishmentA2Id,
        organizationId: organizationAId,
        name: 'Booking isolation A2',
        slug: `booking-isolation-a2-${establishmentA2Id}`,
      },
      {
        id: establishmentBId,
        organizationId: organizationBId,
        name: 'Booking isolation B1',
        slug: `booking-isolation-b1-${establishmentBId}`,
      },
    ]);
    await db.insert(users).values({
      id: actorUserId,
      authProviderId: `test:${actorUserId}`,
      displayName: 'Booking Isolation Owner',
      email: `booking-isolation-${actorUserId}@example.test`,
    });
    await db.insert(bookingServicePeriods).values([
      {
        id: servicePeriodAId,
        organizationId: organizationAId,
        establishmentId: establishmentAId,
        dayOfWeek: 1,
        name: 'A1 lunch',
        startTime: '12:00',
        endTime: '14:00',
        capacity: 20,
      },
      {
        id: servicePeriodA2Id,
        organizationId: organizationAId,
        establishmentId: establishmentA2Id,
        dayOfWeek: 1,
        name: 'A2 lunch',
        startTime: '12:00',
        endTime: '14:00',
        capacity: 20,
      },
      {
        id: servicePeriodBId,
        organizationId: organizationBId,
        establishmentId: establishmentBId,
        dayOfWeek: 1,
        name: 'B1 lunch',
        startTime: '12:00',
        endTime: '14:00',
        capacity: 20,
      },
    ]);
    await db.insert(bookingExceptions).values({
      id: exceptionAId,
      organizationId: organizationAId,
      establishmentId: establishmentAId,
      exceptionDate: '2030-01-01',
      kind: 'CLOSED_SERVICE',
      servicePeriodId: servicePeriodAId,
    });
    await db.insert(reservations).values({
      id: reservationAId,
      organizationId: organizationAId,
      establishmentId: establishmentAId,
      reference: `YT-TEST-${reservationAId.slice(0, 8)}`,
      status: 'CONFIRMED',
      source: 'DIRECT',
      localDate: '2030-01-01',
      localTime: '12:00',
      timezone: 'Europe/Paris',
      startAt: new Date('2030-01-01T11:00:00.000Z'),
      endAt: new Date('2030-01-01T12:30:00.000Z'),
      partySize: 2,
      guestFirstName: 'Tenant',
      guestLastName: 'Isolation',
      guestEmail: 'tenant-isolation@example.test',
      guestPhone: '+33549000000',
      marketingConsent: false,
      publicTokenHash: tokenHash(publicToken),
      idempotencyHash: tokenHash(`idempotency:${publicToken}`),
      requestFingerprint: tokenHash(`fingerprint:${publicToken}`),
      establishmentNameSnapshot: 'Booking isolation A1',
    });
  });

  afterAll(async () => {
    if (!db) return;
    for (const table of [
      bookingNotificationDeliveries,
      bookingAuditEvents,
      reservationInternalNotes,
      reservationStatusHistory,
    ]) {
      await db.delete(table).where(eq(table.organizationId, organizationAId));
    }
    await db
      .delete(reservations)
      .where(eq(reservations.organizationId, organizationAId));
    await db
      .delete(bookingExceptions)
      .where(eq(bookingExceptions.organizationId, organizationAId));
    await db
      .delete(bookingServicePeriods)
      .where(
        and(
          eq(bookingServicePeriods.organizationId, organizationAId),
          eq(bookingServicePeriods.establishmentId, establishmentAId),
        ),
      );
    await db
      .delete(bookingServicePeriods)
      .where(
        and(
          eq(bookingServicePeriods.organizationId, organizationAId),
          eq(bookingServicePeriods.establishmentId, establishmentA2Id),
        ),
      );
    await db
      .delete(bookingServicePeriods)
      .where(eq(bookingServicePeriods.organizationId, organizationBId));
    await db.delete(users).where(eq(users.id, actorUserId));
    await db
      .delete(establishments)
      .where(eq(establishments.organizationId, organizationAId));
    await db
      .delete(establishments)
      .where(eq(establishments.organizationId, organizationBId));
    await db.delete(organizations).where(eq(organizations.id, organizationAId));
    await db.delete(organizations).where(eq(organizations.id, organizationBId));
    await db.$client.end({ timeout: 5 });
  });

  it('denies reservation reads and mutations from the wrong tenant scope', async () => {
    for (const context of [
      contextWrongEstablishment,
      contextWrongOrganization,
    ]) {
      await expect(
        listReservations(db, context, '2030-01-01', '2030-01-01'),
      ).resolves.toEqual([]);
      await expect(
        findReservationForTenant(db, context, reservationAId),
      ).resolves.toBeNull();
      await expect(
        getReservationDetails(db, context, reservationAId),
      ).resolves.toBeNull();
      await expect(
        updateReservationStatus(db, context, reservationAId, 'CANCELLED'),
      ).rejects.toMatchObject({ code: 'BOOKING_NOT_FOUND' });
      await expect(
        updateReservationDetails(db, context, {
          reservationId: reservationAId,
          date: '2030-01-01',
          time: '12:30',
          partySize: 3,
          guestFirstName: 'Cross',
          guestLastName: 'Tenant',
          guestEmail: 'cross-tenant@example.test',
          guestPhone: '+33549000001',
          specialRequirements: null,
        }),
      ).rejects.toMatchObject({ code: 'BOOKING_NOT_FOUND' });
      await expect(
        addReservationInternalNote(
          db,
          context,
          reservationAId,
          'Cross-tenant note',
        ),
      ).rejects.toMatchObject({ code: 'BOOKING_NOT_FOUND' });
    }

    await expect(
      findReservationForTenant(db, contextA, reservationAId),
    ).resolves.toMatchObject({ id: reservationAId, status: 'CONFIRMED' });
  });

  it('binds public management tokens to the resolved organization and establishment', async () => {
    await expect(
      findPublicReservation(
        db,
        publicConfig(organizationAId, establishmentA2Id, 'a2'),
        publicToken,
      ),
    ).resolves.toBeNull();
    await expect(
      cancelPublicReservation(
        db,
        publicConfig(organizationBId, establishmentBId, 'b1'),
        publicToken,
      ),
    ).rejects.toMatchObject({ code: 'BOOKING_NOT_FOUND' });

    await expect(
      cancelPublicReservation(
        db,
        publicConfig(organizationAId, establishmentAId, 'a1'),
        publicToken,
        new Date('2029-12-01T00:00:00.000Z'),
      ),
    ).resolves.toMatchObject({ status: 'CANCELLED' });
  });

  it('rejects cross-establishment service-period references and scoped deletes', async () => {
    await expect(
      createBookingException(db, contextA, {
        date: '2030-01-02',
        kind: 'CLOSED_SERVICE',
        servicePeriodId: servicePeriodA2Id,
        startTime: null,
        endTime: null,
        capacityOverride: null,
        reason: null,
      }),
    ).rejects.toMatchObject({ code: 'BOOKING_NOT_FOUND' });
    await expect(
      createBookingException(db, contextA, {
        date: '2030-01-02',
        kind: 'CLOSED_SERVICE',
        servicePeriodId: servicePeriodBId,
        startTime: null,
        endTime: null,
        capacityOverride: null,
        reason: null,
      }),
    ).rejects.toMatchObject({ code: 'BOOKING_NOT_FOUND' });

    await deleteBookingServicePeriod(
      db,
      contextWrongEstablishment,
      servicePeriodAId,
    );
    await deleteBookingException(db, contextWrongEstablishment, exceptionAId);

    await expect(
      db
        .select({ id: bookingServicePeriods.id })
        .from(bookingServicePeriods)
        .where(eq(bookingServicePeriods.id, servicePeriodAId)),
    ).resolves.toEqual([{ id: servicePeriodAId }]);
    await expect(
      db
        .select({ id: bookingExceptions.id })
        .from(bookingExceptions)
        .where(eq(bookingExceptions.id, exceptionAId)),
    ).resolves.toEqual([{ id: exceptionAId }]);
  });
});
