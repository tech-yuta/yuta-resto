import { findGoogleReputationConnector } from '@yuta/db-cloud';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  Panel,
} from '@yuta/ui';
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react';
import Link from 'next/link';
import { BackofficePage } from '../../../../components/backoffice-page';
import { requireReputationPermission } from '../../../../server/auth/permissions';
import { cloudDatabase as db } from '../../../../server/cloud-database';
import { requireReputationTenant } from '../../../../server/auth/session';
import { getGoogleConnectorAccessToken } from '../../../../server/reputation/google-connector-access';
import {
  listGoogleBusinessAccounts,
  listGoogleBusinessLocations,
  type GoogleBusinessAccount,
  type GoogleBusinessLocation,
} from '../../../../server/reputation/google-business-profile-client';
import { isGoogleConnectorConfigured } from '../../../../server/reputation/google-connector-config';
import { selectGoogleLocationAction } from './actions';

export const dynamic = 'force-dynamic';

type IntegrationSearchParams = Record<string, string | string[] | undefined>;

const resultMessages: Record<
  string,
  { tone: 'success' | 'warning' | 'danger'; title: string; description: string }
> = {
  authorized: {
    tone: 'success',
    title: 'Compte Google autorisé',
    description:
      "Choisissez maintenant le compte et l'établissement Google à associer.",
  },
  location_selected: {
    tone: 'success',
    title: 'Établissement Google connecté',
    description:
      'La connexion est prête. La synchronisation des avis sera ajoutée à la prochaine étape.',
  },
  denied: {
    tone: 'warning',
    title: 'Autorisation annulée',
    description: "Google n'a accordé aucun accès à YUTA.",
  },
  invalid_state: {
    tone: 'danger',
    title: 'Session OAuth invalide',
    description: 'Relancez la connexion Google depuis cette page.',
  },
  invalid_response: {
    tone: 'danger',
    title: 'Réponse Google incomplète',
    description: 'Relancez la connexion Google.',
  },
  exchange_error: {
    tone: 'danger',
    title: 'Connexion Google impossible',
    description:
      "Vérifiez la configuration OAuth et l'accès aux API Business Profile.",
  },
  configuration_error: {
    tone: 'danger',
    title: 'Configuration Google incomplète',
    description:
      "Les identifiants OAuth, l'URI de redirection ou la clé de chiffrement sont absents.",
  },
  auth_expired: {
    tone: 'warning',
    title: 'Autorisation Google expirée',
    description: 'Reconnectez le compte Google pour continuer.',
  },
  invalid_location: {
    tone: 'danger',
    title: 'Établissement Google invalide',
    description:
      "Le compte ou l'établissement sélectionné n'est plus accessible.",
  },
  location_error: {
    tone: 'danger',
    title: 'Sélection impossible',
    description: "YUTA n'a pas pu vérifier cet établissement auprès de Google.",
  },
  tenant_error: {
    tone: 'danger',
    title: 'Établissement YUTA requis',
    description: 'Sélectionnez un établissement YUTA avant de continuer.',
  },
};

