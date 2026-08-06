import { describe, expect, it } from 'vitest';
import {
  formatMinutes,
  formatTimeRange,
  getNextDatedItem,
  getPublicScheduleRows,
  orderedWeekDays,
} from '../src/app/(authenticated)/establishment/hours-services/hours-services-view-model';

describe('hours and services view model', () => {
  it('orders the week from Monday through Sunday', () => {
    expect(orderedWeekDays.map((day) => day.value)).toEqual([
      1, 2, 3, 4, 5, 6, 0,
    ]);
  });

  it('formats service times and durations for French UI', () => {
    expect(formatTimeRange('11:30:00', '14:30:00')).toBe('11:30–14:30');
    expect(formatMinutes(30)).toBe('30 min');
    expect(formatMinutes(90)).toBe('1 h 30');
  });

  it('selects the closest upcoming exception', () => {
    expect(
      getNextDatedItem(
        [
          { exceptionDate: '2026-12-24' },
          { exceptionDate: '2026-08-15' },
          { exceptionDate: '2026-01-01' },
        ],
        '2026-08-06',
      ),
    ).toEqual({ exceptionDate: '2026-08-15' });
  });

  it('keeps public schedule ranges scoped to their actual weekday', () => {
    const rows = getPublicScheduleRows([
      {
        dayOfWeek: 1,
        startTime: '12:00:00',
        endTime: '14:00:00',
        enabled: true,
      },
      {
        dayOfWeek: 2,
        startTime: '19:00:00',
        endTime: '22:00:00',
        enabled: true,
      },
      {
        dayOfWeek: 3,
        startTime: '12:00:00',
        endTime: '14:00:00',
        enabled: false,
      },
    ]);

    expect(rows[0]).toEqual({ label: 'Lundi', ranges: ['12:00–14:00'] });
    expect(rows[1]).toEqual({ label: 'Mardi', ranges: ['19:00–22:00'] });
    expect(rows[2]).toEqual({ label: 'Mercredi', ranges: [] });
  });
});
