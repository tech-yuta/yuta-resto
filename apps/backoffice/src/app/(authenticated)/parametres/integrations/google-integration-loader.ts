import 'server-only';

import { findGoogleReputationConnector } from '@yuta/db-cloud';
import type { TenantContext } from '@yuta/tenant';
import { cloudDatabase as db } from '../../../../server/cloud-database';
import { getGoogleConnectorAccessToken } from '../../../../server/reputation/google-connector-access';
import {
  listGoogleBusinessAccounts,
  listGoogleBusinessLocations,
  type GoogleBusinessAccount,
  type GoogleBusinessLocation,
} from '../../../../server/reputation/google-business-profile-client';
import { isGoogleConnectorConfigured } from '../../../../server/reputation/google-connector-config';
import {
  filterIntegrationSearchParam,
  integrationResultMessages,
  resolveSelectedGoogleAccount,
  type IntegrationResultMessage,
  type IntegrationSearchParams,
} from './integrations-model';

export type GoogleIntegrationPageData = {
  configured: boolean;
  connector: Awaited<ReturnType<typeof findGoogleReputationConnector>>;
  accounts: GoogleBusinessAccount[];
  locations: GoogleBusinessLocation[];
  selectedAccount: string | null;
  discoveryError: boolean;
  resultMessage: IntegrationResultMessage | undefined;
};

export async function loadGoogleIntegrationPageData(
  tenant: TenantContext,
  params: IntegrationSearchParams,
): Promise<GoogleIntegrationPageData> {
  const configured = isGoogleConnectorConfigured();
  const connector = await findGoogleReputationConnector(db, tenant);
  const requestedAccount = filterIntegrationSearchParam(params.googleAccount);
  const result = filterIntegrationSearchParam(params.google);
  let accounts: GoogleBusinessAccount[] = [];
  let locations: GoogleBusinessLocation[] = [];
  let selectedAccount: string | null = null;
  let discoveryError = false;

  if (configured && connector?.hasAccessToken) {
    try {
      const accessToken = await getGoogleConnectorAccessToken(tenant);
      if (accessToken) {
        accounts = await listGoogleBusinessAccounts(accessToken);
        selectedAccount = resolveSelectedGoogleAccount(
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

  return {
    configured,
    connector,
    accounts,
    locations,
    selectedAccount,
    discoveryError,
    resultMessage: result ? integrationResultMessages[result] : undefined,
  };
}
