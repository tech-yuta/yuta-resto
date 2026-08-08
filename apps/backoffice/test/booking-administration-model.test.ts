import { describe, expect, it } from 'vitest';
import {
  formatBookingExceptionDate,
  getBookingDayLabel,
  getBookingExceptionFieldVisibility,
} from '../src/app/(authenticated)/etablissement/booking-administration-model';

describe('booking administration model', () => {
  it('selects fields required by each exception kind', () => {
    expect(getBookingExceptionFieldVisibility('CLOSED_ALL_DAY')).toEqual({
      requiresService: false,
      requiresTimes: false,
      supportsCapacity: false,
    });
    expect(getBookingExceptionFieldVisibility('CLOSED_SERVICE')).toEqual({
      requiresService: true,
      requiresTimes: false,
      supportsCapacity: false,
    });
    expect(getBookingExceptionFieldVisibility('MODIFIED_HOURS')).toEqual({
      requiresService: false,
      requiresTimes: true,
      supportsCapacity: true,
    });
    expect(getBookingExceptionFieldVisibility('BLOCKED_SLOT')).toEqual({
      requiresService: false,
      requiresTimes: true,
      supportsCapacity: false,
    });
  });

  it('formats schedule labels without shifting the persisted local date', () => {
    expect(getBookingDayLabel(1)).toBe('Lundi');
    expect(getBookingDayLabel(12)).toBe('Jour');
    expect(formatBookingExceptionDate('2026-12-31', 'fr-FR')).toContain(
      '31 décembre 2026',
    );
  });
});
