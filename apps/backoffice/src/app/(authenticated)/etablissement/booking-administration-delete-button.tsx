'use client';

import { ConfirmDialog, IconButton } from '@yuta/ui';
import { Trash2 } from 'lucide-react';
import { useActionState, useRef, useState } from 'react';
import type { BookingAdministrationActionState } from '../operations/reservations/actions';
import { initialBookingAdministrationActionState } from './booking-administration-action-feedback';

type DeleteAction = (
  previousState: BookingAdministrationActionState,
  formData: FormData,
) => Promise<BookingAdministrationActionState>;

export function BookingAdministrationDeleteButton({
  id,
  action,
  accessibleLabel,
  title,
  description,
}: {
  id: string;
  action: DeleteAction;
  accessibleLabel: string;
  title: string;
  description: string;
}) {
  const [state, formAction] = useActionState(
    action,
    initialBookingAdministrationActionState,
  );
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="justify-self-end">
      <form ref={formRef} action={formAction}>
        <input type="hidden" name="id" value={id} />
        <IconButton
          type="button"
          variant="ghost"
          size="sm"
          aria-label={accessibleLabel}
          title={accessibleLabel}
          className="text-status-danger"
          onClick={() => setOpen(true)}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </IconButton>
      </form>
      {state.status === 'error' && (
        <p
          className="mt-1 max-w-40 text-right text-xs font-medium text-status-danger"
          role="alert"
        >
          {state.message}
        </p>
      )}
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={() => {
          setOpen(false);
          formRef.current?.requestSubmit();
        }}
      />
    </div>
  );
}
