'use client';

import { Card, FormField, Input, Label } from '@yuta/ui';
import { useActionState, useEffect, useRef, useState } from 'react';
import {
  ReservationActionMessage,
  ReservationSubmitButton,
} from '../reservation-action-feedback';
import { initialReservationActionState } from '../reservation-action-state';
import { addReservationNoteAction } from '../reservation-actions';
import {
  reservationFieldError,
  reservationFieldErrorId,
} from '../reservation-field-accessibility';
import {
  formatReservationEventDate,
  type ReservationNoteRecord,
} from './reservation-detail-model';

export function ReservationNotes({
  reservationId,
  notes,
  locale,
  timezone,
}: {
  reservationId: string;
  notes: readonly ReservationNoteRecord[];
  locale: string;
  timezone: string;
}) {
  const [state, formAction] = useActionState(
    addReservationNoteAction,
    initialReservationActionState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [body, setBody] = useState('');

  useEffect(() => {
    if (state.status === 'success') {
      formRef.current?.reset();
      setBody('');
    }
  }, [state]);

  return (
    <Card padding="lg">
      <h2 className="text-lg font-semibold">Notes internes</h2>
      <form ref={formRef} action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="reservationId" value={reservationId} />
        <FormField
          label={<Label htmlFor="reservation-note-body">Note</Label>}
          error={reservationFieldError(
            'reservation-note-body',
            state.fieldErrors.body,
          )}
        >
          <Input
            id="reservation-note-body"
            name="body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            required
            maxLength={2000}
            aria-invalid={Boolean(state.fieldErrors.body)}
            aria-describedby={reservationFieldErrorId(
              'reservation-note-body',
              state.fieldErrors.body,
            )}
          />
        </FormField>
        <ReservationActionMessage state={state} />
        <ReservationSubmitButton
          label="Ajouter la note"
          pendingLabel="Ajout…"
        />
      </form>
      <div className="mt-5 space-y-2">
        {notes.map((note) => (
          <div
            key={note.id}
            className="rounded-md bg-surface-muted p-3 text-sm"
          >
            <p>{note.body}</p>
            <time className="mt-1 block text-xs text-muted">
              {formatReservationEventDate(note.createdAt, locale, timezone)}
            </time>
          </div>
        ))}
        {notes.length === 0 && (
          <p className="text-sm text-muted">Aucune note interne.</p>
        )}
      </div>
    </Card>
  );
}
