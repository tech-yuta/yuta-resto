import type { findGoogleReputationConnector } from '@yuta/db-cloud';
import type {
  GoogleBusinessAccount,
  GoogleBusinessLocation,
} from '../../../../server/reputation/google-business-profile-client';

export type IntegrationSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type GoogleConnectorSummary = NonNullable<
  Awaited<ReturnType<typeof findGoogleReputationConnector>>
>;

export type IntegrationResultMessage = {
  tone: 'success' | 'warning' | 'danger';
  title: string;
  description: string;
};

export const integrationResultMessages: Record<
  string,
  IntegrationResultMessage
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

export function filterIntegrationSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function resolveSelectedGoogleAccount(
  accounts: readonly GoogleBusinessAccount[],
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

export function formatGoogleLocationAddress(
  location: GoogleBusinessLocation,
): string {
  const address = location.storefrontAddress;
  const parts = [
    ...(address?.addressLines ?? []),
    [address?.postalCode, address?.locality].filter(Boolean).join(' '),
  ].filter(Boolean);
  return parts.join(', ') || location.name;
}

export function getGoogleConnectorPresentation(
  connector: GoogleConnectorSummary | null,
): { connected: boolean; label: string } {
  const connected =
    connector?.status === 'CONNECTED' &&
    Boolean(connector.externalAccountId) &&
    Boolean(connector.externalLocationId);

  return {
    connected,
    label: connected ? 'Connecté' : connector ? 'À finaliser' : 'Non connecté',
  };
}
