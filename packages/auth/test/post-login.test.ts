import type { AvailableTenant } from '../src';
import { resolvePostLoginDestination } from '../src';
import { describe, expect, it } from 'vitest';

const luna: AvailableTenant = {
  membershipId: '11111111-1111-4111-8111-111111111111',
  organizationId: '22222222-2222-4222-8222-222222222222',
  organizationName: 'LUNA',
  organizationSlug: 'luna',
  establishmentId: '33333333-3333-4333-8333-333333333333',
  establishmentName: 'LUNA',
  establishmentSlug: 'luna',
  role: 'OWNER',
  locale: 'fr-FR',
  timezone: 'Europe/Paris',
};

describe('post-login resolution', () => {
  it('returns no establishment when no active membership is available', () => {
    expect(resolvePostLoginDestination([])).toEqual({
      type: 'NO_ESTABLISHMENT',
    });
  });

  it('automatically activates the only available membership', () => {
    expect(resolvePostLoginDestination([luna])).toEqual({
      type: 'AUTO_ACTIVATE',
      membership: luna,
    });
  });

  it('requires selection when several memberships are available', () => {
    const poitiers = {
      ...luna,
      membershipId: '44444444-4444-4444-8444-444444444444',
      establishmentId: '55555555-5555-4555-8555-555555555555',
      establishmentName: 'LuNa Poitiers',
      establishmentSlug: 'luna-poitiers',
    } satisfies AvailableTenant;
    expect(resolvePostLoginDestination([luna, poitiers])).toEqual({
      type: 'SELECT_ESTABLISHMENT',
      establishments: [luna, poitiers],
    });
  });
});
