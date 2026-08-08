import { Button, Card, FormField, Input } from '@yuta/ui';
import { updateReservationDetailsAction } from '../reservation-actions';
import type { ReservationDetailRecord } from './reservation-detail-model';

export function ReservationEditForm({
  reservation,
}: {
  reservation: ReservationDetailRecord;
}) {
  return (
    <Card padding="lg" className="lg:col-span-2">
      <h2 className="text-lg font-semibold">Modifier la réservation</h2>
      <form
        action={updateReservationDetailsAction}
        className="mt-4 grid gap-4 md:grid-cols-4"
      >
        <input type="hidden" name="reservationId" value={reservation.id} />
        <FormField label="Date">
          <Input
            name="date"
            type="date"
            defaultValue={reservation.localDate}
            required
          />
        </FormField>
        <FormField label="Heure">
          <Input
            name="time"
            type="time"
            defaultValue={reservation.localTime.slice(0, 5)}
            required
          />
        </FormField>
        <FormField label="Convives">
          <Input
            name="partySize"
            type="number"
            min={1}
            defaultValue={reservation.partySize}
            required
          />
        </FormField>
        <FormField label="Prénom">
          <Input
            name="guestFirstName"
            defaultValue={reservation.guestFirstName}
            required
          />
        </FormField>
        <FormField label="Nom">
          <Input
            name="guestLastName"
            defaultValue={reservation.guestLastName}
            required
          />
        </FormField>
        <FormField label="E-mail">
          <Input
            name="guestEmail"
            type="email"
            defaultValue={reservation.guestEmail}
            required
          />
        </FormField>
        <FormField label="Téléphone">
          <Input
            name="guestPhone"
            type="tel"
            defaultValue={reservation.guestPhone}
            required
          />
        </FormField>
        <FormField label="Demande">
          <Input
            name="specialRequirements"
            defaultValue={reservation.specialRequirements ?? ''}
          />
        </FormField>
        <div className="flex items-end">
          <Button type="submit">Enregistrer les modifications</Button>
        </div>
      </form>
    </Card>
  );
}
