import { describe, expect, it } from 'vitest';
import {
  formatMinutes,
  formatTimeRange,
  getNextDatedItem,
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
});
