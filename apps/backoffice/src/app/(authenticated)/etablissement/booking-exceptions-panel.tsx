'use client';

import { Card, FormField, Input, Label, Separator, Textarea } from '@yuta/ui';
import { CalendarClock, Plus } from 'lucide-react';
import { useActionState, useEffect, useRef, useState } from 'react';
import {
  createExceptionAction,
  deleteExceptionAction,
} from '../operations/reservations/actions';
import {
  BookingAdministrationActionMessage,
  BookingAdministrationSubmitButton,
  initialBookingAdministrationActionState,
} from './booking-administration-action-feedback';
import { BookingAdministrationDeleteButton } from './booking-administration-delete-button';
import {
  formatBookingExceptionDate,
  getBookingDayLabel,
  type BookingException,
  type ServicePeriodOption,
} from './booking-administration-model';
import { exceptionKindLabels } from './booking-schedule-view-model';

export function ExceptionsPanel({
  exceptions,
  periods,
  locale,
}: {
  exceptions: readonly BookingException[];
  periods: readonly ServicePeriodOption[];
  locale: string;
}) {
  return (
    <Card
      id="jours-exceptionnels"
      padding="none"
      radius="lg"
      className="overflow-hidden scroll-mt-6"
    >
      <div className="flex items-center gap-2 px-5 py-4">
        <CalendarClock className="h-5 w-5" aria-hidden />
        <h2 className="font-bold">Exceptions à venir</h2>
      </div>
      <Separator />
      <div className="grid gap-1 p-3">
        {exceptions.slice(0, 5).map((exception) => (
          <ExceptionRow
            key={exception.id}
            exception={exception}
            locale={locale}
          />
        ))}
        {exceptions.length === 0 && (
          <p className="px-2 py-4 text-center text-sm text-muted">
            Aucune exception planifiée.
          </p>
        )}
      </div>
      <Separator />
      <AddExceptionForm periods={periods} />
    </Card>
  );
}

function AddExceptionForm({
  periods,
}: {
  periods: readonly ServicePeriodOption[];
}) {
  const [kind, setKind] = useState<BookingException['kind']>('CLOSED_ALL_DAY');
  const [state, formAction] = useActionState(
    createExceptionAction,
    initialBookingAdministrationActionState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const requiresService = kind === 'CLOSED_SERVICE';
  const requiresTimes = kind === 'MODIFIED_HOURS' || kind === 'BLOCKED_SLOT';
  const supportsCapacity = kind === 'MODIFIED_HOURS';

  useEffect(() => {
    if (state.status === 'success') {
      formRef.current?.reset();
      setKind('CLOSED_ALL_DAY');
    }
  }, [state.status]);

  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-action-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring [&::-webkit-details-marker]:hidden">
        <Plus className="h-4 w-4" aria-hidden />
        Ajouter une exception
      </summary>
      <form
        ref={formRef}
        action={formAction}
        className="grid gap-3 border-t border-border-default p-4"
      >
        <FormField
          label={<Label htmlFor="exception-date">Date</Label>}
          error={state.fieldErrors.date}
        >
          <Input id="exception-date" name="date" type="date" required />
        </FormField>
        <FormField
          label={<Label htmlFor="exception-kind">Type</Label>}
          error={state.fieldErrors.kind}
        >
          <select
            id="exception-kind"
            name="kind"
            value={kind}
            onChange={(event) =>
              setKind(event.target.value as BookingException['kind'])
            }
            className="h-10 rounded-lg border border-border-default bg-surface px-3 text-sm"
          >
            <option value="CLOSED_ALL_DAY">Fermeture exceptionnelle</option>
            <option value="CLOSED_SERVICE">Service fermé</option>
            <option value="MODIFIED_HOURS">Horaires modifiés</option>
            <option value="BLOCKED_SLOT">Créneau bloqué</option>
          </select>
        </FormField>

        {(requiresService || requiresTimes) && (
          <FormField
            label={<Label htmlFor="exception-service">Service concerné</Label>}
            hint={
              requiresService
                ? undefined
                : 'Facultatif : tous les services par défaut.'
            }
            error={state.fieldErrors.servicePeriodId}
          >
            <select
              id="exception-service"
              name="servicePeriodId"
              required={requiresService}
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
        )}

        {requiresTimes && (
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label={<Label htmlFor="exception-start">Début</Label>}
              error={state.fieldErrors.startTime}
            >
              <Input
                id="exception-start"
                name="startTime"
                type="time"
                required
              />
            </FormField>
            <FormField
              label={<Label htmlFor="exception-end">Fin</Label>}
              error={state.fieldErrors.endTime}
            >
              <Input id="exception-end" name="endTime" type="time" required />
            </FormField>
          </div>
        )}

        {supportsCapacity && (
          <FormField
            label={<Label htmlFor="exception-capacity">Capacité forcée</Label>}
            hint="Laissez vide pour conserver la capacité habituelle."
            error={state.fieldErrors.capacityOverride}
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
        <BookingAdministrationActionMessage state={state} />
        <BookingAdministrationSubmitButton label="Ajouter l’exception" />
      </form>
    </details>
  );
}

function ExceptionRow({
  exception,
  locale,
}: {
  exception: BookingException;
  locale: string;
}) {
  const formattedDate = formatBookingExceptionDate(
    exception.exceptionDate,
    locale,
  );

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-lg px-2 py-2 hover:bg-surface-muted">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{formattedDate}</p>
        <p className="mt-1 truncate text-xs text-muted">
          {exceptionKindLabels[exception.kind]}
        </p>
      </div>
      <BookingAdministrationDeleteButton
        id={exception.id}
        action={deleteExceptionAction}
        accessibleLabel={`Supprimer l’exception du ${formattedDate}`}
        title="Supprimer cette exception ?"
        description="Cette exception sera supprimée définitivement."
      />
    </div>
  );
}
