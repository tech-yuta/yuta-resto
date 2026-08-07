import 'server-only';

import { TenantError, type TenantContext, type TenantRole } from '@yuta/tenant';

export type ReputationPermission =
  | 'reputation.read'
  | 'reputation.feedback.manage'
  | 'reputation.reply.create'
  | 'reputation.reply.publish'
  | 'reputation.incident.create'
  | 'reputation.incident.manage'
  | 'reputation.analytics.read'
  | 'reputation.note.create'
  | 'reputation.settings.manage'
  | 'reputation.connector.manage';

export type BookingPermission =
  | 'booking.read'
  | 'booking.operate'
  | 'booking.settings.manage';

export type EstablishmentPermission =
  | 'establishment.profile.read'
  | 'establishment.profile.manage';

const permissionRoles: Record<ReputationPermission, readonly TenantRole[]> = {
  'reputation.read': ['OWNER', 'MANAGER', 'STAFF'],
  'reputation.feedback.manage': ['OWNER', 'MANAGER'],
  'reputation.reply.create': ['OWNER', 'MANAGER', 'STAFF'],
  'reputation.reply.publish': ['OWNER', 'MANAGER'],
  'reputation.incident.create': ['OWNER', 'MANAGER', 'STAFF'],
  'reputation.incident.manage': ['OWNER', 'MANAGER'],
  'reputation.analytics.read': ['OWNER', 'MANAGER'],
  'reputation.note.create': ['OWNER', 'MANAGER', 'STAFF'],
  'reputation.settings.manage': ['OWNER'],
  'reputation.connector.manage': ['OWNER'],
};

const bookingPermissionRoles: Record<BookingPermission, readonly TenantRole[]> =
  {
    'booking.read': ['OWNER', 'MANAGER', 'STAFF'],
    'booking.operate': ['OWNER', 'MANAGER', 'STAFF'],
    'booking.settings.manage': ['OWNER', 'MANAGER'],
  };

const establishmentPermissionRoles: Record<
  EstablishmentPermission,
  readonly TenantRole[]
> = {
  'establishment.profile.read': ['OWNER', 'MANAGER', 'STAFF'],
  'establishment.profile.manage': ['OWNER', 'MANAGER'],
};

export function requireReputationPermission(
  context: TenantContext,
  permission: ReputationPermission,
): void {
  if (
    context.actor.type !== 'user' ||
    !permissionRoles[permission].includes(context.actor.role)
  ) {
    throw new TenantError(
      'Permission denied.',
      'CROSS_TENANT_ACCESS_DENIED',
      403,
    );
  }
}

export function requireBookingPermission(
  context: TenantContext,
  permission: BookingPermission,
): void {
  if (!hasBookingPermission(context, permission)) {
    throw new TenantError(
      'Permission denied.',
      'CROSS_TENANT_ACCESS_DENIED',
      403,
    );
  }
}

export function hasBookingPermission(
  context: TenantContext,
  permission: BookingPermission,
): boolean {
  return (
    context.actor.type === 'user' &&
    bookingPermissionRoles[permission].includes(context.actor.role)
  );
}

export function hasEstablishmentPermission(
  context: TenantContext,
  permission: EstablishmentPermission,
): boolean {
  return (
    context.actor.type === 'user' &&
    establishmentPermissionRoles[permission].includes(context.actor.role)
  );
}

export function requireEstablishmentPermission(
  context: TenantContext,
  permission: EstablishmentPermission,
): void {
  if (!hasEstablishmentPermission(context, permission)) {
    throw new TenantError(
      'Permission denied.',
      'CROSS_TENANT_ACCESS_DENIED',
      403,
    );
  }
}
