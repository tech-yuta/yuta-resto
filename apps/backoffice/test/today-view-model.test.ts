import { describe, expect, it } from 'vitest';
import {
  formatTimeRange,
  getLocalDateTimeParts,
  getServiceState,
  isActiveTodayReservation,
  reservationStatusPresentation,
  resolveServicePeriodForToday,
} from '../src/app/(authenticated)/aujourdhui/today-view-model';

describe('today view model', () => {
  it('derives the establishment date and time across a UTC day boundary', () => {
    expect(
      getLocalDateTimeParts(
        'Europe/Paris',
        new Date('2026-08-06T23:30:00.000Z'),
      ),
    ).toEqual({
      localDate: '2026-08-07',
      localTime: '01:30',
      dayOfWeek: 5,
    });
  });

  it.each([
    ['PENDING', true],
    ['CONFIRMED', true],
    ['SEATED', true],
    ['COMPLETED', false],
    ['CANCELLED', false],
    ['NO_SHOW', false],
  ] as const)('classifies %s reservations', (status, expected) => {
    expect(isActiveTodayReservation(status)).toBe(expected);
  });

  it('derives upcoming, current, and completed service states', () => {
    expect(getServiceState('11:00', '14:00', '10:59')).toBe('upcoming');
    expect(getServiceState('11:00', '14:00', '11:00')).toBe('current');
    expect(getServiceState('11:00', '14:00', '13:59')).toBe('current');
    expect(getServiceState('11:00', '14:00', '14:00')).toBe('completed');
  });

  it('applies dated booking closures and modified hours', () => {
    const period = {
      id: 'lunch',
      startTime: '11:30:00',
      endTime: '14:00:00',
      capacity: 40,
    };
    expect(
      resolveServicePeriodForToday(period, [
        {
          kind: 'MODIFIED_HOURS',
          servicePeriodId: 'lunch',
          startTime: '12:00:00',
          endTime: '15:00:00',
          capacityOverride: 24,
        },
      ]),
    ).toEqual({
      ...period,
      startTime: '12:00:00',
      endTime: '15:00:00',
      capacity: 24,
    });
    expect(
      resolveServicePeriodForToday(period, [
        {
          kind: 'CLOSED_ALL_DAY',
          servicePeriodId: null,
          startTime: null,
          endTime: null,
          capacityOverride: null,
        },
      ]),
    ).toBeNull();
  });

  it('provides stable French status labels and time ranges', () => {
    expect(reservationStatusPresentation('CONFIRMED')).toEqual({
      label: 'Confirmée',
      tone: 'success',
    });
    expect(formatTimeRange('11:30', '14:00')).toBe('11:30–14:00');
  });
});
