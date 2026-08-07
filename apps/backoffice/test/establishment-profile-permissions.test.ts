import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import type { TenantContext, TenantRole } from '@yuta/tenant';
import {
  hasBookingPermission,
  hasEstablishmentPermission,
  requireEstablishmentPermission,
} from '../src/server/auth/permissions';

function context(role: TenantRole): TenantContext {
  return {
    organizationId: randomUUID(),
    establishmentId: randomUUID(),
    actor: {
      type: 'user',
      userId: randomUUID(),
      membershipId: randomUUID(),
      role,
    },
    locale: 'fr-FR',
    timezone: 'Europe/Paris',
    entitlements: new Set(),
  };
}

describe('establishment profile permissions', () => {
  it.each(['OWNER', 'MANAGER', 'STAFF'] as const)(
    'allows %s to read the profile',
    (role) => {
      expect(
        hasEstablishmentPermission(context(role), 'establishment.profile.read'),
      ).toBe(true);
    },
  );

  it('allows owners and managers to edit but denies staff', () => {
    expect(
      hasEstablishmentPermission(
        context('OWNER'),
        'establishment.profile.manage',
      ),
    ).toBe(true);
    expect(
      hasEstablishmentPermission(
        context('MANAGER'),
        'establishment.profile.manage',
      ),
    ).toBe(true);
    expect(() =>
      requireEstablishmentPermission(
        context('STAFF'),
        'establishment.profile.manage',
      ),
    ).toThrow('Permission denied.');
  });

  it('allows only owners and managers to manage the weekly schedule', () => {
    expect(
      hasBookingPermission(context('OWNER'), 'booking.settings.manage'),
    ).toBe(true);
    expect(
      hasBookingPermission(context('MANAGER'), 'booking.settings.manage'),
    ).toBe(true);
    expect(
      hasBookingPermission(context('STAFF'), 'booking.settings.manage'),
    ).toBe(false);
  });
});
