import type { TenantFoundationPort, TenantRole } from '@yuta/tenant';
import { and, asc, count, eq, isNotNull, ne } from 'drizzle-orm';
import type { CloudDatabaseClient } from './client';
import { establishments, organizations, tenantMemberships } from './schema';

type FoundationDatabase = Pick<
  CloudDatabaseClient,
  'select' | 'update' | 'transaction'
>;

export function createTenantFoundationRepository(
  repositoryDb: FoundationDatabase,
): TenantFoundationPort {
  return {
    async listAccessibleTenants(userId) {
      return repositoryDb
        .select({
          organizationId: organizations.id,
          organizationName: organizations.name,
          establishmentId: establishments.id,
          establishmentName: establishments.name,
          establishmentSlug: establishments.slug,
          membershipId: tenantMemberships.id,
          role: tenantMemberships.role,
        })
        .from(tenantMemberships)
        .innerJoin(
          organizations,
          eq(organizations.id, tenantMemberships.organizationId),
        )
        .innerJoin(
          establishments,
          and(
            eq(establishments.id, tenantMemberships.establishmentId),
            eq(establishments.organizationId, tenantMemberships.organizationId),
          ),
        )
        .where(
          and(
            eq(tenantMemberships.userId, userId),
            eq(tenantMemberships.status, 'active'),
            isNotNull(tenantMemberships.establishmentId),
            eq(organizations.status, 'active'),
            eq(establishments.status, 'active'),
          ),
        )
        .orderBy(asc(organizations.name), asc(establishments.name));
    },

    async findTenantMembership(input) {
      const target = input.establishmentId
        ? eq(establishments.id, input.establishmentId)
        : input.establishmentSlug
          ? eq(establishments.slug, input.establishmentSlug)
          : undefined;
      if (!target) return null;
      const [row] = await repositoryDb
        .select({
          organizationId: organizations.id,
          establishmentId: establishments.id,
          tenantSlug: establishments.slug,
          tenantName: establishments.name,
          userId: tenantMemberships.userId,
          membershipId: tenantMemberships.id,
          role: tenantMemberships.role,
          tenantStatus: establishments.status,
          organizationStatus: organizations.status,
          membershipStatus: tenantMemberships.status,
        })
        .from(tenantMemberships)
        .innerJoin(
          organizations,
          eq(organizations.id, tenantMemberships.organizationId),
        )
        .innerJoin(
          establishments,
          and(
            eq(establishments.id, tenantMemberships.establishmentId),
            eq(establishments.organizationId, tenantMemberships.organizationId),
          ),
        )
        .where(and(eq(tenantMemberships.userId, input.userId), target))
        .limit(1);
      if (!row) return null;
      return {
        organizationId: row.organizationId,
        establishmentId: row.establishmentId,
        tenantSlug: row.tenantSlug,
        tenantName: row.tenantName,
        userId: row.userId,
        membershipId: row.membershipId,
        role: row.role,
        tenantStatus:
          row.tenantStatus === 'active' && row.organizationStatus === 'active'
            ? 'active'
            : 'disabled',
        membershipStatus:
          row.membershipStatus === 'active' ? 'active' : 'suspended',
      };
    },

    async findMembershipForUpdate(input) {
      const [membership] = await repositoryDb
        .select({
          id: tenantMemberships.id,
          userId: tenantMemberships.userId,
          role: tenantMemberships.role,
          status: tenantMemberships.status,
        })
        .from(tenantMemberships)
        .where(
          and(
            eq(tenantMemberships.id, input.membershipId),
            eq(tenantMemberships.organizationId, input.organizationId),
            eq(tenantMemberships.establishmentId, input.establishmentId),
          ),
        )
        .limit(1)
        .for('update');
      if (!membership) return null;
      return {
        ...membership,
        status: membership.status === 'active' ? 'active' : 'suspended',
      };
    },

    async countOtherActiveOwners(input) {
      const [result] = await repositoryDb
        .select({ value: count() })
        .from(tenantMemberships)
        .where(
          and(
            eq(tenantMemberships.organizationId, input.organizationId),
            eq(tenantMemberships.establishmentId, input.establishmentId),
            eq(tenantMemberships.role, 'OWNER'),
            eq(tenantMemberships.status, 'active'),
            ne(tenantMemberships.id, input.membershipId),
          ),
        );
      return result?.value ?? 0;
    },

    async updateMembership(input) {
      const values: { role?: TenantRole; status?: 'active' | 'suspended' } = {};
      if (input.role !== undefined) values.role = input.role;
      if (input.status !== undefined) values.status = input.status;
      await repositoryDb
        .update(tenantMemberships)
        .set(values)
        .where(
          and(
            eq(tenantMemberships.id, input.membershipId),
            eq(tenantMemberships.organizationId, input.organizationId),
            eq(tenantMemberships.establishmentId, input.establishmentId),
          ),
        );
    },

    async transaction(operation) {
      return repositoryDb.transaction(async (transaction) =>
        operation(
          createTenantFoundationRepository(
            transaction as unknown as FoundationDatabase,
          ),
        ),
      );
    },
  };
}
