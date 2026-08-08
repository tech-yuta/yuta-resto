'use client';

import { useActionState } from 'react';
import { ReservationSubmitButton } from './reservation-action-feedback';
import { initialReservationActionState } from './reservation-action-state';
import { updateReservationStatusAction } from './reservation-actions';

export function ReservationStatusActionForm({
  reservationId,
  nextStatus,
  size = 'md',
}: {
  reservationId: string;
  nextStatus: string;
  size?: 'sm' | 'md';
}) {
  const [state, formAction] = useActionState(
    updateReservationStatusAction,
    initialReservationActionState,
  );
  const isDestructive = nextStatus === 'CANCELLED' || nextStatus === 'DECLINED';

  return (
    <form action={formAction}>
      <input type="hidden" name="reservationId" value={reservationId} />
      <input type="hidden" name="status" value={nextStatus} />
      <ReservationSubmitButton
        label={nextStatus}
        pendingLabel="Mise à jour…"
        variant={isDestructive ? 'danger' : 'outline'}
        size={size}
      />
      {state.message && state.status !== 'idle' ? (
        <p
          role={state.status === 'error' ? 'alert' : 'status'}
          className={`mt-1 max-w-64 text-xs ${
            state.status === 'error'
              ? 'text-status-danger'
              : 'text-status-success'
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
