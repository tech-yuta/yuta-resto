'use client';

import type { ManageableEstablishment } from '@yuta/contracts/cloud-admin';
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@yuta/ui';
import { ShieldCheck } from 'lucide-react';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createTenantUserAction } from './actions';
import {
  getAssignableRoles,
  initialUserManagementActionState,
  roleLabels,
  type UserManagementActorRole,
} from './user-access-model';

export function CreateUserDialog({
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
  actorRole: UserManagementActorRole;
}) {
  const [state, formAction] = useActionState(
    createTenantUserAction,
    initialUserManagementActionState,
  );
  const [selectedEstablishments, setSelectedEstablishments] = useState([
    currentEstablishmentId,
  ]);
  const assignableRoles = getAssignableRoles(actorRole);

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
            <CreateUserSubmitButton
              disabled={selectedEstablishments.length === 0}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateUserSubmitButton({ disabled }: { disabled: boolean }) {
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
