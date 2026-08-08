import { FormField, Input, Label, Textarea } from '@yuta/ui';
import type { ChangeEvent } from 'react';
import {
  getBookingDayLabel,
  getBookingExceptionFieldVisibility,
  type BookingException,
  type ServicePeriodOption,
} from './booking-administration-model';

export function BookingExceptionFields({
  kind,
  periods,
  fieldErrors,
  onKindChange,
}: {
  kind: BookingException['kind'];
  periods: readonly ServicePeriodOption[];
  fieldErrors: Record<string, string>;
  onKindChange: (kind: BookingException['kind']) => void;
}) {
  const { requiresService, requiresTimes, supportsCapacity } =
    getBookingExceptionFieldVisibility(kind);

  function handleKindChange(event: ChangeEvent<HTMLSelectElement>) {
    onKindChange(event.target.value as BookingException['kind']);
  }

  return (
    <>
      <FormField
        label={<Label htmlFor="exception-date">Date</Label>}
        error={fieldErrors.date}
      >
        <Input id="exception-date" name="date" type="date" required />
      </FormField>
      <FormField
        label={<Label htmlFor="exception-kind">Type</Label>}
        error={fieldErrors.kind}
      >
        <select
          id="exception-kind"
          name="kind"
          value={kind}
          onChange={handleKindChange}
          className="h-10 rounded-lg border border-border-default bg-surface px-3 text-sm"
        >
          <option value="CLOSED_ALL_DAY">Fermeture exceptionnelle</option>
          <option value="CLOSED_SERVICE">Service fermé</option>
          <option value="MODIFIED_HOURS">Horaires modifiés</option>
          <option value="BLOCKED_SLOT">Créneau bloqué</option>
        </select>
      </FormField>
      {(requiresService || requiresTimes) && (
        <ServicePeriodField
          periods={periods}
          required={requiresService}
          error={fieldErrors.servicePeriodId}
        />
      )}
      {requiresTimes && <ExceptionTimeFields fieldErrors={fieldErrors} />}
      {supportsCapacity && (
        <FormField
          label={<Label htmlFor="exception-capacity">Capacité forcée</Label>}
          hint="Laissez vide pour conserver la capacité habituelle."
          error={fieldErrors.capacityOverride}
        >
          <Input
            id="exception-capacity"
            name="capacityOverride"
            type="number"
            min={0}
          />
        </FormField>
      )}
      <FormField label={<Label htmlFor="exception-reason">Motif</Label>}>
        <Textarea id="exception-reason" name="reason" />
      </FormField>
    </>
  );
}

function ServicePeriodField({
  periods,
  required,
  error,
}: {
  periods: readonly ServicePeriodOption[];
  required: boolean;
  error?: string;
}) {
  return (
    <FormField
      label={<Label htmlFor="exception-service">Service concerné</Label>}
      hint={required ? undefined : 'Facultatif : tous les services par défaut.'}
      error={error}
    >
      <select
        id="exception-service"
        name="servicePeriodId"
        required={required}
        className="h-10 rounded-lg border border-border-default bg-surface px-3 text-sm"
      >
        <option value="">Tous les services</option>
        {periods.map((period) => (
          <option key={period.id} value={period.id}>
            {getBookingDayLabel(period.dayOfWeek)} · {period.name}
          </option>
        ))}
      </select>
    </FormField>
  );
}

function ExceptionTimeFields({
  fieldErrors,
}: {
  fieldErrors: Record<string, string>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <FormField
        label={<Label htmlFor="exception-start">Début</Label>}
        error={fieldErrors.startTime}
      >
        <Input id="exception-start" name="startTime" type="time" required />
      </FormField>
      <FormField
        label={<Label htmlFor="exception-end">Fin</Label>}
        error={fieldErrors.endTime}
      >
        <Input id="exception-end" name="endTime" type="time" required />
      </FormField>
    </div>
  );
}
