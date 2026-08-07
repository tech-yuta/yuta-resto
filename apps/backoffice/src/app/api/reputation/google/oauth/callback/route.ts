import { upsertGoogleReputationConnectorCredentials } from '@yuta/db-cloud';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cloudDatabase as db } from '../../../../../../server/cloud-database';
import { requireReputationPermission } from '../../../../../../server/auth/permissions';
import {
  getAuthSecret,
  requireReputationTenant,
} from '../../../../../../server/auth/session';
import { encryptCredential } from '../../../../../../server/reputation/credential-crypto';
import {
  exchangeGoogleAuthorizationCode,
  GOOGLE_BUSINESS_PROFILE_SCOPE,
} from '../../../../../../server/reputation/google-business-profile-client';
import { getGoogleConnectorConfiguration } from '../../../../../../server/reputation/google-connector-config';
import { verifyGoogleOAuthState } from '../../../../../../server/reputation/google-oauth-state';

export const dynamic = 'force-dynamic';

const authorizationCodeSchema = z.string().trim().min(1).max(4_096);

export async function GET(request: NextRequest) {
  const redirect = (result: string) => {
    const response = NextResponse.redirect(
      new URL(`/parametres/integrations?google=${result}`, request.url),
    );
    response.cookies.set('yuta_google_oauth_state', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/reputation/google/oauth/callback',
      maxAge: 0,
    });
    return response;
  };

  const { session, tenant } = await requireReputationTenant(
    '/parametres/integrations',
  );
  requireReputationPermission(tenant, 'reputation.connector.manage');
  const state = verifyGoogleOAuthState(
    request.cookies.get('yuta_google_oauth_state')?.value,
    request.nextUrl.searchParams.get('state'),
    getAuthSecret(),
  );
  if (
    !state ||
    !tenant.establishmentId ||
    state.userId !== session.userId ||
    state.organizationId !== tenant.organizationId ||
    state.establishmentId !== tenant.establishmentId
  ) {
    return redirect('invalid_state');
  }
  if (request.nextUrl.searchParams.has('error')) return redirect('denied');
  const code = authorizationCodeSchema.safeParse(
    request.nextUrl.searchParams.get('code'),
  );
  if (!code.success) return redirect('invalid_response');

  try {
    const configuration = getGoogleConnectorConfiguration();
    const tokens = await exchangeGoogleAuthorizationCode(
      configuration,
      code.data,
    );
    if (!tokens.scopes.includes(GOOGLE_BUSINESS_PROFILE_SCOPE)) {
      throw new Error('Google Business Profile scope was not granted.');
    }
    await upsertGoogleReputationConnectorCredentials(db, tenant, {
      encryptedAccessToken: encryptCredential(
        tokens.accessToken,
        configuration.encryptionKey,
      ),
      ...(tokens.refreshToken
        ? {
            encryptedRefreshToken: encryptCredential(
              tokens.refreshToken,
              configuration.encryptionKey,
            ),
          }
        : {}),
      tokenExpiresAt: tokens.expiresAt,
      grantedScopes: tokens.scopes,
      actorUserId: session.userId,
    });
    return redirect('authorized');
  } catch (error: unknown) {
    console.error('Google Business Profile OAuth callback failed.', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return redirect('exchange_error');
  }
}
