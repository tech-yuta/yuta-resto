'use client';

import type { AvailableTenant } from '@yuta/auth';
import {
  Button,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  cn,
} from '@yuta/ui';
import { ArrowLeftRight } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  switchTenantAction,
  type TenantSwitchActionState,
} from '../app/(authenticated)/actions';

const initialState: TenantSwitchActionState = { error: null };

export function TenantSwitcher({
  tenants,
  currentMembershipId,
  className,
}: {
  tenants: AvailableTenant[];
  currentMembershipId: string;
  className?: string;
}) {
  const pathname = usePathname();
  const [selectedMembershipId, setSelectedMembershipId] =
    useState(currentMembershipId);
  const [state, formAction] = useActionState(switchTenantAction, initialState);
  const tenantsByOrganization = groupTenantsByOrganization(tenants);

  return (
    <form
      action={formAction}
      className={cn('flex min-w-0 items-start gap-2', className)}
    >
      <input type="hidden" name="returnTo" value={pathname} />
      <div className="min-w-0 flex-1">
        <Select
          name="membershipId"
          value={selectedMembershipId}
          onValueChange={setSelectedMembershipId}
          disabled={tenants.length < 2}
          required
        >
          <SelectTrigger
            aria-label="Établissement actif"
            className={cn(
              'h-9 min-w-0 bg-surface',
              state.error && 'border-status-danger',
            )}
          >
            <SelectValue placeholder="Choisir un établissement" />
          </SelectTrigger>
          <SelectContent>
            {tenantsByOrganization.map((organization) => (
              <SelectGroup key={organization.id}>
                <SelectLabel>{organization.name}</SelectLabel>
                {organization.tenants.map((tenant) => (
                  <SelectItem
                    key={tenant.membershipId}
                    value={tenant.membershipId}
                  >
                    {tenant.establishmentName}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        {state.error && (
          <p className="mt-1 max-w-64 text-xs text-status-danger" role="alert">
            {state.error}
          </p>
        )}
      </div>
      <TenantSwitchSubmit
        disabled={
          tenants.length < 2 || selectedMembershipId === currentMembershipId
        }
      />
    </form>
  );
}

function TenantSwitchSubmit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      size="sm"
      className="h-9 shrink-0 px-2"
      loading={pending}
      disabled={disabled || pending}
      aria-label="Changer d'établissement"
      title="Changer d'établissement"
    >
      <ArrowLeftRight className="h-4 w-4" />
      <span className="sr-only">Changer d'établissement</span>
    </Button>
  );
}

function groupTenantsByOrganization(tenants: AvailableTenant[]) {
  const organizations = new Map<
    string,
    { id: string; name: string; tenants: AvailableTenant[] }
  >();
  for (const tenant of tenants) {
    const organization = organizations.get(tenant.organizationId);
    if (organization) {
      organization.tenants.push(tenant);
    } else {
      organizations.set(tenant.organizationId, {
        id: tenant.organizationId,
        name: tenant.organizationName,
        tenants: [tenant],
      });
    }
  }
  return [...organizations.values()];
}