export default async function SettingsIntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<IntegrationSearchParams>;
}) {
  const params = await searchParams;
  const { tenant } = await requireReputationTenant('/parametres/integrations');
  requireReputationPermission(tenant, 'reputation.connector.manage');

  const configured = isGoogleConnectorConfigured();
  const connector = await findGoogleReputationConnector(db, tenant);
  const requestedAccount = filterValue(params.googleAccount);
  const result = filterValue(params.google);
  let accounts: GoogleBusinessAccount[] = [];
  let locations: GoogleBusinessLocation[] = [];
  let selectedAccount: string | null = null;
  let discoveryError = false;

  if (configured && connector?.hasAccessToken) {
    try {
      const accessToken = await getGoogleConnectorAccessToken(tenant);
      if (accessToken) {
        accounts = await listGoogleBusinessAccounts(accessToken);
        selectedAccount = resolveSelectedAccount(
          accounts,
          requestedAccount,
          connector.externalAccountId,
        );
        if (selectedAccount) {
          locations = await listGoogleBusinessLocations(
            accessToken,
            selectedAccount,
          );
        }
      } else {
        discoveryError = true;
      }
    } catch (error: unknown) {
      discoveryError = true;
      console.error('Unable to discover Google Business Profile resources.', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
    }
  }

  const resultMessage = result ? resultMessages[result] : undefined;
  const connected =
    connector?.status === 'CONNECTED' &&
    Boolean(connector.externalAccountId) &&
    Boolean(connector.externalLocationId);

  return (
    <BackofficePage
      title="Intégrations"
      description="Connectez les services externes utilisés par votre établissement."
      actions={
        configured ? (
          <Button asChild variant={connector ? 'outline' : 'primary'}>
            <Link href="/api/reputation/google/oauth/start">
              {connector ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              {connector ? 'Reconnecter Google' : 'Connecter Google'}
            </Link>
          </Button>
        ) : undefined
      }
    >
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

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Panel
          title="Google Business Profile"
          description="Import des avis et publication des réponses."
          bodyClassName="gap-4 p-5"
        >
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={connected ? 'success' : 'neutral'}>
              {connected
                ? 'Connecté'
                : connector
                  ? 'À finaliser'
                  : 'Non connecté'}
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
          {connected ? (
            <div className="rounded-lg bg-surface-muted p-4 text-sm">
              <p className="font-semibold text-primary">
                Ressource Google sélectionnée
              </p>
              <p className="mt-2 break-all text-secondary">
                {connector.externalAccountId}
              </p>
              <p className="mt-1 break-all text-secondary">
                {connector.externalLocationId}
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

        <Panel
          title="Compte et établissement Google"
          description="Sélectionnez le profil correspondant à l’établissement YUTA actif."
          bodyClassName="gap-5 p-5"
        >
          {accounts.length === 0 ? (
            <div className="py-8 text-center">
              <Building2 className="mx-auto h-8 w-8 text-muted" />
              <p className="mt-3 font-semibold text-primary">
                Aucun compte Google chargé
              </p>
              <p className="mt-1 text-sm text-secondary">
                Connectez Google pour afficher les comptes et établissements
                accessibles.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {accounts.map((account) => (
                  <Button
                    key={account.name}
                    asChild
                    size="sm"
                    variant={
                      account.name === selectedAccount ? 'primary' : 'outline'
                    }
                  >
                    <Link
                      href={`/parametres/integrations?googleAccount=${encodeURIComponent(account.name)}`}
                    >
                      {account.accountName ?? account.name}
                    </Link>
                  </Button>
                ))}
              </div>

              {locations.length === 0 ? (
                <Alert tone="info">
                  <AlertTitle>Aucun établissement accessible</AlertTitle>
                  <AlertDescription>
                    Vérifiez les droits du compte Google et la validation du
                    profil d’établissement.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-3">
                  {locations.map((location) => {
                    const isSelected =
                      connector?.externalAccountId === selectedAccount &&
                      connector.externalLocationId === location.name;
                    return (
                      <Card
                        key={location.name}
                        padding="sm"
                        className="flex flex-wrap items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-primary">
                              {location.title}
                            </p>
                            {isSelected && (
                              <Badge tone="success">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Sélectionné
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-secondary">
                            {formatLocationAddress(location)}
                          </p>
                          {location.storeCode && (
                            <p className="mt-1 text-xs text-muted">
                              Code magasin : {location.storeCode}
                            </p>
                          )}
                        </div>
                        {!isSelected && selectedAccount && (
                          <form action={selectGoogleLocationAction}>
                            <input
                              type="hidden"
                              name="accountName"
                              value={selectedAccount}
                            />
                            <input
                              type="hidden"
                              name="locationName"
                              value={location.name}
                            />
                            <Button type="submit" size="sm">
                              Sélectionner
                            </Button>
                          </form>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </Panel>
      </div>
    </BackofficePage>
  );
}

function resolveSelectedAccount(
  accounts: GoogleBusinessAccount[],
  requestedAccount: string | undefined,
  connectedAccount: string,
): string | null {
  if (
    requestedAccount &&
    accounts.some(({ name }) => name === requestedAccount)
  ) {
    return requestedAccount;
  }
  if (
    connectedAccount &&
    accounts.some(({ name }) => name === connectedAccount)
  ) {
    return connectedAccount;
  }
  return accounts.length === 1 ? (accounts[0]?.name ?? null) : null;
}

function formatLocationAddress(location: GoogleBusinessLocation): string {
  const address = location.storefrontAddress;
  const parts = [
    ...(address?.addressLines ?? []),
    [address?.postalCode, address?.locality].filter(Boolean).join(' '),
  ].filter(Boolean);
  return parts.join(', ') || location.name;
}

function filterValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
