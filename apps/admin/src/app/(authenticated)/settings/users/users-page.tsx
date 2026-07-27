'use client';

import type {
  ManageableEstablishment,
  OrganizationUser,
  OrganizationUserMembership,
} from '@yuta/db-cloud';
import type { TenantRole } from '@yuta/tenant';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  FormField,
  Input,
  Label,
  Panel,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@yuta/ui';
import { Building2, KeyRound, Plus, ShieldCheck, Users } from 'lucide-react';
import { useActionState, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { AdminPage } from '../../../../components/admin-page';
import {
  createTenantUserAction,
  updateTenantMembershipAction,
  type UserManagementActionState,
} from './actions';

const initialActionState: UserManagementActionState = {
  error: null,
  success: null,
};

const roleLabels: Record<TenantRole, string> = {
  owner: 'Propriétaire',
  admin: 'Administrateur',
  manager: 'Responsable',
  employee: 'Employé',
};

const allRoles = Object.keys(roleLabels) as TenantRole[];

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
  actorRole: 'owner' | 'admin';
}) {
  const [query, setQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const normalizedQuery = query.trim().toLocaleLowerCase('fr-FR');
  const filteredUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          !normalizedQuery ||
          user.name.toLocaleLowerCase('fr-FR').includes(normalizedQuery) ||
          user.email?.toLocaleLowerCase('fr-FR').includes(normalizedQuery) ||
          user.memberships.some((membership) =>
            membership.establishmentName
              .toLocaleLowerCase('fr-FR')
              .includes(normalizedQuery),
          ),
      ),
    [normalizedQuery, users],
  );
  const activeMemberships = users.reduce(
    (total, user) =>
      total +
      user.memberships.filter((membership) => membership.status === 'active')
        .length,
    0,
  );

  return (
    <AdminPage
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
      <section className="grid gap-4 sm:grid-cols-3">
        <Metric
          icon={Users}
          label="Utilisateurs visibles"
          value={users.length}
        />
        <Metric
          icon={KeyRound}
          label="Accès actifs"
          value={activeMemberships}
        />
        <Metric
          icon={Building2}
          label="Établissements gérés"
          value={establishments.length}
        />
      </section>

      <Panel
        title="Membres de l'organisation"
        description={
          actorRole === 'owner'
            ? "Vous gérez tous les établissements actifs de l'organisation."
            : "Un administrateur gère uniquement l'établissement actuellement sélectionné."
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

      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        establishments={establishments}
        currentEstablishmentId={currentEstablishmentId}
        actorRole={actorRole}
      />
    </AdminPage>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <Card padding="sm" className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-surface-selected text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-black text-primary">{value}</p>
        <p className="text-xs font-semibold text-muted">{label}</p>
      </div>
    </Card>
  );
}

