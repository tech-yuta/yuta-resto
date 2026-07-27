import { hashPassword } from '@yuta/auth';
import type {
  ManageableEstablishment,
  MembershipStatus,
  OrganizationUser,
} from '@yuta/contracts/cloud-admin';
import type { TenantRole } from '@yuta/tenant';
import { and, asc, count, eq, inArray, isNull, ne } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import type { CloudDatabaseClient } from './client';
import {
  authAuditEvents,
  authSessions,
  establishments,
  tenantMemberships,
  users,
} from './schema';

export type TenantUserErrorCode =
  | 'ESTABLISHMENT_NOT_ALLOWED'
  | 'MEMBERSHIP_NOT_FOUND'
  | 'ROLE_NOT_ALLOWED'
  | 'CURRENT_MEMBERSHIP_LOCKED'
  | 'LAST_OWNER_REQUIRED'
  | 'USER_INACTIVE';

export class TenantUserError extends Error {
  constructor(
    message: string,
    public readonly code: TenantUserErrorCode,
  ) {
    super(message);
    this.name = 'TenantUserError';
  }
}

export function createTenantUserRepository(repositoryDb: CloudDatabaseClient) {
  async function listManageableEstablishments(input: {
    organizationId: string;
    establishmentId?: string;
  }): Promise<ManageableEstablishment[]> {
    const conditions = [
      eq(establishments.organizationId, input.organizationId),
      eq(establishments.status, 'active' as const),
    ];
    if (input.establishmentId) {
      conditions.push(eq(establishments.id, input.establishmentId));
    }
    return repositoryDb
      .select({ id: establishments.id, name: establishments.name })
      .from(establishments)
      .where(and(...conditions))
      .orderBy(asc(establishments.name));
  }

  async function listOrganizationUsers(input: {
    organizationId: string;
    establishmentIds: string[];
  }): Promise<OrganizationUser[]> {
    if (input.establishmentIds.length === 0) return [];
    const rows = await repositoryDb
      .select({
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        userIsActive: users.isActive,
        membershipId: tenantMemberships.id,
        establishmentId: establishments.id,
        establishmentName: establishments.name,
        role: tenantMemberships.role,
        status: tenantMemberships.status,
      })
      .from(tenantMemberships)
      .innerJoin(users, eq(users.id, tenantMemberships.userId))
      .innerJoin(
        establishments,
        and(
          eq(establishments.id, tenantMemberships.establishmentId),
          eq(establishments.organizationId, tenantMemberships.organizationId),
        ),
      )
      .where(
        and(
          eq(tenantMemberships.organizationId, input.organizationId),
          inArray(tenantMemberships.establishmentId, input.establishmentIds),
        ),
      )
      .orderBy(asc(users.name), asc(establishments.name));

    const usersById = new Map<string, OrganizationUser>();
    for (const row of rows) {
      const organizationUser = usersById.get(row.userId) ?? {
        id: row.userId,
        name: row.userName,
        email: row.userEmail,
        isActive: row.userIsActive,
        memberships: [],
      };
      organizationUser.memberships.push({
        id: row.membershipId,
        establishmentId: row.establishmentId,
        establishmentName: row.establishmentName,
        role: row.role,
        status: row.status,
      });
      usersById.set(row.userId, organizationUser);
    }
    return [...usersById.values()];
  }

  async function createOrAttachUser(input: {
    actorUserId: string;
    actorRole: 'owner' | 'admin';
    organizationId: string;
    allowedEstablishmentIds: string[];
    name: string;
    email: string;
    password: string;
    establishmentIds: string[];
    role: TenantRole;
  }): Promise<{ userId: string; created: boolean }> {
    assertRoleCanBeAssigned(input.actorRole, input.role);
    assertEstablishmentsAllowed(
      input.establishmentIds,
      input.allowedEstablishmentIds,
    );

    return repositoryDb.transaction(async (transaction) => {
      const establishmentRows = await transaction
        .select({ id: establishments.id })
        .from(establishments)
        .where(
          and(
            eq(establishments.organizationId, input.organizationId),
            eq(establishments.status, 'active'),
            inArray(establishments.id, input.establishmentIds),
          ),
        );
      if (establishmentRows.length !== input.establishmentIds.length) {
        throw new TenantUserError(
          'An establishment is outside the management scope.',
          'ESTABLISHMENT_NOT_ALLOWED',
        );
      }

      const [existingUser] = await transaction
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);
      let user = existingUser;
      const created = !user;
      if (user && !user.isActive) {
        throw new TenantUserError(
          'The existing user account is inactive.',
          'USER_INACTIVE',
        );
      }
      if (!user) {
        const [createdUser] = await transaction
          .insert(users)
          .values({
            id: uuidv7(),
            name: input.name,
            email: input.email,
            passwordHash: await hashPassword(input.password),
            isActive: true,
          })
          .returning();
        user = createdUser;
      }
      if (!created && user.id === input.actorUserId) {
        throw new TenantUserError(
          'The current user cannot modify itself through the attachment flow.',
          'CURRENT_MEMBERSHIP_LOCKED',
        );
      }

      const existingMemberships = await transaction
        .select({ role: tenantMemberships.role })
        .from(tenantMemberships)
        .where(
          and(
            eq(tenantMemberships.userId, user.id),
            eq(tenantMemberships.organizationId, input.organizationId),
            inArray(tenantMemberships.establishmentId, input.establishmentIds),
          ),
        );
      if (
        input.actorRole === 'admin' &&
        existingMemberships.some(
          (membership) =>
            membership.role === 'owner' || membership.role === 'admin',
        )
      ) {
        throw new TenantUserError(
          'An administrator cannot manage owner or administrator memberships.',
          'ROLE_NOT_ALLOWED',
        );
      }

      for (const establishmentId of input.establishmentIds) {
        await transaction
          .insert(tenantMemberships)
          .values({
            id: uuidv7(),
            userId: user.id,
            organizationId: input.organizationId,
            establishmentId,
            role: input.role,
            status: 'active',
          })
          .onConflictDoUpdate({
            target: [
              tenantMemberships.userId,
              tenantMemberships.organizationId,
              tenantMemberships.establishmentId,
            ],
            set: { role: input.role, status: 'active' },
          });
      }

      await transaction.insert(authAuditEvents).values({
        id: uuidv7(),
        event: created ? 'tenant.user.created' : 'tenant.user.attached',
        actorUserId: input.actorUserId,
        subjectUserId: user.id,
        organizationId: input.organizationId,
        metadata: {
          establishmentIds: input.establishmentIds,
          role: input.role,
        },
      });
      return { userId: user.id, created };
    });
  }

  async function updateMembership(input: {
    actorUserId: string;
    actorMembershipId: string;
    actorRole: 'owner' | 'admin';
    organizationId: string;
    allowedEstablishmentIds: string[];
    membershipId: string;
    role: TenantRole;
    status: Extract<MembershipStatus, 'active' | 'suspended'>;
  }): Promise<void> {
    assertRoleCanBeAssigned(input.actorRole, input.role);
    if (input.membershipId === input.actorMembershipId) {
      throw new TenantUserError(
        'The current membership cannot modify itself.',
        'CURRENT_MEMBERSHIP_LOCKED',
      );
    }

    await repositoryDb.transaction(async (transaction) => {
      const targetRows = await transaction
        .select({
          membership: tenantMemberships,
          establishmentOrganizationId: establishments.organizationId,
        })
        .from(tenantMemberships)
        .innerJoin(
          establishments,
          eq(establishments.id, tenantMemberships.establishmentId),
        )
        .where(
          and(
            eq(tenantMemberships.id, input.membershipId),
            eq(tenantMemberships.organizationId, input.organizationId),
            inArray(
              tenantMemberships.establishmentId,
              input.allowedEstablishmentIds,
            ),
          ),
        )
        .limit(1);
      const target = targetRows[0];
      if (
        !target ||
        target.establishmentOrganizationId !== input.organizationId ||
        !target.membership.establishmentId
      ) {
        throw new TenantUserError(
          'Membership not found in the management scope.',
          'MEMBERSHIP_NOT_FOUND',
        );
      }
      if (
        input.actorRole === 'admin' &&
        (target.membership.role === 'owner' ||
          target.membership.role === 'admin')
      ) {
        throw new TenantUserError(
          'An administrator cannot manage owner or administrator memberships.',
          'ROLE_NOT_ALLOWED',
        );
      }

      const removesOwner =
        target.membership.role === 'owner' &&
        (input.role !== 'owner' || input.status !== 'active');
      if (removesOwner) {
        const [ownerCount] = await transaction
          .select({ value: count() })
          .from(tenantMemberships)
          .where(
            and(
              eq(tenantMemberships.organizationId, input.organizationId),
              eq(tenantMemberships.role, 'owner'),
              eq(tenantMemberships.status, 'active'),
              ne(tenantMemberships.id, target.membership.id),
            ),
          );
        if ((ownerCount?.value ?? 0) === 0) {
          throw new TenantUserError(
            'The organization must retain an active owner.',
            'LAST_OWNER_REQUIRED',
          );
        }
      }

      await transaction
        .update(tenantMemberships)
        .set({ role: input.role, status: input.status })
        .where(eq(tenantMemberships.id, target.membership.id));

      if (input.status === 'suspended') {
        await transaction
          .update(authSessions)
          .set({ revokedAt: new Date() })
          .where(
            and(
              eq(authSessions.userId, target.membership.userId),
              eq(authSessions.organizationId, input.organizationId),
              eq(
                authSessions.establishmentId,
                target.membership.establishmentId,
              ),
              isNull(authSessions.revokedAt),
            ),
          );
      }

      await transaction.insert(authAuditEvents).values({
        id: uuidv7(),
        event: 'tenant.membership.updated',
        actorUserId: input.actorUserId,
        subjectUserId: target.membership.userId,
        organizationId: input.organizationId,
        establishmentId: target.membership.establishmentId,
        metadata: {
          previousRole: target.membership.role,
          previousStatus: target.membership.status,
          role: input.role,
          status: input.status,
        },
      });
    });
  }

  return {
    listManageableEstablishments,
    listOrganizationUsers,
    createOrAttachUser,
    updateMembership,
  };
}

function assertEstablishmentsAllowed(
  requestedIds: string[],
  allowedIds: string[],
): void {
  const requested = new Set(requestedIds);
  const allowed = new Set(allowedIds);
  if (
    requested.size === 0 ||
    requested.size !== requestedIds.length ||
    [...requested].some((id) => !allowed.has(id))
  ) {
    throw new TenantUserError(
      'An establishment is outside the management scope.',
      'ESTABLISHMENT_NOT_ALLOWED',
    );
  }
}

function assertRoleCanBeAssigned(
  actorRole: 'owner' | 'admin',
  role: TenantRole,
): void {
  if (actorRole === 'admin' && (role === 'owner' || role === 'admin')) {
    throw new TenantUserError(
      'An administrator cannot assign this role.',
      'ROLE_NOT_ALLOWED',
    );
  }
}
