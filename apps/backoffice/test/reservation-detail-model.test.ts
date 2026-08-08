import { describe, expect, it } from 'vitest';
import { formatReservationEventDate } from '../src/app/(authenticated)/reservations/[reservationId]/reservation-detail-model';

describe('reservation detail model', () => {
  it('formats reservation events in the establishment timezone and locale', () => {
    const eventDate = new Date('2026-08-07T22:30:00.000Z');

    expect(
      formatReservationEventDate(eventDate, 'fr-FR', 'Europe/Paris'),
    ).toContain('08/08/2026');
    expect(
      formatReservationEventDate(eventDate, 'en-US', 'America/New_York'),
    ).toContain('8/7/26');
  });
});
