'use client';

import type {
  ManageableEstablishment,
  OrganizationUser,
} from '@yuta/contracts/cloud-admin';
import { Button } from '@yuta/ui';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { BackofficePage } from '../../../../components/backoffice-page';
import { CreateUserDialog } from './create-user-dialog';
import {
  countActiveMemberships,
  type UserManagementActorRole,
} from './user-access-model';
import { UserAccessSummary } from './user-access-summary';
import { UsersAccessList } from './users-access-list';

export function UsersPage({
  users,
  establishments,
  currentUserId,
  currentMembershipId,
  currentEstablishmentId,
  actorRole,
}: {
  users: OrganizationUser[];
  establishments: ManageableEstablishment[];
  currentUserId: string;
  currentMembershipId: string;
  currentEstablishmentId: string;
  actorRole: UserManagementActorRole;
}) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <BackofficePage
      title="Utilisateurs & accès"
      description="Gérez les accès par établissement avec des rôles indépendants."
      actions={
        <Button
          type="button"
          variant="primary"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Ajouter un utilisateur
        </Button>
      }
    >
      <UserAccessSummary
        userCount={users.length}
        activeMembershipCount={countActiveMemberships(users)}
        establishmentCount={establishments.length}
      />

      <UsersAccessList
        users={users}
        actorRole={actorRole}
        currentUserId={currentUserId}
        currentMembershipId={currentMembershipId}
      />

      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        establishments={establishments}
        currentEstablishmentId={currentEstablishmentId}
        actorRole={actorRole}
      />
    </BackofficePage>
  );
}
