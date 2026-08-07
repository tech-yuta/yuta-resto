'use client';

import { Button, Textarea } from '@yuta/ui';
import { StickyNote } from 'lucide-react';
import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createInternalNoteAction } from './actions';
import {
  initialReputationActionState,
  ReviewActionMessage,
} from './review-action-feedback';
import { formatAbsoluteDate, type ReviewDetailRecord } from './reviews-model';

export function ReviewNotesSection({
  review,
  canCreateNote,
}: {
  review: ReviewDetailRecord;
  canCreateNote: boolean;
}) {
  const [state, action] = useActionState(
    createInternalNoteAction,
    initialReputationActionState,
  );
  const [note, setNote] = useState('');

  useEffect(() => {
    if (state.success) setNote('');
  }, [state.success]);

  return (
    <section className="border-t border-border-default p-4">
      <h2 className="flex items-center gap-2 font-bold text-brand-800">
        <StickyNote className="h-4 w-4" />
        Notes internes
      </h2>
      {review.notes.length > 0 ? (
        <div className="mt-3 grid gap-2">
          {review.notes.map((internalNote) => (
            <div
              key={internalNote.id}
              className="rounded-lg bg-surface-muted p-3"
            >
              <p className="text-sm leading-5">{internalNote.content}</p>
              <p className="mt-2 text-xs text-muted">
                {internalNote.authorName} ·{' '}
                {formatAbsoluteDate(internalNote.createdAt)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted">
          Aucune note interne pour cet avis.
        </p>
      )}
      <form action={action} className="mt-3">
        <input type="hidden" name="feedbackId" value={review.id} />
        <Textarea
          name="content"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Ajouter une note visible uniquement par l'équipe…"
          maxLength={4_000}
          disabled={!canCreateNote}
        />
        <ReviewActionMessage state={state} />
        <div className="mt-3 flex justify-end">
          <NoteSubmit disabled={!canCreateNote || note.trim().length === 0} />
        </div>
      </form>
    </section>
  );
}

function NoteSubmit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="secondary"
      size="sm"
      loading={pending}
      disabled={disabled || pending}
    >
      Ajouter la note
    </Button>
  );
}
