import { Button } from '@yuta/ui';
import { ExternalLink, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { BackofficePage } from '../../../../components/backoffice-page';
import { requireReputationPermission } from '../../../../server/auth/permissions';
import { requireReputationTenant } from '../../../../server/auth/session';
import { GoogleConnectorPanel } from './google-connector-panel';
import { loadGoogleIntegrationPageData } from './google-integration-loader';
import { GoogleLocationSelectorPanel } from './google-location-selector-panel';
import { IntegrationStatusAlerts } from './integration-status-alerts';
import type { IntegrationSearchParams } from './integrations-model';

export const dynamic = 'force-dynamic';

export default async function SettingsIntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<IntegrationSearchParams>;
}) {
  const params = await searchParams;
  const { tenant } = await requireReputationTenant('/parametres/integrations');
  requireReputationPermission(tenant, 'reputation.connector.manage');
  const data = await loadGoogleIntegrationPageData(tenant, params);

  return (
    <BackofficePage
      title="Intégrations"
      description="Connectez les services externes utilisés par votre établissement."
      actions={
        data.configured ? (
          <Button asChild variant={data.connector ? 'outline' : 'primary'}>
            <Link href="/api/reputation/google/oauth/start">
              {data.connector ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              {data.connector ? 'Reconnecter Google' : 'Connecter Google'}
            </Link>
          </Button>
        ) : undefined
      }
    >
      <IntegrationStatusAlerts
        resultMessage={data.resultMessage}
        configured={data.configured}
        discoveryError={data.discoveryError}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <GoogleConnectorPanel connector={data.connector} />
        <GoogleLocationSelectorPanel
          accounts={data.accounts}
          locations={data.locations}
          selectedAccount={data.selectedAccount}
          connector={data.connector}
        />
      </div>
    </BackofficePage>
  );
}
