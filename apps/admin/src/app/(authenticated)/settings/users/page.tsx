import { createTenantUserRepository } from '@yuta/db-cloud';
import { requireUserManagementTenant } from '../../../../server/auth/session';
import { cloudDatabase } from '../../../../server/cloud-database';
import { UsersPage } from './users-page';

export const dynamic = 'force-dynamic';

const tenantUserRepository = createTenantUserRepository(cloudDatabase);

export default async function SettingsUsersPage() {
  const { session, tenant } = await requireUserManagementTenant();
  if (tenant.actor.type !== 'user' || !tenant.establishmentId) {
    throw new Error('User management requires an authenticated tenant user.');
  }

  const establishments =
    await tenantUserRepository.listManageableEstablishments({
      organizationId: tenant.organizationId,
      establishmentId:
        tenant.actor.role === 'admin' ? tenant.establishmentId : undefined,
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
      actorRole={tenant.actor.role === 'owner' ? 'owner' : 'admin'}
    />
  );
}
