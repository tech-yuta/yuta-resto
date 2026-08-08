import { describe, expect, it } from 'vitest';
import {
  getReservationListEndDate,
  resolveReservationListDate,
  resolveReservationListView,
} from '../src/app/(authenticated)/reservations/reservations-list-model';
import {
  getReservationStatusTone,
  getReservationStatusTransitions,
} from '../src/app/(authenticated)/reservations/reservation-status-model';

describe('reservations list model', () => {
  it('uses the establishment timezone when the query has no valid date', () => {
    const instant = new Date('2026-08-07T22:30:00.000Z');

    expect(resolveReservationListDate(undefined, 'Europe/Paris', instant)).toBe(
      '2026-08-08',
    );
    expect(
      resolveReservationListDate(undefined, 'America/New_York', instant),
    ).toBe('2026-08-07');
    expect(
      resolveReservationListDate('2026-09-10', 'Europe/Paris', instant),
    ).toBe('2026-09-10');
  });

  it('resolves day and inclusive week ranges', () => {
    expect(resolveReservationListView('unexpected')).toBe('day');
    expect(resolveReservationListView('week')).toBe('week');
    expect(getReservationListEndDate('2026-12-30', 'day')).toBe('2026-12-30');
    expect(getReservationListEndDate('2026-12-30', 'week')).toBe('2027-01-05');
  });

  it('owns status presentation and allowed operations', () => {
    expect(getReservationStatusTone('CONFIRMED')).toBe('success');
    expect(getReservationStatusTone('PENDING')).toBe('warning');
    expect(getReservationStatusTone('CANCELLED')).toBe('neutral');
    expect(getReservationStatusTransitions('PENDING')).toEqual([
      'CONFIRMED',
      'DECLINED',
    ]);
    expect(getReservationStatusTransitions('CONFIRMED')).toEqual([
      'SEATED',
      'CANCELLED',
      'NO_SHOW',
    ]);
    expect(getReservationStatusTransitions('SEATED')).toEqual(['COMPLETED']);
    expect(getReservationStatusTransitions('COMPLETED')).toEqual([]);
  });
});
