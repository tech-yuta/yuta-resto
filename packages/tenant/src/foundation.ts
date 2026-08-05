import { z } from 'zod';
import type { TenantRole } from './index';

export class TenantNotFoundError extends Error {
  constructor() {
    super('Tenant not found.');
    this.name = 'TenantNotFoundError';
  }
}
export class TenantSuspendedError extends Error {
  constructor() {
    super('Tenant is not active.');
    this.name = 'TenantSuspendedError';
  }
}
export class MembershipNotFoundError extends Error {
  constructor() {
    super('An active tenant membership is required.');
    this.name = 'MembershipNotFoundError';
  }
}
export class MembershipSuspendedError extends Error {
  constructor() {
    super('The tenant membership is suspended.');
    this.name = 'MembershipSuspendedError';
  }
}
export class TenantSelectionRequiredError extends Error {
  constructor() {
    super('An active tenant must be selected.');
    this.name = 'TenantSelectionRequiredError';
  }
}
export class LastOwnerError extends Error {
  constructor() {
    super('The tenant must retain at least one active owner.');
    this.name = 'LastOwnerError';
  }
}
export class TenantRoleForbiddenError extends Error {
  constructor() {
    super('The tenant role does not permit this action.');
    this.name = 'TenantRoleForbiddenError';
  }
}

export const tenantSlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export function normalizeTenantSlug(value: string): string {
  return tenantSlugSchema.parse(value.trim().toLowerCase());
}

export function hasTenantRole(
  role: TenantRole,
  allowedRoles: readonly TenantRole[],
): boolean {
  return allowedRoles.includes(role);
}

export const tenantPermissions = {
  manageTenantSettings: ['OWNER'],
  manageMembers: ['OWNER', 'MANAGER'],
  viewMembers: ['OWNER', 'MANAGER'],
  useOperationalModules: ['OWNER', 'MANAGER', 'STAFF'],
} as const satisfies Record<string, readonly TenantRole[]>;

export type AccessibleTenant = Readonly<{
  organizationId: string;
  organizationName: string;
  establishmentId: string;
  establishmentName: string;
  establishmentSlug: string;
  membershipId: string;
  role: TenantRole;
}>;

export type ResolvedTenantContext = Readonly<{
  organizationId: string;
  establishmentId: string;
  tenantSlug: string;
  tenantName: string;
  userId: string;
  membershipId: string;
  role: TenantRole;
}>;

export interface TenantFoundationPort {
  listAccessibleTenants(userId: string): Promise<AccessibleTenant[]>;
  findTenantMembership(input: {
    userId: string;
    establishmentId?: string;
    establishmentSlug?: string;
  }): Promise<
    | (ResolvedTenantContext & {
        tenantStatus: 'active' | 'disabled';
        membershipStatus: 'active' | 'suspended';
      })
    | null
  >;
  findMembershipForUpdate(input: {
    organizationId: string;
    establishmentId: string;
    membershipId: string;
  }): Promise<{
    id: string;
    userId: string;
    role: TenantRole;
    status: 'active' | 'suspended';
  } | null>;
  countOtherActiveOwners(input: {
    organizationId: string;
    establishmentId: string;
    membershipId: string;
  }): Promise<number>;
  updateMembership(input: {
    membershipId: string;
    organizationId: string;
    establishmentId: string;
    role?: TenantRole;
    status?: 'active' | 'suspended';
  }): Promise<void>;
  transaction<T>(
    operation: (port: TenantFoundationPort) => Promise<T>,
  ): Promise<T>;
}

export interface TenantSecurityLogger {
  warn(event: {
    event: string;
    userId: string;
    tenantId?: string;
    reason: string;
  }): void;
}

