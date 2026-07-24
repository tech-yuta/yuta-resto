import { and, eq, isNull } from 'drizzle-orm';
import type {
  DomainLookupPort,
  DomainTenantRecord,
  EstablishmentLookupPort,
  MembershipLookupPort,
  MembershipRecord,
  PublicTenantContext,
  TenantContext,
} from '@yuta/tenant';
import type { DbClient } from './client';
import {
  establishments,
  organizations,
  tenantDomains,
  tenantEntitlements,
  tenantMemberships,
} from './schema';

export function createDomainLookup(db: DbClient): DomainLookupPort {
  return {
    async findActiveByHostname(hostname): Promise<DomainTenantRecord | null> {
      const rows = await db
        .select({
          organizationId: tenantDomains.organizationId,
          establishmentId: tenantDomains.establishmentId,
          domainStatus: tenantDomains.status,
          organizationStatus: organizations.status,
          establishmentStatus: establishments.status,
          locale: establishments.locale,
          timezone: establishments.timezone,
        })
        .from(tenantDomains)
        .innerJoin(
          organizations,
          eq(organizations.id, tenantDomains.organizationId),
        )
        .innerJoin(
          establishments,
          eq(establishments.id, tenantDomains.establishmentId),
        )
        .where(eq(tenantDomains.hostname, hostname))
        .limit(1);
      const tenant = rows[0];
      if (!tenant) return null;
      return {
        organizationId: tenant.organizationId,
        establishmentId: tenant.establishmentId,
        hostname,
        status:
          tenant.domainStatus === 'active' &&
          tenant.organizationStatus === 'active' &&
          tenant.establishmentStatus === 'active'
            ? 'active'
            : 'disabled',
        locale: tenant.locale,
        timezone: tenant.timezone,
        entitlements: await getEntitlements(
          db,
          tenant.organizationId,
          tenant.establishmentId,
        ),
      };
    },
  };
}

export function createMembershipLookup(db: DbClient): MembershipLookupPort {
  return {
    async findActiveMembership(input): Promise<MembershipRecord | null> {
      const conditions = [
        eq(tenantMemberships.userId, input.userId),
        eq(tenantMemberships.organizationId, input.organizationId),
      ];
      conditions.push(
        input.establishmentId
          ? eq(tenantMemberships.establishmentId, input.establishmentId)
          : isNull(tenantMemberships.establishmentId),
      );
      const rows = await db
        .select({
          membership: tenantMemberships,
          organizationStatus: organizations.status,
          establishmentStatus: establishments.status,
        })
        .from(tenantMemberships)
        .innerJoin(
          organizations,
          eq(organizations.id, tenantMemberships.organizationId),
        )
        .leftJoin(
          establishments,
          eq(establishments.id, tenantMemberships.establishmentId),
        )
        .where(and(...conditions))
        .limit(1);
      const result = rows[0];
      if (!result) return null;
      return {
        membershipId: result.membership.id,
        userId: result.membership.userId,
        organizationId: result.membership.organizationId,
        establishmentId: result.membership.establishmentId,
        role: result.membership.role,
        status:
          result.membership.status === 'active' &&
          result.organizationStatus === 'active' &&
          (!result.establishmentStatus ||
            result.establishmentStatus === 'active')
            ? 'active'
            : 'suspended',
      };
    },
  };
}

export function createEstablishmentLookup(
  db: DbClient,
): EstablishmentLookupPort {
  return {
    async belongsToOrganization(input) {
      const rows = await db
        .select({ id: establishments.id })
        .from(establishments)
        .where(
          and(
            eq(establishments.id, input.establishmentId),
            eq(establishments.organizationId, input.organizationId),
            eq(establishments.status, 'active'),
          ),
        )
        .limit(1);
      return Boolean(rows[0]);
    },
  };
}

export async function findScopedEstablishment(
  db: DbClient,
  context: TenantContext | PublicTenantContext,
) {
  if (!context.establishmentId) return null;
  const rows = await db
    .select()
    .from(establishments)
    .where(
      and(
        eq(establishments.id, context.establishmentId),
        eq(establishments.organizationId, context.organizationId),
        eq(establishments.status, 'active'),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function findAuthenticatedTenantMetadata(
  db: DbClient,
  scope: { organizationId: string; establishmentId: string },
): Promise<{
  locale: string;
  timezone: string;
  entitlements: string[];
} | null> {
  const rows = await db
    .select({
      locale: establishments.locale,
      timezone: establishments.timezone,
    })
    .from(establishments)
    .innerJoin(
      organizations,
      eq(organizations.id, establishments.organizationId),
    )
    .where(
      and(
        eq(establishments.id, scope.establishmentId),
        eq(establishments.organizationId, scope.organizationId),
        eq(establishments.status, 'active'),
        eq(organizations.status, 'active'),
      ),
    )
    .limit(1);
  const metadata = rows[0];
  if (!metadata) return null;
  return {
    ...metadata,
    entitlements: await getEntitlements(
      db,
      scope.organizationId,
      scope.establishmentId,
    ),
  };
}

async function getEntitlements(
  db: DbClient,
  organizationId: string,
  establishmentId: string,
): Promise<string[]> {
  const rows = await db
    .select({ key: tenantEntitlements.key })
    .from(tenantEntitlements)
    .where(
      and(
        eq(tenantEntitlements.organizationId, organizationId),
        eq(tenantEntitlements.establishmentId, establishmentId),
        eq(tenantEntitlements.enabled, true),
      ),
    );
  return rows.map((row) => row.key);
}
