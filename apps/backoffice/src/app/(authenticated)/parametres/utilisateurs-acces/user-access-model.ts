import type {
  OrganizationUser,
  OrganizationUserMembership,
} from '@yuta/contracts/cloud-admin';
import type { TenantRole } from '@yuta/tenant';
import type { UserManagementActionState } from './actions';

export type UserManagementActorRole = 'OWNER' | 'MANAGER';

export const initialUserManagementActionState: UserManagementActionState = {
  error: null,
  success: null,
};

export const roleLabels: Record<TenantRole, string> = {
  OWNER: 'Propriétaire',
  MANAGER: 'Responsable',
  STAFF: 'Employé',
};

const allRoles = Object.keys(roleLabels) as TenantRole[];

export function getAssignableRoles(
  actorRole: UserManagementActorRole,
): TenantRole[] {
  return actorRole === 'OWNER'
    ? allRoles
    : allRoles.filter((role) => role === 'STAFF');
}

export function filterOrganizationUsers(
  users: readonly OrganizationUser[],
  query: string,
): OrganizationUser[] {
  const normalizedQuery = query.trim().toLocaleLowerCase('fr-FR');
  if (!normalizedQuery) return [...users];

  return users.filter(
    (user) =>
      user.name.toLocaleLowerCase('fr-FR').includes(normalizedQuery) ||
      user.email?.toLocaleLowerCase('fr-FR').includes(normalizedQuery) ||
      user.memberships.some((membership) =>
        membership.establishmentName
          .toLocaleLowerCase('fr-FR')
          .includes(normalizedQuery),
      ),
  );
}

export function countActiveMemberships(
  users: readonly OrganizationUser[],
): number {
  return users.reduce(
    (total, user) =>
      total +
      user.memberships.filter((membership) => membership.status === 'active')
        .length,
    0,
  );
}

export function getMembershipStatusLabel(
  status: OrganizationUserMembership['status'],
): string {
  return status === 'active' ? 'Actif' : 'Suspendu';
}
