import { describe, expect, it } from 'vitest';
import {
  LastOwnerError,
  MembershipNotFoundError,
  MembershipSuspendedError,
  TenantRoleForbiddenError,
  TenantSuspendedError,
  TenantSelectionRequiredError,
  createTenantService,
  hasTenantRole,
  normalizeTenantSlug,
  type AccessibleTenant,
  type TenantFoundationPort,
} from '../src';

const userId = '11111111-1111-4111-8111-111111111111';
const organizationId = '22222222-2222-4222-8222-222222222222';
const luna: AccessibleTenant = {
  organizationId,
  organizationName: 'LUNA',
  establishmentId: '33333333-3333-4333-8333-333333333333',
  establishmentName: 'LUNA',
  establishmentSlug: 'luna',
  membershipId: '44444444-4444-4444-8444-444444444444',
  role: 'OWNER',
};
const second: AccessibleTenant = {
  ...luna,
  establishmentId: '55555555-5555-4555-8555-555555555555',
  establishmentName: 'Second',
  establishmentSlug: 'second',
  membershipId: '66666666-6666-4666-8666-666666666666',
  role: 'MANAGER',
};

describe('tenant foundation', () => {
  it('normalizes slugs and matches roles explicitly', () => {
    expect(normalizeTenantSlug(' LUNA-PARIS ')).toBe('luna-paris');
    expect(hasTenantRole('MANAGER', ['OWNER', 'MANAGER'])).toBe(true);
    expect(hasTenantRole('STAFF', ['OWNER', 'MANAGER'])).toBe(false);
  });

  it('uses the sole active membership and otherwise requires selection', async () => {
    const single = createTenantService(createPort([luna]));
    await expect(single.resolveContext({ userId })).resolves.toMatchObject({
      tenantSlug: 'luna',
    });
    const multiple = createTenantService(createPort([luna, second]));
    await expect(multiple.resolveContext({ userId })).rejects.toBeInstanceOf(
      TenantSelectionRequiredError,
    );
  });

  it('prioritizes the trusted route tenant over the active-tenant cookie', async () => {
    const service = createTenantService(createPort([luna, second]));
    await expect(
      service.resolveContext({
        userId,
        tenantSlug: 'luna',
        activeTenantId: second.establishmentId,
      }),
    ).resolves.toMatchObject({ establishmentId: luna.establishmentId });
  });

  it('rejects an unauthorized tenant selection', async () => {
    const service = createTenantService(createPort([luna]));
    await expect(
      service.resolveContext({
        userId,
        tenantId: '77777777-7777-4777-8777-777777777777',
      }),
    ).rejects.toBeInstanceOf(MembershipNotFoundError);
  });

  it('distinguishes suspended tenants and memberships', async () => {
    const basePort = createPort([luna]);
    const suspendedMembership = createTenantService({
      ...basePort,
      findTenantMembership: async () => ({
        ...toContext(luna),
        tenantStatus: 'active',
        membershipStatus: 'suspended',
      }),
    });
    await expect(
      suspendedMembership.resolveContext({ userId, tenantSlug: 'luna' }),
    ).rejects.toBeInstanceOf(MembershipSuspendedError);

    const suspendedTenant = createTenantService({
      ...basePort,
      findTenantMembership: async () => ({
        ...toContext(luna),
        tenantStatus: 'disabled',
        membershipStatus: 'active',
      }),
    });
    await expect(
      suspendedTenant.resolveContext({ userId, tenantSlug: 'luna' }),
    ).rejects.toBeInstanceOf(TenantSuspendedError);
  });

  it('protects the final active owner', async () => {
    const port = createPort([luna]);
    const service = createTenantService(port);
    await expect(
      service.suspendMembership({
        actingContext: toContext(luna),
        membershipId: luna.membershipId,
      }),
    ).rejects.toBeInstanceOf(LastOwnerError);
  });

  it('allows managers to manage staff only', async () => {
    const port = createPort([second], {
      id: luna.membershipId,
      userId,
      role: 'MANAGER',
      status: 'active',
    });
    const service = createTenantService(port);
    await expect(
      service.changeMembershipRole({
        actingContext: { ...toContext(second), role: 'MANAGER' },
        membershipId: luna.membershipId,
        role: 'OWNER',
      }),
    ).rejects.toBeInstanceOf(TenantRoleForbiddenError);
  });
});

function createPort(
  tenants: AccessibleTenant[],
  target: Awaited<
    ReturnType<TenantFoundationPort['findMembershipForUpdate']>
  > = {
    id: luna.membershipId,
    userId,
    role: 'OWNER' as const,
    status: 'active' as const,
  },
): TenantFoundationPort {
  const port: TenantFoundationPort = {
    listAccessibleTenants: async () => tenants,
    findTenantMembership: async (input) => {
      const tenant = tenants.find(
        (item) =>
          item.establishmentId === input.establishmentId ||
          item.establishmentSlug === input.establishmentSlug,
      );
      return tenant
        ? {
            ...toContext(tenant),
            tenantStatus: 'active',
            membershipStatus: 'active',
          }
        : null;
    },
    findMembershipForUpdate: async () => target,
    countOtherActiveOwners: async () => 0,
    updateMembership: async () => undefined,
    transaction: async (operation) => operation(port),
  };
  return port;
}

function toContext(tenant: AccessibleTenant) {
  return {
    organizationId: tenant.organizationId,
    establishmentId: tenant.establishmentId,
    tenantSlug: tenant.establishmentSlug,
    tenantName: tenant.establishmentName,
    userId,
    membershipId: tenant.membershipId,
    role: tenant.role,
  };
}
