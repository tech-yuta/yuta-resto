'use client';

import type { OrganizationUserMembership } from '@yuta/contracts/cloud-admin';
import {
  Badge,
  Button,
  FormField,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@yuta/ui';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateTenantMembershipAction } from './actions';
import {
  getAssignableRoles,
  getMembershipStatusLabel,
  initialUserManagementActionState,
  roleLabels,
  type UserManagementActorRole,
} from './user-access-model';

export function MembershipEditorForm({
  membership,
  actorRole,
  currentMembershipId,
  userIsActive,
}: {
  membership: OrganizationUserMembership;
  actorRole: UserManagementActorRole;
  currentMembershipId: string;
  userIsActive: boolean;
}) {
  const [state, formAction] = useActionState(
    updateTenantMembershipAction,
    initialUserManagementActionState,
  );
  const isCurrentMembership = membership.id === currentMembershipId;
  const protectedFromManager =
    actorRole === 'MANAGER' && membership.role !== 'STAFF';
  const locked = isCurrentMembership || protectedFromManager || !userIsActive;
  const assignableRoles = getAssignableRoles(actorRole);

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
            tone={membership.status === 'active' ? 'success' : 'warning'}
            variant="soft"
            size="sm"
          >
            {getMembershipStatusLabel(membership.status)}
          </Badge>
          {isCurrentMembership && (
            <Badge tone="info" variant="outline" size="sm">
              Session actuelle
            </Badge>
          )}
        </div>
        {protectedFromManager && (
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

      <MembershipSubmitButton disabled={locked} />
    </form>
  );
}

function MembershipSubmitButton({ disabled }: { disabled: boolean }) {
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
