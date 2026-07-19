import { describe, expect, it } from 'vitest';
import {
  apiErrorSchema,
  createOrderInputSchema,
  createReservationInputSchema,
  cursorPaginationQuerySchema,
  kitchenOrderCreatedEventSchema,
  moneySchema,
  orderStatusSchema,
} from '../src';

const id = '11111111-1111-4111-8111-111111111111';

describe('@yuta/contracts', () => {
  it('keeps the current POS lifecycle', () => {
    expect(orderStatusSchema.parse('sent')).toBe('sent');
    expect(orderStatusSchema.safeParse('submitted').success).toBe(false);
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
});
