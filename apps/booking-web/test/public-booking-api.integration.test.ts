import { config } from 'dotenv';
import { and, eq, inArray } from 'drizzle-orm';
import type { CloudDatabaseClient } from '@yuta/db-cloud/client';
import {
  bookingAuditEvents,
  bookingNotificationDeliveries,
  bookingPublicAttempts,
  bookingServicePeriods,
  bookingSettings,
  establishments,
  organizations,
  reservations,
  reservationStatusHistory,
  tenantEntitlements,
} from '@yuta/db-cloud/schema';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { v7 as uuidv7 } from 'uuid';

config({ path: '.env.test' });
config({ path: '.env.local' });

vi.mock('server-only', () => ({}));

const integrationTest =
  process.env.CLOUD_DATABASE_URL &&
  process.env.YUTA_ALLOW_DATABASE_INTEGRATION_TESTS === 'true'
    ? describe.sequential
    : describe.skip;

type AvailabilityHandler =
  typeof import('../src/app/api/public/booking/establishments/[establishmentSlug]/availability/route');
type CreationHandler =
  typeof import('../src/app/api/public/booking/establishments/[establishmentSlug]/reservations/route');
type ReservationHandler =
  typeof import('../src/app/api/public/booking/establishments/[establishmentSlug]/reservations/[publicToken]/route');
type CancellationHandler =
  typeof import('../src/app/api/public/booking/establishments/[establishmentSlug]/reservations/[publicToken]/cancel/route');

type CreatedReservationResponse = {
  reservation: { reference: string; status: string };
  publicToken: string;
};

function futureServiceDate(): { date: string; dayOfWeek: number } {
  const candidate = new Date();
  candidate.setUTCDate(candidate.getUTCDate() + 30);
  candidate.setUTCHours(12, 0, 0, 0);
  while (candidate.getUTCDay() !== 1) {
    candidate.setUTCDate(candidate.getUTCDate() + 1);
  }
  return {
    date: candidate.toISOString().slice(0, 10),
    dayOfWeek: candidate.getUTCDay(),
  };
}

