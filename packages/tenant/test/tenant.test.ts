import { describe, expect, it } from 'vitest';
import {
  TenantError,
  assertEstablishmentScope,
  normalizeHostname,
  requireEntitlement,
  requireEstablishment,
  resolveAuthenticatedTenant,
  resolvePublicTenant,
  type DomainLookupPort,
  type MembershipLookupPort,
  type TenantContext,
} from '../src';

const organizationId = '11111111-1111-4111-8111-111111111111';
const establishmentId = '22222222-2222-4222-8222-222222222222';
const membershipId = '33333333-3333-4333-8333-333333333333';

describe('@yuta/tenant', () => {
  it('normalizes case, port, and trailing dot and rejects URLs', () => {
    expect(normalizeHostname('LUNA.LOCALHOST.:3000')).toBe('luna.localhost');
    expect(() => normalizeHostname('https://luna.localhost')).toThrowError(
      expect.objectContaining({ code: 'INVALID_HOSTNAME' }),
    );
  });

  it('resolves a public domain and fails closed for unknown or mismatched hosts', async () => {
    const lookup: DomainLookupPort = {
      findActiveByHostname: async (hostname) =>
        hostname === 'luna.localhost'
          ? {
              organizationId,
              establishmentId,
              hostname,
              status: 'active',
              locale: 'fr-FR',
              timezone: 'Europe/Paris',
              entitlements: ['reservations.enabled'],
            }
          : null,
    };
    const context = await resolvePublicTenant({
      hostname: 'LUNA.LOCALHOST:3000',
      domainLookup: lookup,
    });
    expect(context.hostname).toBe('luna.localhost');
    expect(() => requireEntitlement(context, 'inventory.enabled')).toThrowError(
      expect.objectContaining({ code: 'FEATURE_NOT_ENABLED' }),
    );
    await expect(
      resolvePublicTenant({
        hostname: 'unknown.localhost',
        domainLookup: lookup,
      }),
    ).rejects.toMatchObject({ code: 'TENANT_NOT_FOUND' });
  });

  it('uses trusted membership fields and rejects cross-tenant scope', async () => {
    const lookup: MembershipLookupPort = {
      findActiveMembership: async () => ({
        membershipId,
        userId: organizationId,
        organizationId,
        establishmentId,
        role: 'manager',
        status: 'active',
      }),
    };
    const context = await resolveAuthenticatedTenant({
      userId: organizationId,
      organizationId,
      establishmentId,
      membershipLookup: lookup,
      tenantMetadata: {
        locale: 'fr-FR',
        timezone: 'Europe/Paris',
        entitlements: [],
      },
    });
    expect(context.actor).toMatchObject({ role: 'manager', membershipId });
    expect(() =>
      assertEstablishmentScope({
        context,
        resourceOrganizationId: organizationId,
        resourceEstablishmentId: membershipId,
      }),
    ).toThrowError(
      expect.objectContaining({ code: 'CROSS_TENANT_ACCESS_DENIED' }),
    );
  });

  it('requires an establishment for location-specific work', () => {
    const context: TenantContext = {
      organizationId,
      establishmentId: null,
      actor: { type: 'service', serviceName: 'reporting' },
      locale: 'fr-FR',
      timezone: 'Europe/Paris',
      entitlements: new Set(),
    };
    expect(() => requireEstablishment(context)).toThrowError(
      expect.objectContaining({ code: 'ESTABLISHMENT_REQUIRED' }),
    );
  });
});
