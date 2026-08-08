import { BookingRepositoryError } from '@yuta/db-cloud';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { reservationActionError } from '../src/app/(authenticated)/reservations/reservation-action-error';

describe('reservation action errors', () => {
  it('associates validation issues with their fields', () => {
    const result = z
      .object({ guest: z.object({ firstName: z.string().min(1) }) })
      .safeParse({ guest: { firstName: '' } });

    if (result.success) throw new Error('Expected validation to fail.');

    expect(reservationActionError(result.error, 'unused')).toEqual({
      status: 'error',
      message: 'Certains champs doivent être corrigés.',
      fieldErrors: { firstName: 'Vérifiez cette valeur.' },
    });
  });

  it('returns a recoverable message when a slot becomes unavailable', () => {
    const state = reservationActionError(
      new BookingRepositoryError('Slot unavailable.', 'SLOT_UNAVAILABLE'),
      'unused',
    );

    expect(state.status).toBe('error');
    expect(state.fieldErrors).toEqual({});
    expect(state.message).toContain('Choisissez une autre heure');
  });

  it('returns a stale-state message for invalid status transitions', () => {
    const state = reservationActionError(
      Object.assign(new Error('Invalid status transition.'), {
        code: 'INVALID_STATUS_TRANSITION',
      }),
      'unused',
    );

    expect(state).toEqual({
      status: 'error',
      message: 'Le statut a changé. Actualisez la page puis réessayez.',
      fieldErrors: {},
    });
  });
});
