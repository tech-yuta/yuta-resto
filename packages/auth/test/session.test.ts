import { describe, expect, it } from 'vitest';
import {
  DisabledUserError,
  ForbiddenError,
  UnauthenticatedError,
  createAuthService,
  type AuthenticatedIdentity,
} from '../src';

const identity: AuthenticatedIdentity = {
  providerUserId: 'provider-user-1',
  email: 'owner@example.test',
};

describe('auth provider adapter', () => {
  it('maps an external identity to the normalized internal session user', async () => {
    const service = createAuthService(
      { getIdentity: async () => identity },
      {
        findByAuthProviderId: async () => ({
          id: '11111111-1111-4111-8111-111111111111',
          email: 'owner@example.test',
          displayName: 'Owner',
          status: 'ACTIVE',
          systemRole: null,
        }),
      },
    );
    await expect(service.requireUser()).resolves.toMatchObject({
      displayName: 'Owner',
    });
  });

  it('rejects missing identities and disabled users', async () => {
    const missing = createAuthService(
      { getIdentity: async () => null },
      { findByAuthProviderId: async () => null },
    );
    await expect(missing.requireUser()).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );

    const disabled = createAuthService(
      { getIdentity: async () => identity },
      {
        findByAuthProviderId: async () => ({
          id: '11111111-1111-4111-8111-111111111111',
          email: identity.email,
          displayName: null,
          status: 'DISABLED',
          systemRole: null,
        }),
      },
    );
    await expect(disabled.getCurrentUser()).rejects.toBeInstanceOf(
      DisabledUserError,
    );
  });

  it('keeps system roles separate and checks them explicitly', async () => {
    const service = createAuthService(
      { getIdentity: async () => identity },
      {
        findByAuthProviderId: async () => ({
          id: '11111111-1111-4111-8111-111111111111',
          email: identity.email,
          displayName: null,
          status: 'ACTIVE',
          systemRole: 'YUTA_SUPPORT',
        }),
      },
    );
    await expect(
      service.requireSystemRole(['YUTA_ADMIN']),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      service.requireSystemRole(['YUTA_SUPPORT']),
    ).resolves.toMatchObject({ systemRole: 'YUTA_SUPPORT' });
  });
});
