'use client';

import type { OrganizationUser } from '@yuta/contracts/cloud-admin';
import { EmptyState, Panel, SearchInput } from '@yuta/ui';
import { Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { UserAccessCard } from './user-access-card';
import {
  filterOrganizationUsers,
  type UserManagementActorRole,
} from './user-access-model';

export function UsersAccessList({
  users,
  actorRole,
  currentUserId,
  currentMembershipId,
}: {
  users: OrganizationUser[];
  actorRole: UserManagementActorRole;
  currentUserId: string;
  currentMembershipId: string;
}) {
  const [query, setQuery] = useState('');
  const filteredUsers = useMemo(
    () => filterOrganizationUsers(users, query),
    [query, users],
  );

  return (
    <Panel
      title="Membres de l'organisation"
      description={
        actorRole === 'OWNER'
          ? "Vous gérez tous les établissements actifs de l'organisation."
          : "Un responsable gère uniquement l'établissement actuellement sélectionné."
      }
      action={
        <SearchInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher un utilisateur..."
          aria-label="Rechercher un utilisateur"
          className="w-64"
        />
      }
      bodyClassName="gap-4 p-4"
    >
      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Aucun utilisateur"
          description={
            query
              ? 'Aucun résultat ne correspond à votre recherche.'
              : 'Ajoutez le premier utilisateur à cet établissement.'
          }
        />
      ) : (
        filteredUsers.map((user) => (
          <UserAccessCard
            key={user.id}
            user={user}
            actorRole={actorRole}
            currentUserId={currentUserId}
            currentMembershipId={currentMembershipId}
          />
        ))
      )}
    </Panel>
  );
}
