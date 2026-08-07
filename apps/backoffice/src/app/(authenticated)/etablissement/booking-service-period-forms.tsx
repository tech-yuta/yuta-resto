'use client';

import { FormField, Input, Label } from '@yuta/ui';
import { Plus } from 'lucide-react';
import { useActionState, useEffect, useRef } from 'react';
import {
  createServicePeriodAction,
  deleteServicePeriodAction,
} from '../operations/reservations/actions';
import {
  BookingAdministrationActionMessage,
  BookingAdministrationSubmitButton,
  initialBookingAdministrationActionState,
} from './booking-administration-action-feedback';
import { BookingAdministrationDeleteButton } from './booking-administration-delete-button';

export function AddServiceForm({ dayOfWeek }: { dayOfWeek: number }) {
  const [state, formAction] = useActionState(
    createServicePeriodAction,
    initialBookingAdministrationActionState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === 'success') formRef.current?.reset();
  }, [state.status]);

  return (
    <details className="group rounded-xl border border-dashed border-border-default bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-action-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring [&::-webkit-details-marker]:hidden">
        <Plus className="h-4 w-4" aria-hidden />
        Ajouter un service
      </summary>
      <form
        ref={formRef}
        action={formAction}
        className="grid gap-3 border-t border-border-default p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <input type="hidden" name="dayOfWeek" value={dayOfWeek} />
        <FormField
          label={
            <Label htmlFor={`service-name-${dayOfWeek}`}>Nom du service</Label>
          }
          error={state.fieldErrors.name}
        >
          <Input
            id={`service-name-${dayOfWeek}`}
            name="name"
            placeholder="Déjeuner"
            required
          />
        </FormField>
        <FormField
          label={<Label htmlFor={`service-start-${dayOfWeek}`}>Début</Label>}
          error={state.fieldErrors.startTime}
        >
          <Input
            id={`service-start-${dayOfWeek}`}
            name="startTime"
            type="time"
            required
          />
        </FormField>
        <FormField
          label={<Label htmlFor={`service-end-${dayOfWeek}`}>Fin</Label>}
          error={state.fieldErrors.endTime}
        >
          <Input
            id={`service-end-${dayOfWeek}`}
            name="endTime"
            type="time"
            required
          />
        </FormField>
        <FormField
          label={
            <Label htmlFor={`service-capacity-${dayOfWeek}`}>Capacité</Label>
          }
          error={state.fieldErrors.capacity}
        >
          <Input
            id={`service-capacity-${dayOfWeek}`}
            name="capacity"
            type="number"
            min={1}
            required
          />
        </FormField>
        <div className="flex items-end">
          <BookingAdministrationSubmitButton label="Ajouter" />
        </div>
        <BookingAdministrationActionMessage
          state={state}
          className="sm:col-span-2 lg:col-span-5"
        />
      </form>
    </details>
  );
}

export function DeleteServicePeriodButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  return (
    <BookingAdministrationDeleteButton
      id={id}
      action={deleteServicePeriodAction}
      accessibleLabel={`Supprimer le service ${name}`}
      title="Supprimer le service ?"
      description={`Le service « ${name} » sera supprimé définitivement.`}
    />
  );
}
