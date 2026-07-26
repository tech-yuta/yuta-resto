import 'server-only';

import {
  findGoogleReputationConnectorCredentials,
  updateGoogleReputationConnectorAccessToken,
} from '@yuta/db';
import { db } from '@yuta/db/client';
import type { TenantContext } from '@yuta/tenant';
import { decryptCredential, encryptCredential } from './credential-crypto';
import {
  GoogleBusinessProfileApiError,
  refreshGoogleAccessToken,
} from './google-business-profile-client';
import { getGoogleConnectorConfiguration } from './google-connector-config';

export async function getGoogleConnectorAccessToken(
  tenant: TenantContext,
): Promise<string | null> {
  const connector = await findGoogleReputationConnectorCredentials(db, tenant);
  if (!connector?.encryptedAccessToken) return null;
  const configuration = getGoogleConnectorConfiguration();
  if (
    connector.tokenExpiresAt &&
    connector.tokenExpiresAt.getTime() > Date.now() + 60_000
  ) {
    return decryptCredential(
      connector.encryptedAccessToken,
      configuration.encryptionKey,
    );
  }
  if (!connector.encryptedRefreshToken) return null;
  try {
    const refreshToken = decryptCredential(
      connector.encryptedRefreshToken,
      configuration.encryptionKey,
    );
    const tokens = await refreshGoogleAccessToken(configuration, refreshToken);
    await updateGoogleReputationConnectorAccessToken(db, tenant, {
      encryptedAccessToken: encryptCredential(
        tokens.accessToken,
        configuration.encryptionKey,
      ),
      tokenExpiresAt: tokens.expiresAt,
      grantedScopes: tokens.scopes,
    });
    return tokens.accessToken;
  } catch (error: unknown) {
    if (
      error instanceof GoogleBusinessProfileApiError &&
      [400, 401].includes(error.status)
    ) {
      return null;
    }
    throw error;
  }
}
