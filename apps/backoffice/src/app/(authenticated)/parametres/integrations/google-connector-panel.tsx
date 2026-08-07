import { Badge, Panel } from '@yuta/ui';
import {
  getGoogleConnectorPresentation,
  type GoogleConnectorSummary,
} from './integrations-model';

export function GoogleConnectorPanel({
  connector,
}: {
  connector: GoogleConnectorSummary | null;
}) {
  const presentation = getGoogleConnectorPresentation(connector);

  return (
    <Panel
      title="Google Business Profile"
      description="Import des avis et publication des réponses."
      bodyClassName="gap-4 p-5"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={presentation.connected ? 'success' : 'neutral'}>
          {presentation.label}
        </Badge>
        {connector?.tokenExpiresAt && (
          <span className="text-sm text-secondary">
            Jeton valable jusqu’au{' '}
            {new Intl.DateTimeFormat('fr-FR', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(connector.tokenExpiresAt)}
          </span>
        )}
      </div>
      {presentation.connected ? (
        <div className="rounded-lg bg-surface-muted p-4 text-sm">
          <p className="font-semibold text-primary">
            Ressource Google sélectionnée
          </p>
          <p className="mt-2 break-all text-secondary">
            {connector?.externalAccountId}
          </p>
          <p className="mt-1 break-all text-secondary">
            {connector?.externalLocationId}
          </p>
        </div>
      ) : (
        <p className="text-sm text-secondary">
          L’autorisation Google et la sélection d’un établissement sont
          nécessaires avant la synchronisation.
        </p>
      )}
      <p className="text-xs text-muted">
        Les jetons OAuth sont chiffrés avant leur stockage et ne sont jamais
        envoyés au navigateur.
      </p>
    </Panel>
  );
}