export function createTenantService(
  port: TenantFoundationPort,
  logger?: TenantSecurityLogger,
) {
  async function getAccessibleTenants(
    userId: string,
  ): Promise<AccessibleTenant[]> {
    return port.listAccessibleTenants(userId);
  }

  async function resolveContext(input: {
    userId: string;
    tenantId?: string;
    tenantSlug?: string;
    activeTenantId?: string;
  }): Promise<ResolvedTenantContext> {
    const accessible = await port.listAccessibleTenants(input.userId);
    const requestedId =
      input.tenantId ?? (input.tenantSlug ? undefined : input.activeTenantId);
    const requestedSlug = input.tenantSlug
      ? normalizeTenantSlug(input.tenantSlug)
      : undefined;

    if (!requestedId && !requestedSlug) {
      if (accessible.length !== 1) {
        logger?.warn({
          event: 'tenant.selection_required',
          userId: input.userId,
          reason:
            accessible.length === 0 ? 'no_membership' : 'multiple_memberships',
        });
        throw new TenantSelectionRequiredError();
      }
      const onlyTenant = accessible[0];
      if (!onlyTenant) throw new TenantSelectionRequiredError();
      return toResolvedContext(input.userId, onlyTenant);
    }

    const result = await port.findTenantMembership({
      userId: input.userId,
      establishmentId: requestedId,
      establishmentSlug: requestedSlug,
    });
    if (!result) {
      logger?.warn({
        event: 'tenant.membership_denied',
        userId: input.userId,
        tenantId: requestedId,
        reason: 'membership_not_found',
      });
      throw new MembershipNotFoundError();
    }
    if (result.tenantStatus !== 'active') {
      logger?.warn({
        event: 'tenant.access_denied',
        userId: input.userId,
        tenantId: result.establishmentId,
        reason: 'tenant_inactive',
      });
      throw new TenantSuspendedError();
    }
    if (result.membershipStatus !== 'active') {
      logger?.warn({
        event: 'tenant.membership_denied',
        userId: input.userId,
        tenantId: result.establishmentId,
        reason: 'membership_suspended',
      });
      throw new MembershipSuspendedError();
    }
    const {
      tenantStatus: _tenantStatus,
      membershipStatus: _status,
      ...context
    } = result;
    return context;
  }

  async function changeMembershipRole(input: {
    actingContext: ResolvedTenantContext;
    membershipId: string;
    role: TenantRole;
  }): Promise<void> {
    await mutateMembership(input.actingContext, input.membershipId, {
      role: input.role,
    });
  }

  async function suspendMembership(input: {
    actingContext: ResolvedTenantContext;
    membershipId: string;
  }): Promise<void> {
    await mutateMembership(input.actingContext, input.membershipId, {
      status: 'suspended',
    });
  }

  async function requireTenantRole(
    allowedRoles: readonly TenantRole[],
    input: {
      userId: string;
      tenantId?: string;
      tenantSlug?: string;
      activeTenantId?: string;
    },
  ): Promise<ResolvedTenantContext> {
    const context = await resolveContext(input);
    if (!hasTenantRole(context.role, allowedRoles)) {
      logger?.warn({
        event: 'tenant.role_denied',
        userId: context.userId,
        tenantId: context.establishmentId,
        reason: 'role_not_allowed',
      });
      throw new TenantRoleForbiddenError();
    }
    return context;
  }

  async function mutateMembership(
    actingContext: ResolvedTenantContext,
    membershipId: string,
    change: { role?: TenantRole; status?: 'suspended' },
  ): Promise<void> {
    await port.transaction(async (transactionPort) => {
      const target = await transactionPort.findMembershipForUpdate({
        organizationId: actingContext.organizationId,
        establishmentId: actingContext.establishmentId,
        membershipId,
      });
      if (!target) throw new MembershipNotFoundError();
      assertMemberManagementAllowed(
        actingContext.role,
        target.role,
        change.role,
      );

      const removesOwner =
        target.role === 'OWNER' &&
        ((change.role !== undefined && change.role !== 'OWNER') ||
          change.status === 'suspended');
      if (removesOwner) {
        const otherOwners = await transactionPort.countOtherActiveOwners({
          organizationId: actingContext.organizationId,
          establishmentId: actingContext.establishmentId,
          membershipId,
        });
        if (otherOwners === 0) throw new LastOwnerError();
      }
      await transactionPort.updateMembership({
        membershipId,
        organizationId: actingContext.organizationId,
        establishmentId: actingContext.establishmentId,
        ...change,
      });
    });
  }

  return {
    getAccessibleTenants,
    resolveContext,
    requireTenant: resolveContext,
    requireTenantRole,
    changeMembershipRole,
    suspendMembership,
  };
}

export function tenantErrorStatus(error: unknown): number | null {
  if (error instanceof TenantNotFoundError) return 404;
  if (
    error instanceof TenantSuspendedError ||
    error instanceof MembershipNotFoundError ||
    error instanceof MembershipSuspendedError ||
    error instanceof TenantRoleForbiddenError
  ) {
    return 403;
  }
  if (
    error instanceof TenantSelectionRequiredError ||
    error instanceof LastOwnerError
  ) {
    return 409;
  }
  return null;
}

function assertMemberManagementAllowed(
  actorRole: TenantRole,
  targetRole: TenantRole,
  nextRole?: TenantRole,
): void {
  if (
    actorRole === 'MANAGER' &&
    targetRole === 'STAFF' &&
    (nextRole === undefined || nextRole === 'STAFF')
  ) {
    return;
  }
  if (actorRole === 'OWNER') return;
  throw new TenantRoleForbiddenError();
}

function toResolvedContext(
  userId: string,
  tenant: AccessibleTenant,
): ResolvedTenantContext {
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
