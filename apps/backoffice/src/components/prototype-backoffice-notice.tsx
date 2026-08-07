import { Alert, AlertDescription, AlertTitle } from '@yuta/ui';
import { FlaskConical } from 'lucide-react';

export function PrototypeBackofficeNotice() {
  return (
    <Alert
      tone="warning"
      icon={<FlaskConical className="h-5 w-5" aria-hidden />}
    >
      <AlertTitle>Prototype avec données de démonstration</AlertTitle>
      <AlertDescription>
        Les informations affichées ne proviennent pas des données de votre
        établissement. Les actions de création, modification et export restent
        indisponibles tant que ce module n’est pas connecté à un service
        persistant.
      </AlertDescription>
    </Alert>
  );
}
