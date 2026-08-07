import { createTenantUserRepository } from '@yuta/db-cloud';
import { UsersPage } from '../../equipe/utilisateurs-acces/users-page';
import { requireUserManagementTenant } from '../../../../server/auth/session';
import { cloudDatabase } from '../../../../server/cloud-database';

export const dynamic = 'force-dynamic';

const tenantUserRepository = createTenantUserRepository(cloudDatabase);

export default async function SettingsUsersPage() {
  const { session, tenant } = await requireUserManagementTenant();
  if (
    tenant.actor.type !== 'user' ||
    !tenant.establishmentId ||
    (tenant.actor.role !== 'OWNER' && tenant.actor.role !== 'MANAGER')
  ) {
    throw new Error('User management requires an authenticated tenant user.');
  }

  const establishments =
    await tenantUserRepository.listManageableEstablishments({
      organizationId: tenant.organizationId,
      establishmentId:
        tenant.actor.role === 'MANAGER' ? tenant.establishmentId : undefined,
    });
  const organizationUsers = await tenantUserRepository.listOrganizationUsers({
    organizationId: tenant.organizationId,
    establishmentIds: establishments.map((establishment) => establishment.id),
  });

  return (
    <UsersPage
      users={organizationUsers}
      establishments={establishments}
      currentUserId={session.userId}
      currentMembershipId={tenant.actor.membershipId}
      currentEstablishmentId={tenant.establishmentId}
      actorRole={tenant.actor.role}
    />
  );
}
