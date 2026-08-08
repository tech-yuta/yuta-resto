'use client';

import { Button } from '@yuta/ui';
import { useFormStatus } from 'react-dom';
import type { ReputationActionState } from './actions';

export const initialReputationActionState: ReputationActionState = {
  error: null,
  success: null,
};

export function ReviewActionMessage({
  state,
}: {
  state: ReputationActionState;
}) {
  if (state.error) {
    return (
      <p className="mt-2 text-xs font-medium text-status-danger" role="alert">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p className="mt-2 text-xs font-medium text-status-success" role="status">
        {state.success}
      </p>
    );
  }
  return null;
}

export function ReviewMutationSubmit({
  label,
  disabled,
}: {
  label: string;
  disabled: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="secondary"
      size="sm"
      loading={pending}
      disabled={disabled || pending}
    >
      {label}
    </Button>
  );
}
