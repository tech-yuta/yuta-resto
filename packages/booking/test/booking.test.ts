import { describe, expect, it } from 'vitest';
import {
  assertStatusTransition,
  generateAvailability,
  localDateTimeToInstant,
} from '../src';

describe('booking domain', () => {
  it('handles Europe/Paris daylight-saving conversion', () => {
    expect(
      localDateTimeToInstant(
        '2026-07-01',
        '12:00',
        'Europe/Paris',
      ).toISOString(),
    ).toBe('2026-07-01T10:00:00.000Z');
  });

  it('subtracts consuming reservations from period capacity', () => {
    const slots = generateAvailability({
      date: '2026-08-03',
      timezone: 'Europe/Paris',
      partySize: 3,
      settings: {
        minimumPartySize: 1,
        maximumPartySize: 12,
        slotIntervalMinutes: 30,
        minimumNoticeMinutes: 0,
        bookingWindowDays: 90,
      },
      periods: [
        {
          id: 'lunch',
          dayOfWeek: 1,
          startTime: '12:00',
          endTime: '13:00',
          capacity: 10,
          enabled: true,
        },
      ],
      exceptions: [],
      reservedSeatsByTime: new Map([['12:00', 8]]),
      now: new Date('2026-08-02T08:00:00Z'),
    });
    expect(slots[0]).toMatchObject({ time: '12:00', available: false });
    expect(slots[1]).toMatchObject({ time: '12:30', available: true });
  });

  it('rejects impossible lifecycle transitions', () => {
    expect(() => assertStatusTransition('COMPLETED', 'CONFIRMED')).toThrow();
  });
});
