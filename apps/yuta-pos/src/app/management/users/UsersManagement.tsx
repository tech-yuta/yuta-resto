'use client';

import type { LocalUser } from '@yuta/contracts/local-pos';
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SimpleTable,
  SimpleTableBody,
  SimpleTableCell,
  SimpleTableHead,
  SimpleTableHeader,
  SimpleTableRow,
} from '@yuta/ui';
import { KeyRound, Pencil, Plus, UserCheck, UserX } from 'lucide-react';
import { useActionState, useEffect, useRef, useState } from 'react';
import {
  createLocalUserAction,
  resetLocalUserPinAction,
  setLocalUserActiveAction,
  updateLocalUserAction,
  type LocalUserActionState,
} from './actions';

const initialLocalUserActionState: LocalUserActionState = {
  error: null,
  success: null,
};

const allRoles: LocalUser['role'][] = ['admin', 'manager', 'staff', 'kitchen'];

export function UsersManagement({
  users,
  actorRole,
}: {
  users: LocalUser[];
  actorRole: LocalUser['role'];
}) {
  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <CreateUserDialog actorRole={actorRole} />
      </div>

      <div className="overflow-hidden rounded-lg border border-border-default bg-surface">
        <SimpleTable>
          <SimpleTableHeader>
            <SimpleTableRow>
              <SimpleTableHead>Utilisateur</SimpleTableHead>
              <SimpleTableHead>Rôle</SimpleTableHead>
              <SimpleTableHead>État</SimpleTableHead>
              <SimpleTableHead className="text-right">Actions</SimpleTableHead>
            </SimpleTableRow>
          </SimpleTableHeader>
          <SimpleTableBody>
            {users.map((user) => (
              <UserRow key={user.id} user={user} actorRole={actorRole} />
            ))}
          </SimpleTableBody>
        </SimpleTable>
      </div>
    </div>
  );
}

