import { Alert, AlertDescription, AlertTitle } from '@yuta/ui';
import { KeyRound, TriangleAlert } from 'lucide-react';
import type { IntegrationResultMessage } from './integrations-model';

export function IntegrationStatusAlerts({
  resultMessage,
  configured,
  discoveryError,
}: {
  resultMessage: IntegrationResultMessage | undefined;
  configured: boolean;
  discoveryError: boolean;
}) {
  return (
    <>
      {resultMessage && (
        <Alert tone={resultMessage.tone}>
          <AlertTitle>{resultMessage.title}</AlertTitle>
          <AlertDescription>{resultMessage.description}</AlertDescription>
        </Alert>
      )}

      {!configured && (
        <Alert tone="warning" icon={<KeyRound className="h-5 w-5" />}>
          <AlertTitle>Configuration serveur requise</AlertTitle>
          <AlertDescription>
            Ajoutez les identifiants Google Business Profile, l’URI de
            redirection et une clé de chiffrement avant de connecter un compte.
          </AlertDescription>
        </Alert>
      )}

      {discoveryError && (
        <Alert tone="warning" icon={<TriangleAlert className="h-5 w-5" />}>
          <AlertTitle>Accès Google indisponible</AlertTitle>
          <AlertDescription>
            Reconnectez Google. Si le problème persiste, vérifiez que les API
            Business Profile sont activées pour le projet Google Cloud.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
