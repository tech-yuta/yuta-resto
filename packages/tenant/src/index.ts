import { z } from 'zod';

export const tenantRoleSchema = z.enum([
  'owner',
  'admin',
  'manager',
  'cashier',
  'kitchen',
  'waiter',
  'accountant',
  'employee',
]);
export type TenantRole = z.infer<typeof tenantRoleSchema>;
export type TenantActor = Readonly<
  | { type: 'public' }
  | { type: 'user'; userId: string; role: TenantRole; membershipId: string }
  | { type: 'service'; serviceName: string }
>;
export type TenantContext = Readonly<{
  organizationId: string;
  establishmentId: string | null;
  actor: TenantActor;
  locale: string;
  timezone: string;
  entitlements: ReadonlySet<string>;
}>;
export type PublicTenantContext = Readonly<{
  organizationId: string;
  establishmentId: string;
  hostname: string;
  locale: string;
  timezone: string;
  entitlements: ReadonlySet<string>;
}>;

export type DomainTenantRecord = Readonly<{
  organizationId: string;
  establishmentId: string;
  hostname: string;
  status: 'active' | 'pending' | 'disabled';
  locale: string;
  timezone: string;
  entitlements: readonly string[];
}>;
export interface DomainLookupPort {
  findActiveByHostname(hostname: string): Promise<DomainTenantRecord | null>;
}
export type MembershipRecord = Readonly<{
  membershipId: string;
  userId: string;
  organizationId: string;
  establishmentId: string | null;
  role: TenantRole;
  status: 'active' | 'invited' | 'suspended';
}>;
export interface MembershipLookupPort {
  findActiveMembership(
    input: Readonly<{
      userId: string;
      organizationId: string;
      establishmentId: string | null;
    }>,
  ): Promise<MembershipRecord | null>;
}
export interface EstablishmentLookupPort {
  belongsToOrganization(
    input: Readonly<{ organizationId: string; establishmentId: string }>,
  ): Promise<boolean>;
}

export type TenantErrorCode =
  | 'INVALID_HOSTNAME'
  | 'TENANT_NOT_FOUND'
  | 'TENANT_DISABLED'
  | 'ESTABLISHMENT_REQUIRED'
  | 'MEMBERSHIP_NOT_FOUND'
  | 'MEMBERSHIP_INACTIVE'
  | 'CROSS_TENANT_ACCESS_DENIED'
  | 'FEATURE_NOT_ENABLED';
export class TenantError extends Error {
  constructor(
    message: string,
    public readonly code: TenantErrorCode,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'TenantError';
  }
}

export function normalizeHostname(rawHostname: string): string {
  let value = rawHostname.trim().toLowerCase();
  if (!value || /[:][/][/]|[/\\?#@]/.test(value))
    throw new TenantError('Invalid hostname.', 'INVALID_HOSTNAME', 400);
  const portIndex = value.lastIndexOf(':');
  if (portIndex >= 0) {
    if (
      !/^\d+$/.test(value.slice(portIndex + 1)) ||
      value.slice(0, portIndex).includes(':')
    )
      throw new TenantError('Invalid hostname.', 'INVALID_HOSTNAME', 400);
    value = value.slice(0, portIndex);
  }
  value = value.replace(/[.]+$/, '');
  if (
    !value ||
    value.length > 253 ||
    !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(value) ||
    value.includes('..')
  )
    throw new TenantError('Invalid hostname.', 'INVALID_HOSTNAME', 400);
  return value;
}

export async function resolvePublicTenant(
  input: Readonly<{ hostname: string; domainLookup: DomainLookupPort }>,
): Promise<PublicTenantContext> {
  const hostname = normalizeHostname(input.hostname);
  const tenant = await input.domainLookup.findActiveByHostname(hostname);
  if (!tenant)
    throw new TenantError('Tenant not found.', 'TENANT_NOT_FOUND', 404);
  if (tenant.status !== 'active')
    throw new TenantError('Tenant is disabled.', 'TENANT_DISABLED', 403);
  if (normalizeHostname(tenant.hostname) !== hostname)
    throw new TenantError(
      'Cross-tenant access denied.',
      'CROSS_TENANT_ACCESS_DENIED',
      403,
    );
  return Object.freeze({
    organizationId: tenant.organizationId,
    establishmentId: tenant.establishmentId,
    hostname,
    locale: tenant.locale,
    timezone: tenant.timezone,
    entitlements: new Set(tenant.entitlements),
  });
}

export async function resolveAuthenticatedTenant(
  input: Readonly<{
    userId: string;
    organizationId: string;
    establishmentId: string | null;
    membershipLookup: MembershipLookupPort;
    tenantMetadata: Readonly<{
      locale: string;
      timezone: string;
      entitlements: readonly string[];
    }>;
  }>,
): Promise<TenantContext> {
  const membership = await input.membershipLookup.findActiveMembership(input);
  if (!membership)
    throw new TenantError('Membership not found.', 'MEMBERSHIP_NOT_FOUND', 403);
  if (membership.status !== 'active')
    throw new TenantError(
      'Membership is inactive.',
      'MEMBERSHIP_INACTIVE',
      403,
    );
  if (
    membership.userId !== input.userId ||
    membership.organizationId !== input.organizationId ||
    membership.establishmentId !== input.establishmentId
  )
    throw new TenantError(
      'Cross-tenant access denied.',
      'CROSS_TENANT_ACCESS_DENIED',
      403,
    );
  return Object.freeze({
    organizationId: membership.organizationId,
    establishmentId: membership.establishmentId,
    actor: Object.freeze({
      type: 'user' as const,
      userId: membership.userId,
      role: membership.role,
      membershipId: membership.membershipId,
    }),
    locale: input.tenantMetadata.locale,
    timezone: input.tenantMetadata.timezone,
    entitlements: new Set(input.tenantMetadata.entitlements),
  });
}

export function requireEstablishment(
  context: TenantContext,
): asserts context is TenantContext & { establishmentId: string } {
  if (!context.establishmentId)
    throw new TenantError(
      'An establishment is required.',
      'ESTABLISHMENT_REQUIRED',
      400,
    );
}
export function requireRole(
  context: TenantContext,
  roles: readonly TenantRole[],
): void {
  if (context.actor.type !== 'user' || !roles.includes(context.actor.role))
    throw new TenantError(
      'Cross-tenant access denied.',
      'CROSS_TENANT_ACCESS_DENIED',
      403,
    );
}
export function requireEntitlement(
  context: Pick<TenantContext, 'entitlements'>,
  entitlement: string,
): void {
  if (!context.entitlements.has(entitlement))
    throw new TenantError(
      'Feature is not enabled.',
      'FEATURE_NOT_ENABLED',
      403,
    );
}
export function assertOrganizationScope(
  input: Readonly<{ context: TenantContext; resourceOrganizationId: string }>,
): void {
  if (input.context.organizationId !== input.resourceOrganizationId)
    throw new TenantError(
      'Cross-tenant access denied.',
      'CROSS_TENANT_ACCESS_DENIED',
      403,
    );
}
export function assertEstablishmentScope(
  input: Readonly<{
    context: TenantContext;
    resourceOrganizationId: string;
    resourceEstablishmentId: string;
  }>,
): void {
  assertOrganizationScope(input);
  if (
    input.context.establishmentId !== null &&
    input.context.establishmentId !== input.resourceEstablishmentId
  )
    throw new TenantError(
      'Cross-tenant access denied.',
      'CROSS_TENANT_ACCESS_DENIED',
      403,
    );
}