function CreateUserDialog({ actorRole }: { actorRole: LocalUser['role'] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    createLocalUserAction,
    initialLocalUserActionState,
  );

  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Ajouter un utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvel utilisateur POS</DialogTitle>
          <DialogDescription>
            Le PIN reste local et n’est jamais envoyé vers le cloud.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-4">
          <UserFields roles={manageableRoles(actorRole)} />
          <FormField label="Code PIN" hint="Entre 4 et 8 chiffres.">
            <Input
              name="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4,8}"
              minLength={4}
              maxLength={8}
              required
            />
          </FormField>
          <ActionFeedback state={state} />
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" loading={pending}>
              Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UserRow({
  user,
  actorRole,
}: {
  user: LocalUser;
  actorRole: LocalUser['role'];
}) {
  const canManage =
    actorRole === 'admin' || user.role === 'staff' || user.role === 'kitchen';

  return (
    <SimpleTableRow>
      <SimpleTableCell>
        <p className="font-bold">{user.name}</p>
        <p className="text-xs text-secondary">{user.email ?? 'Sans e-mail'}</p>
      </SimpleTableCell>
      <SimpleTableCell>
        <Badge tone={roleTone(user.role)}>{roleLabel(user.role)}</Badge>
      </SimpleTableCell>
      <SimpleTableCell>
        <Badge tone={user.isActive ? 'success' : 'neutral'}>
          {user.isActive ? 'Actif' : 'Inactif'}
        </Badge>
      </SimpleTableCell>
      <SimpleTableCell>
        {canManage ? (
          <div className="flex justify-end gap-2">
            <EditUserDialog user={user} actorRole={actorRole} />
            <ResetPinDialog user={user} />
            <ActivationDialog user={user} />
          </div>
        ) : (
          <p className="text-right text-xs text-muted">Réservé à l’admin</p>
        )}
      </SimpleTableCell>
    </SimpleTableRow>
  );
}

function EditUserDialog({
  user,
  actorRole,
}: {
  user: LocalUser;
  actorRole: LocalUser['role'];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    updateLocalUserAction.bind(null, user.id),
    initialLocalUserActionState,
  );
  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={`Modifier ${user.name}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier {user.name}</DialogTitle>
          <DialogDescription>
            Un changement de rôle invalide les sessions existantes.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-4">
          <UserFields
            roles={manageableRoles(actorRole)}
            user={user}
            includeStatus
          />
          <ActionFeedback state={state} />
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" loading={pending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPinDialog({ user }: { user: LocalUser }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    resetLocalUserPinAction.bind(null, user.id),
    initialLocalUserActionState,
  );
  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={`Changer le PIN de ${user.name}`}
        >
          <KeyRound className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changer le PIN</DialogTitle>
          <DialogDescription>
            Toutes les sessions de {user.name} seront invalidées.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-4">
          <FormField label="Nouveau PIN">
            <Input
              name="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4,8}"
              minLength={4}
              maxLength={8}
              required
            />
          </FormField>
          <FormField label="Confirmer le PIN">
            <Input
              name="pinConfirmation"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4,8}"
              minLength={4}
              maxLength={8}
              required
            />
          </FormField>
          <ActionFeedback state={state} />
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" loading={pending}>
              Modifier le PIN
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ActivationDialog({ user }: { user: LocalUser }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    setLocalUserActiveAction.bind(null, user.id, !user.isActive),
    initialLocalUserActionState,
  );
  useCloseOnSuccess(state, setOpen);

  return (
    <>
      <form ref={formRef} action={action} />
      <Button
        type="button"
        variant={user.isActive ? 'danger' : 'secondary'}
        size="sm"
        loading={pending}
        aria-label={`${user.isActive ? 'Désactiver' : 'Activer'} ${user.name}`}
        onClick={() => setOpen(true)}
      >
        {user.isActive ? (
          <UserX className="h-4 w-4" />
        ) : (
          <UserCheck className="h-4 w-4" />
        )}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`${user.isActive ? 'Désactiver' : 'Activer'} ${user.name} ?`}
        description={
          <span className="grid gap-2">
            <span>
              {user.isActive
                ? 'Ses sessions seront invalidées immédiatement.'
                : 'Cet utilisateur pourra de nouveau se connecter au POS.'}
            </span>
            {state.error && (
              <span className="font-medium text-status-danger" role="alert">
                {state.error}
              </span>
            )}
          </span>
        }
        confirmLabel={user.isActive ? 'Désactiver' : 'Activer'}
        cancelLabel="Annuler"
        tone={user.isActive ? 'danger' : 'primary'}
        onConfirm={() => formRef.current?.requestSubmit()}
      />
    </>
  );
}

function UserFields({
  roles,
  user,
  includeStatus = false,
}: {
  roles: LocalUser['role'][];
  user?: LocalUser;
  includeStatus?: boolean;
}) {
  const [role, setRole] = useState<LocalUser['role']>(
    user?.role ?? roles[0] ?? 'staff',
  );
  const [isActive, setIsActive] = useState(user?.isActive ?? true);

  return (
    <>
      <FormField label="Nom">
        <Input name="name" defaultValue={user?.name} maxLength={255} required />
      </FormField>
      <FormField label="E-mail" hint="Facultatif, uniquement local.">
        <Input
          name="email"
          type="email"
          defaultValue={user?.email ?? ''}
          maxLength={320}
        />
      </FormField>
      <FormField label="Rôle">
        <input type="hidden" name="role" value={role} />
        <Select
          value={role}
          onValueChange={(value) => setRole(value as LocalUser['role'])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roles.map((value) => (
              <SelectItem key={value} value={value}>
                {roleLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      {includeStatus && (
        <FormField label="État">
          <input
            type="hidden"
            name="isActive"
            value={isActive ? 'true' : 'false'}
          />
          <Select
            value={isActive ? 'active' : 'inactive'}
            onValueChange={(value) => setIsActive(value === 'active')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="inactive">Inactif</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      )}
    </>
  );
}

function ActionFeedback({ state }: { state: LocalUserActionState }) {
  if (!state.error) return null;
  return (
    <Alert tone="danger">
      <AlertDescription>{state.error}</AlertDescription>
    </Alert>
  );
}

function useCloseOnSuccess(
  state: LocalUserActionState,
  setOpen: (open: boolean) => void,
) {
  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success, setOpen]);
}

function manageableRoles(actorRole: LocalUser['role']): LocalUser['role'][] {
  return actorRole === 'admin' ? allRoles : ['staff', 'kitchen'];
}

function roleLabel(role: LocalUser['role']): string {
  const labels: Record<LocalUser['role'], string> = {
    admin: 'Administrateur',
    manager: 'Manager',
    staff: 'Service',
    kitchen: 'Cuisine',
  };
  return labels[role];
}

function roleTone(
  role: LocalUser['role'],
): 'brand' | 'info' | 'neutral' | 'warning' {
  const tones: Record<
    LocalUser['role'],
    'brand' | 'info' | 'neutral' | 'warning'
  > = {
    admin: 'brand',
    manager: 'info',
    staff: 'neutral',
    kitchen: 'warning',
  };
  return tones[role];
}
