import 'server-only';

import { TenantError, type TenantContext, type TenantRole } from '@yuta/tenant';

export type ReputationPermission =
  | 'reputation.read'
  | 'reputation.reply.create'
  | 'reputation.reply.publish'
  | 'reputation.incident.create'
  | 'reputation.incident.manage'
  | 'reputation.analytics.read'
  | 'reputation.settings.manage'
  | 'reputation.connector.manage';

const permissionRoles: Record<ReputationPermission, readonly TenantRole[]> = {
  'reputation.read': ['owner', 'admin', 'manager', 'employee'],
  'reputation.reply.create': ['owner', 'admin', 'manager', 'employee'],
  'reputation.reply.publish': ['owner', 'admin', 'manager'],
  'reputation.incident.create': ['owner', 'admin', 'manager', 'employee'],
  'reputation.incident.manage': ['owner', 'admin', 'manager'],
  'reputation.analytics.read': ['owner', 'admin', 'manager'],
  'reputation.settings.manage': ['owner', 'admin'],
  'reputation.connector.manage': ['owner', 'admin'],
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
