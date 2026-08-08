import { Button, Card, FormField, Input } from '@yuta/ui';
import { addReservationNoteAction } from '../reservation-actions';
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
  return (
    <Card padding="lg">
      <h2 className="text-lg font-semibold">Notes internes</h2>
      <form action={addReservationNoteAction} className="mt-4 space-y-3">
        <input type="hidden" name="reservationId" value={reservationId} />
        <FormField label="Note">
          <Input name="body" required maxLength={2000} />
        </FormField>
        <Button type="submit">Ajouter la note</Button>
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
