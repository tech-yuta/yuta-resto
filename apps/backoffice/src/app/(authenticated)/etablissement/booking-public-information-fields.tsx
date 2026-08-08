import { FormField, Label, Textarea } from '@yuta/ui';
import type { BookingSettings } from './booking-administration-model';

export function BookingPublicInformationFields({
  settings,
  fieldErrors,
}: {
  settings: BookingSettings | null;
  fieldErrors: Record<string, string>;
}) {
  return (
    <details className="group rounded-lg border border-border-default">
      <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring [&::-webkit-details-marker]:hidden">
        Informations publiques
      </summary>
      <div className="grid gap-3 border-t border-border-default p-3">
        <PublicTextareaField
          id="welcome-message"
          label="Message d’accueil"
          name="welcomeMessage"
          defaultValue={settings?.welcomeMessage ?? ''}
          error={fieldErrors.welcomeMessage}
        />
        <PublicTextareaField
          id="booking-policy"
          label="Politique de réservation"
          name="bookingPolicy"
          defaultValue={settings?.bookingPolicy ?? ''}
          error={fieldErrors.bookingPolicy}
        />
      </div>
    </details>
  );
}

function PublicTextareaField({
  id,
  label,
  name,
  defaultValue,
  error,
}: {
  id: string;
  label: string;
  name: string;
  defaultValue: string;
  error?: string;
}) {
  return (
    <FormField label={<Label htmlFor={id}>{label}</Label>} error={error}>
      <Textarea id={id} name={name} defaultValue={defaultValue} />
    </FormField>
  );
}
