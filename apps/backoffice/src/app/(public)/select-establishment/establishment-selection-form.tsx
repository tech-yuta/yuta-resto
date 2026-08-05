'use client';

import { Button } from '@yuta/ui';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  selectEstablishmentAction,
  type EstablishmentSelectionActionState,
} from './actions';

const initialState: EstablishmentSelectionActionState = { error: null };

export function EstablishmentSelectionForm({
  membershipId,
  returnTo,
}: {
  membershipId: string;
  returnTo: string;
}) {
  const [state, formAction] = useActionState(
    selectEstablishmentAction,
    initialState,
  );
  return (
    <form action={formAction} className="mt-4">
      <input type="hidden" name="membershipId" value={membershipId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <SelectionSubmitButton />
      {state.error && (
        <p className="mt-2 text-sm text-status-danger" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}

function SelectionSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth loading={pending} disabled={pending}>
      {pending ? 'Ouverture…' : 'Continuer'}
    </Button>
  );
}
