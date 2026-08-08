import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  bookingAdministrationError,
  bookingAdministrationIdSchema,
} from '../src/app/(authenticated)/etablissement/booking-administration-action-state';

describe('booking administration action state', () => {
  it('maps Zod issues to stable field errors', () => {
    const schema = z.object({ capacity: z.number().min(1) });
    const result = schema.safeParse({ capacity: 0 });

    if (result.success) throw new Error('Expected validation to fail.');
    expect(bookingAdministrationError(result.error, 'unused')).toEqual({
      status: 'error',
      message: 'Certains champs doivent être corrigés.',
      fieldErrors: { capacity: 'Vérifiez cette valeur.' },
    });
  });

  it('accepts only UUID identifiers for delete actions', () => {
    expect(
      bookingAdministrationIdSchema.safeParse(
        '019fd3ed-000e-74b3-b23b-909285f1db59',
      ).success,
    ).toBe(true);
    expect(
      bookingAdministrationIdSchema.safeParse('other-tenant').success,
    ).toBe(false);
  });
});
