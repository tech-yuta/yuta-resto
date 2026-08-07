'use client';

import { Alert, AlertDescription, Button } from '@yuta/ui';
import { useFormStatus } from 'react-dom';
import type { BookingAdministrationActionState } from '../operations/reservations/actions';

export const initialBookingAdministrationActionState: BookingAdministrationActionState =
  {
    status: 'idle',
    message: null,
    fieldErrors: {},
  };

export function BookingAdministrationSubmitButton({
  label,
  variant = 'primary',
  icon,
}: {
  label: string;
  variant?: 'primary' | 'success';
  icon?: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} fullWidth loading={pending}>
      {icon}
      {pending ? 'Enregistrement…' : label}
    </Button>
  );
}

export function BookingAdministrationActionMessage({
  state,
  className,
}: {
  state: BookingAdministrationActionState;
  className?: string;
}) {
  if (!state.message || state.status === 'idle') return null;

  return (
    <Alert
      tone={state.status === 'success' ? 'success' : 'danger'}
      className={className}
    >
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  );
}
