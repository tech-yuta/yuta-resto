import { Alert, AlertDescription, AlertTitle } from '@yuta/ui';
import { CheckCircle2 } from 'lucide-react';

export function ReservationsFeedback({ created }: { created: boolean }) {
  if (!created) return null;

  return (
    <Alert
      tone="success"
      icon={<CheckCircle2 className="h-5 w-5" aria-hidden />}
    >
      <AlertTitle>Réservation créée</AlertTitle>
      <AlertDescription>
        La réservation a été enregistrée et ajoutée au planning.
      </AlertDescription>
    </Alert>
  );
}
