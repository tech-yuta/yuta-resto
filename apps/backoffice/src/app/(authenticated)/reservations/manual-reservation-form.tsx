import { Button, Card, FormField, Input } from '@yuta/ui';
import { CalendarPlus } from 'lucide-react';
import { createManualReservationAction } from './reservation-actions';

export function ManualReservationForm({
  establishmentSlug,
  selectedDate,
}: {
  establishmentSlug: string;
  selectedDate: string;
}) {
  return (
    <Card padding="lg">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <CalendarPlus aria-hidden /> Ajouter une réservation
      </h2>
      <form
        action={createManualReservationAction}
        className="mt-4 grid gap-4 md:grid-cols-3"
      >
        <input
          type="hidden"
          name="establishmentSlug"
          value={establishmentSlug}
        />
        <FormField label="Date">
          <Input name="date" type="date" defaultValue={selectedDate} required />
        </FormField>
        <FormField label="Heure">
          <Input name="time" type="time" required />
        </FormField>
        <FormField label="Convives">
          <Input
            name="partySize"
            type="number"
            min={1}
            max={30}
            defaultValue={2}
            required
          />
        </FormField>
        <FormField label="Prénom">
          <Input name="firstName" required />
        </FormField>
        <FormField label="Nom">
          <Input name="lastName" required />
        </FormField>
        <FormField label="Téléphone">
          <Input name="phone" type="tel" required />
        </FormField>
        <FormField label="E-mail">
          <Input name="email" type="email" required />
        </FormField>
        <FormField label="Note">
          <Input name="specialRequirements" />
        </FormField>
        <div className="flex items-end">
          <Button type="submit">Créer</Button>
        </div>
      </form>
    </Card>
  );
}
