import { createAuthService, DisabledUserError } from '@yuta/auth';
import {
  LastOwnerError,
  MembershipNotFoundError,
  MembershipSuspendedError,
  createTenantService,
} from '@yuta/tenant';
import { config } from 'dotenv';
import { eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { createInternalUserLookup } from '../src/auth-repository';
import {
  createCloudDatabaseClient,
  type CloudDatabaseClient,
} from '../src/client';
import { createTenantFoundationRepository } from '../src/tenant-foundation-repository';
import {
  establishments,
  organizations,
  tenantMemberships,
  users,
} from '../src/schema';

config({ path: '.env.test' });
config({ path: '.env.local' });

const integrationTest =
  process.env.CLOUD_DATABASE_URL &&
  process.env.YUTA_ALLOW_DATABASE_INTEGRATION_TESTS === 'true'
    ? describe
    : describe.skip;

integrationTest('tenant and user foundation integration', () => {
  let db: CloudDatabaseClient;
  const organizationAId = uuidv7();
  const organizationBId = uuidv7();
  const establishmentAId = uuidv7();
  const establishmentBId = uuidv7();
  const userAId = uuidv7();
  const userBId = uuidv7();
  const multiUserId = uuidv7();
  const suspendedUserId = uuidv7();
  const disabledUserId = uuidv7();
  const ownerMembershipAId = uuidv7();
  const ownerMembershipBId = uuidv7();
  const membershipIds = [
    ownerMembershipAId,
    ownerMembershipBId,
    uuidv7(),
    uuidv7(),
    uuidv7(),
  ];
  const userIds = [
    userAId,
    userBId,
    multiUserId,
    suspendedUserId,
    disabledUserId,
  ];

  beforeAll(async () => {
    db = createCloudDatabaseClient(process.env);
    await db.insert(organizations).values([
      {
        id: organizationAId,
        name: 'Tenant A',
        slug: `tenant-a-${organizationAId}`,
      },
      {
        id: organizationBId,
        name: 'Tenant B',
        slug: `tenant-b-${organizationBId}`,
      },
    ]);
    await db.insert(establishments).values([
      {
        id: establishmentAId,
        organizationId: organizationAId,
        name: 'Restaurant A',
        slug: `restaurant-a-${establishmentAId}`,
      },
      {
        id: establishmentBId,
        organizationId: organizationBId,
        name: 'Restaurant B',
        slug: `restaurant-b-${establishmentBId}`,
      },
    ]);
    await db.insert(users).values(
      userIds.map((id, index) => ({
        id,
        authProviderId: `integration:${id}`,
        displayName: `Integration user ${index}`,
        email: `tenant-foundation-${id}@example.test`,
        status:
          id === disabledUserId ? ('DISABLED' as const) : ('ACTIVE' as const),
      })),
    );
    await db.insert(tenantMemberships).values([
      {
        id: ownerMembershipAId,
        userId: userAId,
        organizationId: organizationAId,
        establishmentId: establishmentAId,
        role: 'OWNER',
      },
      {
        id: ownerMembershipBId,
        userId: userBId,
        organizationId: organizationBId,
        establishmentId: establishmentBId,
        role: 'OWNER',
      },
      {
        id: membershipIds[2]!,
        userId: multiUserId,
        organizationId: organizationAId,
        establishmentId: establishmentAId,
        role: 'MANAGER',
      },
      {
        id: membershipIds[3]!,
        userId: multiUserId,
        organizationId: organizationBId,
        establishmentId: establishmentBId,
        role: 'STAFF',
      },
      {
        id: membershipIds[4]!,
        userId: suspendedUserId,
        organizationId: organizationAId,
        establishmentId: establishmentAId,
        role: 'STAFF',
        status: 'suspended',
      },
    ]);
  });

  afterAll(async () => {
    if (!db) return;
    await db
      .delete(tenantMemberships)
      .where(inArray(tenantMemberships.id, membershipIds));
    await db.delete(users).where(inArray(users.id, userIds));
    await db
      .delete(establishments)
      .where(inArray(establishments.id, [establishmentAId, establishmentBId]));
    await db
      .delete(organizations)
      .where(inArray(organizations.id, [organizationAId, organizationBId]));
    await db.$client.end({ timeout: 5 });
  });

  it('resolves only authorized tenants for single and multi-tenant users', async () => {
    const service = createTenantService(createTenantFoundationRepository(db));
    await expect(
      service.resolveContext({ userId: userAId }),
    ).resolves.toMatchObject({ establishmentId: establishmentAId });
    await expect(
      service.resolveContext({ userId: userAId, tenantId: establishmentBId }),
    ).rejects.toBeInstanceOf(MembershipNotFoundError);
    await expect(
      service.getAccessibleTenants(multiUserId),
    ).resolves.toHaveLength(2);
    await expect(
      service.resolveContext({
        userId: multiUserId,
        tenantId: establishmentBId,
      }),
    ).resolves.toMatchObject({ role: 'STAFF' });
  });

  it('rejects suspended membership and disabled internal users', async () => {
    const service = createTenantService(createTenantFoundationRepository(db));
    await expect(
      service.resolveContext({
        userId: suspendedUserId,
        tenantId: establishmentAId,
      }),
    ).rejects.toBeInstanceOf(MembershipSuspendedError);

    const auth = createAuthService(
      {
        getIdentity: async () => ({
          providerUserId: `integration:${disabledUserId}`,
          email: `tenant-foundation-${disabledUserId}@example.test`,
        }),
      },
      createInternalUserLookup(db),
    );
    await expect(auth.getCurrentUser()).rejects.toBeInstanceOf(
      DisabledUserError,
    );
  });

  it('does not suspend the final active restaurant owner', async () => {
    const service = createTenantService(createTenantFoundationRepository(db));
    const context = await service.resolveContext({ userId: userAId });
    await expect(
      service.suspendMembership({
        actingContext: context,
        membershipId: ownerMembershipAId,
      }),
    ).rejects.toBeInstanceOf(LastOwnerError);
    const [owner] = await db
      .select({ status: tenantMemberships.status })
      .from(tenantMemberships)
      .where(eq(tenantMemberships.id, ownerMembershipAId));
    expect(owner?.status).toBe('active');
  });

  it('cannot mutate a membership from another tenant', async () => {
    const service = createTenantService(createTenantFoundationRepository(db));
    const context = await service.resolveContext({ userId: userAId });
    await expect(
      service.changeMembershipRole({
        actingContext: context,
        membershipId: ownerMembershipBId,
        role: 'STAFF',
      }),
    ).rejects.toBeInstanceOf(MembershipNotFoundError);
    const [tenantBOwner] = await db
      .select({ role: tenantMemberships.role })
      .from(tenantMemberships)
      .where(eq(tenantMemberships.id, ownerMembershipBId));
    expect(tenantBOwner?.role).toBe('OWNER');
  });
});
