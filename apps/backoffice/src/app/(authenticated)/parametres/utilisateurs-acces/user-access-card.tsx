import type { OrganizationUser } from '@yuta/contracts/cloud-admin';
import { Avatar, Badge, Card } from '@yuta/ui';
import { MembershipEditorForm } from './membership-editor-form';
import type { UserManagementActorRole } from './user-access-model';

export function UserAccessCard({
  user,
  actorRole,
  currentUserId,
  currentMembershipId,
}: {
  user: OrganizationUser;
  actorRole: UserManagementActorRole;
  currentUserId: string;
  currentMembershipId: string;
}) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-border-default bg-surface-muted px-4 py-3">
        <Avatar fallback={user.name} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-primary">{user.name}</h3>
            {user.id === currentUserId && (
              <Badge tone="brand" variant="soft" size="sm">
                Vous
              </Badge>
            )}
            {!user.isActive && (
              <Badge tone="danger" variant="soft" size="sm">
                Compte désactivé
              </Badge>
            )}
          </div>
          <p className="truncate text-sm text-muted">
            {user.email ?? 'Aucune adresse e-mail'}
          </p>
        </div>
        <Badge tone="neutral" variant="outline">
          {user.memberships.length} accès
        </Badge>
      </div>

      <div className="divide-y divide-border-default">
        {user.memberships.map((membership) => (
          <MembershipEditorForm
            key={membership.id}
            membership={membership}
            actorRole={actorRole}
            currentMembershipId={currentMembershipId}
            userIsActive={user.isActive}
          />
        ))}
      </div>
    </Card>
  );
}