integrationTest('public booking API integration', () => {
  let db: CloudDatabaseClient;
  let availabilityGet: AvailabilityHandler['GET'];
  let createReservation: CreationHandler['POST'];
  let getReservation: ReservationHandler['GET'];
  let cancelReservation: CancellationHandler['POST'];

  const organizationId = uuidv7();
  const automaticEstablishmentId = uuidv7();
  const manualEstablishmentId = uuidv7();
  const disabledEstablishmentId = uuidv7();
  const establishmentIds = [
    automaticEstablishmentId,
    manualEstablishmentId,
    disabledEstablishmentId,
  ];
  const automaticSlug = `booking-api-auto-${automaticEstablishmentId}`;
  const manualSlug = `booking-api-manual-${manualEstablishmentId}`;
  const disabledSlug = `booking-api-disabled-${disabledEstablishmentId}`;
  const serviceDate = futureServiceDate();
  let automaticReservation: CreatedReservationResponse;
  let manualReservation: CreatedReservationResponse;

  const context = (establishmentSlug: string) => ({
    params: Promise.resolve({ establishmentSlug }),
  });
  const reservationContext = (
    establishmentSlug: string,
    publicToken: string,
  ) => ({
    params: Promise.resolve({ establishmentSlug, publicToken }),
  });
  const request = (
    path: string,
    options: RequestInit = {},
    address = `198.51.100.${Math.floor(Math.random() * 200) + 1}`,
  ) =>
    new Request(`http://booking.test${path}`, {
      ...options,
      headers: {
        'x-forwarded-for': address,
        ...options.headers,
      },
    });
  const creationRequest = (establishmentSlug: string, guestNumber: number) =>
    request(
      `/api/public/booking/establishments/${establishmentSlug}/reservations`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          date: serviceDate.date,
          time: '12:00',
          partySize: 2,
          guest: {
            firstName: `Guest ${guestNumber}`,
            lastName: 'API Integration',
            email: `booking-api-${guestNumber}-${organizationId}@example.test`,
            phone: `+3354900000${guestNumber}`,
          },
          source: 'DIRECT',
          marketingConsent: false,
          policyAccepted: true,
          idempotencyKey: `booking-api-${guestNumber}-${uuidv7()}`,
        }),
      },
    );

  beforeAll(async () => {
    const cloudDatabaseModule = await import('../src/server/cloud-database');
    db = cloudDatabaseModule.cloudDatabase;
    ({ GET: availabilityGet } =
      await import('../src/app/api/public/booking/establishments/[establishmentSlug]/availability/route'));
    ({ POST: createReservation } =
      await import('../src/app/api/public/booking/establishments/[establishmentSlug]/reservations/route'));
    ({ GET: getReservation } =
      await import('../src/app/api/public/booking/establishments/[establishmentSlug]/reservations/[publicToken]/route'));
    ({ POST: cancelReservation } =
      await import('../src/app/api/public/booking/establishments/[establishmentSlug]/reservations/[publicToken]/cancel/route'));

    await db.insert(organizations).values({
      id: organizationId,
      name: 'Booking API integration organization',
      slug: `booking-api-${organizationId}`,
    });
    await db.insert(establishments).values([
      {
        id: automaticEstablishmentId,
        organizationId,
        name: 'Automatic booking API establishment',
        slug: automaticSlug,
      },
      {
        id: manualEstablishmentId,
        organizationId,
        name: 'Manual booking API establishment',
        slug: manualSlug,
      },
      {
        id: disabledEstablishmentId,
        organizationId,
        name: 'Disabled booking API establishment',
        slug: disabledSlug,
      },
    ]);
    await db.insert(tenantEntitlements).values(
      establishmentIds.map((establishmentId) => ({
        organizationId,
        establishmentId,
        key: 'booking.enabled',
      })),
    );
    await db.insert(bookingSettings).values([
      {
        id: uuidv7(),
        organizationId,
        establishmentId: automaticEstablishmentId,
        enabled: true,
        confirmationMode: 'AUTOMATIC',
        minimumNoticeMinutes: 0,
        bookingWindowDays: 365,
        cancellationDeadlineMinutes: 0,
      },
      {
        id: uuidv7(),
        organizationId,
        establishmentId: manualEstablishmentId,
        enabled: true,
        confirmationMode: 'MANUAL',
        minimumNoticeMinutes: 0,
        bookingWindowDays: 365,
        cancellationDeadlineMinutes: 0,
      },
      {
        id: uuidv7(),
        organizationId,
        establishmentId: disabledEstablishmentId,
        enabled: false,
        confirmationMode: 'MANUAL',
        minimumNoticeMinutes: 0,
        bookingWindowDays: 365,
        cancellationDeadlineMinutes: 0,
      },
    ]);
    await db.insert(bookingServicePeriods).values(
      establishmentIds.map((establishmentId) => ({
        id: uuidv7(),
        organizationId,
        establishmentId,
        dayOfWeek: serviceDate.dayOfWeek,
        name: 'API integration lunch',
        startTime: '12:00',
        endTime: '13:00',
        capacity: 10,
      })),
    );
  });

  afterAll(async () => {
    if (!db) return;

    await db
      .delete(bookingPublicAttempts)
      .where(inArray(bookingPublicAttempts.establishmentId, establishmentIds));
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
      .delete(bookingSettings)
      .where(eq(bookingSettings.organizationId, organizationId));
    await db
      .delete(tenantEntitlements)
      .where(eq(tenantEntitlements.organizationId, organizationId));
    await db
      .delete(establishments)
      .where(eq(establishments.organizationId, organizationId));
    await db.delete(organizations).where(eq(organizations.id, organizationId));
    await db.$client.end({ timeout: 5 });
  });

  it('resolves enabled availability and hides unknown or disabled establishments', async () => {
    const availability = await availabilityGet(
      request(
        `/api/public/booking/establishments/${automaticSlug}/availability?date=${serviceDate.date}&partySize=2`,
      ),
      context(automaticSlug),
    );
    expect(availability.status).toBe(200);
    const availabilityBody = (await availability.json()) as {
      date: string;
      timezone: string;
      slots: Array<{
        time: string;
        available: boolean;
        remainingCapacity: number;
      }>;
    };
    expect(availabilityBody).toMatchObject({
      date: serviceDate.date,
      timezone: 'Europe/Paris',
    });
    expect(availabilityBody.slots).toEqual(
      expect.arrayContaining([
        { time: '12:00', available: true, remainingCapacity: 10 },
      ]),
    );

    for (const slug of [disabledSlug, `unknown-${uuidv7()}`]) {
      const unavailable = await availabilityGet(
        request(
          `/api/public/booking/establishments/${slug}/availability?date=${serviceDate.date}&partySize=2`,
        ),
        context(slug),
      );
      expect(unavailable.status).toBe(404);
      await expect(unavailable.json()).resolves.toMatchObject({
        error: { code: 'BOOKING_NOT_FOUND' },
      });
    }
  });

  it('creates automatic and manual reservations with transactional records', async () => {
    const automaticResponse = await createReservation(
      creationRequest(automaticSlug, 1),
      context(automaticSlug),
    );
    expect(automaticResponse.status).toBe(201);
    automaticReservation =
      (await automaticResponse.json()) as CreatedReservationResponse;
    expect(automaticReservation.reservation.status).toBe('CONFIRMED');

    const manualResponse = await createReservation(
      creationRequest(manualSlug, 2),
      context(manualSlug),
    );
    expect(manualResponse.status).toBe(201);
    manualReservation =
      (await manualResponse.json()) as CreatedReservationResponse;
    expect(manualReservation.reservation.status).toBe('PENDING');

    const persisted = await db
      .select({
        id: reservations.id,
        reference: reservations.reference,
        status: reservations.status,
      })
      .from(reservations)
      .where(
        and(
          eq(reservations.organizationId, organizationId),
          inArray(reservations.establishmentId, [
            automaticEstablishmentId,
            manualEstablishmentId,
          ]),
        ),
      );
    expect(persisted).toHaveLength(2);

    for (const reservation of persisted) {
      await expect(
        db
          .select({ id: reservationStatusHistory.id })
          .from(reservationStatusHistory)
          .where(eq(reservationStatusHistory.reservationId, reservation.id)),
      ).resolves.toHaveLength(1);
      await expect(
        db
          .select({ id: bookingAuditEvents.id })
          .from(bookingAuditEvents)
          .where(eq(bookingAuditEvents.reservationId, reservation.id)),
      ).resolves.toHaveLength(1);
      await expect(
        db
          .select({ id: bookingNotificationDeliveries.id })
          .from(bookingNotificationDeliveries)
          .where(
            eq(bookingNotificationDeliveries.reservationId, reservation.id),
          ),
      ).resolves.toHaveLength(1);
    }
  });

  it('reads and cancels a valid token while hiding an invalid token', async () => {
    const invalidToken = `invalid-${uuidv7()}-${uuidv7()}`;
    const invalidResponse = await getReservation(
      request(
        `/api/public/booking/establishments/${automaticSlug}/reservations/${invalidToken}`,
      ),
      reservationContext(automaticSlug, invalidToken),
    );
    expect(invalidResponse.status).toBe(404);
    await expect(invalidResponse.json()).resolves.toMatchObject({
      error: { code: 'BOOKING_NOT_FOUND' },
    });

    const readResponse = await getReservation(
      request(
        `/api/public/booking/establishments/${automaticSlug}/reservations/${automaticReservation.publicToken}`,
      ),
      reservationContext(automaticSlug, automaticReservation.publicToken),
    );
    expect(readResponse.status).toBe(200);
    await expect(readResponse.json()).resolves.toMatchObject({
      reservation: {
        reference: automaticReservation.reservation.reference,
        status: 'CONFIRMED',
      },
    });

    const cancellationResponse = await cancelReservation(
      request(
        `/api/public/booking/establishments/${automaticSlug}/reservations/${automaticReservation.publicToken}/cancel`,
        { method: 'POST' },
      ),
      reservationContext(automaticSlug, automaticReservation.publicToken),
    );
    expect(cancellationResponse.status).toBe(200);
    await expect(cancellationResponse.json()).resolves.toMatchObject({
      reservation: { status: 'CANCELLED' },
    });

    const [persisted] = await db
      .select({ id: reservations.id, status: reservations.status })
      .from(reservations)
      .where(
        and(
          eq(reservations.organizationId, organizationId),
          eq(
            reservations.reference,
            automaticReservation.reservation.reference,
          ),
        ),
      );
    expect(persisted).toMatchObject({ status: 'CANCELLED' });
    if (!persisted) return;
    await expect(
      db
        .select({ id: reservationStatusHistory.id })
        .from(reservationStatusHistory)
        .where(eq(reservationStatusHistory.reservationId, persisted.id)),
    ).resolves.toHaveLength(2);
    await expect(
      db
        .select({ id: bookingNotificationDeliveries.id })
        .from(bookingNotificationDeliveries)
        .where(eq(bookingNotificationDeliveries.reservationId, persisted.id)),
    ).resolves.toHaveLength(2);
  });

  it('rate limits repeated public token reads without exposing the token', async () => {
    const invalidToken = `limited-${uuidv7()}-${uuidv7()}`;
    const address = '203.0.113.240';
    const call = () =>
      getReservation(
        request(
          `/api/public/booking/establishments/${manualSlug}/reservations/${invalidToken}`,
          {},
          address,
        ),
        reservationContext(manualSlug, invalidToken),
      );

    for (let attempt = 0; attempt < 30; attempt += 1) {
      const response = await call();
      expect(response.status).toBe(404);
    }
    const limited = await call();
    expect(limited.status).toBe(429);
    await expect(limited.json()).resolves.toMatchObject({
      error: { code: 'RATE_LIMITED' },
    });

    const attempts = await db
      .select({ subjectHash: bookingPublicAttempts.subjectHash })
      .from(bookingPublicAttempts)
      .where(
        and(
          eq(bookingPublicAttempts.establishmentId, manualEstablishmentId),
          eq(bookingPublicAttempts.action, 'READ'),
        ),
      );
    expect(attempts).toHaveLength(30);
    expect(
      attempts.every((attempt) => !attempt.subjectHash.includes(invalidToken)),
    ).toBe(true);
    expect(manualReservation.reservation.status).toBe('PENDING');
  });
});