function UserAccessCard({
  user,
  actorRole,
  currentUserId,
  currentMembershipId,
}: {
  user: OrganizationUser;
  actorRole: 'owner' | 'admin';
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
          <MembershipEditor
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

function MembershipEditor({
  membership,
  actorRole,
  currentMembershipId,
  userIsActive,
}: {
  membership: OrganizationUserMembership;
  actorRole: 'owner' | 'admin';
  currentMembershipId: string;
  userIsActive: boolean;
}) {
  const [state, formAction] = useActionState(
    updateTenantMembershipAction,
    initialActionState,
  );
  const isCurrentMembership = membership.id === currentMembershipId;
  const protectedFromAdmin =
    actorRole === 'admin' &&
    (membership.role === 'owner' || membership.role === 'admin');
  const locked = isCurrentMembership || protectedFromAdmin || !userIsActive;
  const assignableRoles =
    actorRole === 'owner'
      ? allRoles
      : allRoles.filter((role) => role !== 'owner' && role !== 'admin');

  return (
    <form
      action={formAction}
      className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(180px,1fr)_190px_150px_auto] lg:items-end"
    >
      <input type="hidden" name="membershipId" value={membership.id} />
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-primary">
            {membership.establishmentName}
          </p>
          <Badge
            tone={
              membership.status === 'active'
                ? 'success'
                : membership.status === 'invited'
                  ? 'info'
                  : 'warning'
            }
            variant="soft"
            size="sm"
          >
            {membershipStatusLabel(membership.status)}
          </Badge>
          {isCurrentMembership && (
            <Badge tone="info" variant="outline" size="sm">
              Session actuelle
            </Badge>
          )}
        </div>
        {protectedFromAdmin && (
          <p className="mt-1 text-xs text-muted">
            Seul un owner peut modifier cet accès.
          </p>
        )}
        {state.error && (
          <p
            className="mt-1 text-xs font-medium text-status-danger"
            role="alert"
          >
            {state.error}
          </p>
        )}
        {state.success && (
          <p
            className="mt-1 text-xs font-medium text-status-success"
            role="status"
          >
            {state.success}
          </p>
        )}
      </div>

      <FormField label={<Label htmlFor={`role-${membership.id}`}>Rôle</Label>}>
        <Select
          name="role"
          defaultValue={membership.role}
          disabled={locked}
          required
        >
          <SelectTrigger id={`role-${membership.id}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {assignableRoles.map((role) => (
              <SelectItem key={role} value={role}>
                {roleLabels[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField
        label={<Label htmlFor={`status-${membership.id}`}>Statut</Label>}
      >
        <Select
          name="status"
          defaultValue={
            membership.status === 'suspended' ? 'suspended' : 'active'
          }
          disabled={locked}
          required
        >
          <SelectTrigger id={`status-${membership.id}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Actif</SelectItem>
            <SelectItem value="suspended">Suspendu</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      <MembershipSubmit disabled={locked} />
    </form>
  );
}

function MembershipSubmit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="secondary"
      size="sm"
      loading={pending}
      disabled={disabled || pending}
    >
      Enregistrer
    </Button>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
  establishments,
  currentEstablishmentId,
  actorRole,
}: {
  open: boolean;
  onOpenChange(open: boolean): void;
  establishments: ManageableEstablishment[];
  currentEstablishmentId: string;
  actorRole: 'owner' | 'admin';
}) {
  const [state, formAction] = useActionState(
    createTenantUserAction,
    initialActionState,
  );
  const [selectedEstablishments, setSelectedEstablishments] = useState([
    currentEstablishmentId,
  ]);
  const assignableRoles =
    actorRole === 'owner'
      ? allRoles
      : allRoles.filter((role) => role !== 'owner' && role !== 'admin');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un utilisateur</DialogTitle>
          <DialogDescription>
            Créez une identité ou rattachez un compte existant grâce à son
            adresse e-mail.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="mt-5 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={<Label htmlFor="new-user-name">Nom</Label>}>
              <Input id="new-user-name" name="name" maxLength={255} required />
            </FormField>
            <FormField label={<Label htmlFor="new-user-email">E-mail</Label>}>
              <Input
                id="new-user-email"
                name="email"
                type="email"
                maxLength={320}
                autoComplete="email"
                required
              />
            </FormField>
          </div>

          <FormField
            label={
              <Label htmlFor="new-user-password">Mot de passe initial</Label>
            }
            hint="12 caractères minimum. Si le compte existe déjà, son mot de passe actuel est conservé."
          >
            <Input
              id="new-user-password"
              name="password"
              type="password"
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              required
            />
          </FormField>

          <FormField
            label={<Label htmlFor="new-user-role">Rôle initial</Label>}
          >
            <Select name="role" defaultValue="employee" required>
              <SelectTrigger id="new-user-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assignableRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleLabels[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium text-primary">
              Établissements
            </legend>
            <div className="grid gap-2 rounded-lg border border-border-default bg-surface-muted p-3">
              {establishments.map((establishment) => {
                const checked = selectedEstablishments.includes(
                  establishment.id,
                );
                return (
                  <label
                    key={establishment.id}
                    htmlFor={`establishment-${establishment.id}`}
                    className="flex cursor-pointer items-center gap-3 rounded-lg bg-surface px-3 py-2 text-sm font-semibold text-primary"
                  >
                    <Checkbox
                      id={`establishment-${establishment.id}`}
                      name="establishmentId"
                      value={establishment.id}
                      checked={checked}
                      onCheckedChange={(nextChecked) =>
                        setSelectedEstablishments((current) =>
                          nextChecked
                            ? [...current, establishment.id]
                            : current.filter((id) => id !== establishment.id),
                        )
                      }
                    />
                    {establishment.name}
                  </label>
                );
              })}
            </div>
          </fieldset>

          {state.error && (
            <p
              className="rounded-lg bg-status-danger-soft px-3 py-2 text-sm font-medium text-status-danger"
              role="alert"
            >
              {state.error}
            </p>
          )}
          {state.success && (
            <p
              className="rounded-lg bg-status-success-soft px-3 py-2 text-sm font-medium text-status-success"
              role="status"
            >
              {state.success}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Fermer
            </Button>
            <CreateUserSubmit disabled={selectedEstablishments.length === 0} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateUserSubmit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="primary"
      loading={pending}
      disabled={disabled || pending}
    >
      <ShieldCheck className="h-4 w-4" />
      Créer les accès
    </Button>
  );
}

function membershipStatusLabel(
  status: OrganizationUserMembership['status'],
): string {
  if (status === 'active') return 'Actif';
  if (status === 'invited') return 'Invité';
  return 'Suspendu';
}
