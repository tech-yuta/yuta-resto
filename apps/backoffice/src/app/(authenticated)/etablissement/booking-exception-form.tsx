'use client';

import { Plus } from 'lucide-react';
import { useActionState, useEffect, useRef, useState } from 'react';
import {
  BookingAdministrationActionMessage,
  BookingAdministrationSubmitButton,
  initialBookingAdministrationActionState,
} from './booking-administration-action-feedback';
import type {
  BookingException,
  ServicePeriodOption,
} from './booking-administration-model';
import { createExceptionAction } from './booking-exception-actions';
import { BookingExceptionFields } from './booking-exception-fields';

export function BookingExceptionForm({
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
        <BookingExceptionFields
          kind={kind}
          periods={periods}
          fieldErrors={state.fieldErrors}
          onKindChange={setKind}
        />
        <BookingAdministrationActionMessage state={state} />
        <BookingAdministrationSubmitButton label="Ajouter l’exception" />
      </form>
    </details>
  );
}
