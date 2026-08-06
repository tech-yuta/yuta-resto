import { describe, expect, it } from 'vitest';
import {
  apiErrorSchema,
  createInternalNoteSchema,
  createLocalOrderInputSchema,
  createOrderInputSchema,
  createReservationInputSchema,
  bookingExceptionInputSchema,
  cursorPaginationQuerySchema,
  kitchenOrderCreatedEventSchema,
  cloudUserSchema,
  moneySchema,
  localOrderCommandSchema,
  localPosApiBasePath,
  orderStatusSchema,
  publicFeedbackSubmissionSchema,
  saveReplySchema,
  updateFeedbackSchema,
  uuidV7Schema,
  tenantMembershipContractSchema,
} from '../src';

const id = '11111111-1111-4111-8111-111111111111';

describe('@yuta/contracts', () => {
  it('keeps the current POS lifecycle', () => {
    expect(orderStatusSchema.parse('sent')).toBe('sent');
    expect(orderStatusSchema.safeParse('submitted').success).toBe(false);
  });

  it('validates the local site-agent API boundary', () => {
    const uuidV7 = '01981f90-8e60-7000-8000-000000000001';

    expect(localPosApiBasePath).toBe('/api/v1');
    expect(uuidV7Schema.parse(uuidV7)).toBe(uuidV7);
    expect(uuidV7Schema.safeParse(id).success).toBe(false);
    expect(
      createLocalOrderInputSchema.parse({
        tableLabel: 'Table 12',
        orderType: 'dine_in',
        staffUserId: id,
      }),
    ).toEqual({
      tableLabel: 'Table 12',
      orderType: 'dine_in',
      staffUserId: id,
    });
    expect(
      localOrderCommandSchema.safeParse({
        action: 'send_to_kitchen',
        idempotencyKey: id,
        staffUserId: id,
      }).success,
    ).toBe(false);
    const sendCommand = localOrderCommandSchema.parse({
      action: 'send_to_kitchen',
      idempotencyKey: uuidV7,
      staffUserId: id,
    });
    expect(sendCommand.action).toBe('send_to_kitchen');
    if (sendCommand.action !== 'send_to_kitchen') {
      throw new Error('Expected a send-to-kitchen command.');
    }
    expect(sendCommand.allergyAcknowledged).toBe(false);
  });

  it('validates strict common and order contracts', () => {
    expect(
      moneySchema.parse({ amountMinor: 1490, currency: 'EUR' }).amountMinor,
    ).toBe(1490);
    expect(
      apiErrorSchema.safeParse({
        error: { code: 'CONFLICT', message: 'Conflict' },
        sql: 'secret',
      }).success,
    ).toBe(false);
    expect(cursorPaginationQuerySchema.parse({ limit: '10' }).limit).toBe(10);
    expect(
      createOrderInputSchema.parse({
        establishmentId: id,
        serviceType: 'dine_in',
        items: [{ productId: id, quantity: 1 }],
        idempotencyKey: id,
      }).items[0].modifierIds,
    ).toEqual([]);
    expect(
      createOrderInputSchema.safeParse({
        establishmentId: id,
        serviceType: 'dine_in',
        items: [],
        idempotencyKey: id,
        extra: true,
      }).success,
    ).toBe(false);
  });

  it('round-trips a versioned kitchen event', () => {
    const event = {
      eventId: id,
      eventVersion: 1,
      occurredAt: '2026-07-19T12:00:00+02:00',
      organizationId: id,
      establishmentId: id,
      type: 'kitchen.order.created',
      payload: {
        orderId: id,
        orderNumber: 'POS-1',
        createdAt: '2026-07-19T12:00:00+02:00',
        items: [
          { orderItemId: id, displayName: 'Pho', quantity: 1, notes: [] },
        ],
      },
    };
    expect(
      kitchenOrderCreatedEventSchema.parse(JSON.parse(JSON.stringify(event))),
    ).toEqual(event);
  });

  it('validates reservation privacy boundary', () => {
    const reservation = {
      establishmentId: id,
      startAt: '2026-07-19T12:00:00+02:00',
      partySize: 2,
      customer: {
        firstName: 'Tam',
        lastName: 'Nguyen',
        email: 'tam@example.com',
        phone: '0600000000',
      },
      idempotencyKey: id,
    };
    expect(createReservationInputSchema.parse(reservation)).toEqual(
      reservation,
    );
    expect(
      createReservationInputSchema.safeParse({
        ...reservation,
        customer: { firstName: 'Tam' },
      }).success,
    ).toBe(false);
  });

  it('validates booking exception fields for each exception kind', () => {
    const baseException = {
      date: '2026-08-15',
      servicePeriodId: null,
      startTime: null,
      endTime: null,
      capacityOverride: null,
      reason: null,
    };

    expect(
      bookingExceptionInputSchema.safeParse({
        ...baseException,
        kind: 'CLOSED_ALL_DAY',
      }).success,
    ).toBe(true);
    expect(
      bookingExceptionInputSchema.safeParse({
        ...baseException,
        kind: 'CLOSED_SERVICE',
      }).success,
    ).toBe(false);
    expect(
      bookingExceptionInputSchema.safeParse({
        ...baseException,
        kind: 'CLOSED_SERVICE',
        servicePeriodId: id,
      }).success,
    ).toBe(true);
    expect(
      bookingExceptionInputSchema.safeParse({
        ...baseException,
        kind: 'BLOCKED_SLOT',
        startTime: '19:00',
        endTime: '18:00',
      }).success,
    ).toBe(false);
    expect(
      bookingExceptionInputSchema.safeParse({
        ...baseException,
        kind: 'MODIFIED_HOURS',
        startTime: '18:00',
        endTime: '22:00',
      }).success,
    ).toBe(true);
  });

  it('validates public feedback and requires contact consent', () => {
    expect(
      publicFeedbackSubmissionSchema.parse({
        rating: 5,
        topics: ['FOOD_QUALITY', 'SERVICE'],
        comment: 'Très bon accueil.',
      }),
    ).toMatchObject({
      rating: 5,
      topics: ['FOOD_QUALITY', 'SERVICE'],
      consentToContact: false,
    });

    expect(
      publicFeedbackSubmissionSchema.safeParse({
        rating: 2,
        topics: ['ORDER_ACCURACY'],
        customerEmail: 'client@example.com',
        consentToContact: false,
      }).success,
    ).toBe(false);
    expect(
      publicFeedbackSubmissionSchema.safeParse({
        rating: 2,
        topics: ['ORDER_ACCURACY'],
        customerEmail: 'client@example.com',
        consentToContact: true,
      }).success,
    ).toBe(true);
  });

  it('rejects invalid public ratings and topics', () => {
    expect(
      publicFeedbackSubmissionSchema.safeParse({
        rating: 0,
        topics: [],
      }).success,
    ).toBe(false);
    expect(
      publicFeedbackSubmissionSchema.safeParse({
        rating: 5,
        topics: ['UNSUPPORTED_TOPIC'],
      }).success,
    ).toBe(false);
    expect(
      publicFeedbackSubmissionSchema.parse({
        rating: 5,
        topics: [],
        website: 'https://spam.example',
      }).website,
    ).toBe('https://spam.example');
  });

  it('validates persistent reputation inbox mutations', () => {
    expect(
      updateFeedbackSchema.parse({
        status: 'TO_PROCESS',
        assignedToUserId: id,
      }),
    ).toEqual({
      status: 'TO_PROCESS',
      assignedToUserId: id,
    });
    expect(updateFeedbackSchema.safeParse({}).success).toBe(false);
    expect(saveReplySchema.safeParse({ content: '  ' }).success).toBe(false);
    expect(
      createInternalNoteSchema.parse({
        content: 'Rappeler le client demain.',
      }).content,
    ).toBe('Rappeler le client demain.');
  });

  it('keeps system roles separate from tenant membership roles', () => {
    expect(
      cloudUserSchema.parse({
        id,
        email: 'owner@example.test',
        displayName: 'Owner',
        status: 'ACTIVE',
        systemRole: 'YUTA_SUPPORT',
      }).systemRole,
    ).toBe('YUTA_SUPPORT');
    expect(
      tenantMembershipContractSchema.safeParse({
        id,
        organizationId: id,
        establishmentId: id,
        userId: id,
        role: 'YUTA_ADMIN',
        status: 'active',
        joinedAt: new Date(),
      }).success,
    ).toBe(false);
  });
});
