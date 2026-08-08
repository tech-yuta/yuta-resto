'use client';

import { Alert, AlertDescription, Button } from '@yuta/ui';
import { useFormStatus } from 'react-dom';
import type { ReservationActionState } from './reservation-action-state';

export function ReservationActionMessage({
  state,
}: {
  state: ReservationActionState;
}) {
  if (!state.message || state.status === 'idle') return null;

  return (
    <Alert tone={state.status === 'success' ? 'success' : 'danger'}>
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  );
}

export function ReservationSubmitButton({
  label,
  pendingLabel,
  variant = 'primary',
  size = 'md',
}: {
  label: string;
  pendingLabel: string;
  variant?: 'primary' | 'outline' | 'danger';
  size?: 'sm' | 'md';
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      loading={pending}
      disabled={pending}
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}
