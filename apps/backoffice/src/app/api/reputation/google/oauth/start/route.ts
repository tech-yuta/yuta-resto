import { NextResponse } from 'next/server';
import { requireReputationPermission } from '../../../../../../server/auth/permissions';
import {
  getAuthSecret,
  requireReputationTenant,
} from '../../../../../../server/auth/session';
import { createGoogleAuthorizationUrl } from '../../../../../../server/reputation/google-business-profile-client';
import {
  getGoogleConnectorConfiguration,
  GoogleConnectorConfigurationError,
} from '../../../../../../server/reputation/google-connector-config';
import { createGoogleOAuthState } from '../../../../../../server/reputation/google-oauth-state';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { session, tenant } = await requireReputationTenant(
    '/settings/integrations',
  );
  requireReputationPermission(tenant, 'reputation.connector.manage');
  if (!tenant.establishmentId) {
    return redirectToSettings(request, 'tenant_error');
  }

  try {
    const configuration = getGoogleConnectorConfiguration();
    const oauthState = createGoogleOAuthState(
      {
        userId: session.userId,
        organizationId: tenant.organizationId,
        establishmentId: tenant.establishmentId,
      },
      getAuthSecret(),
    );
    const response = NextResponse.redirect(
      createGoogleAuthorizationUrl(configuration, oauthState.state),
    );
    response.cookies.set('yuta_google_oauth_state', oauthState.cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/reputation/google/oauth/callback',
      maxAge: 10 * 60,
    });
    return response;
  } catch (error: unknown) {
    if (!(error instanceof GoogleConnectorConfigurationError)) {
      console.error('Unable to start Google Business Profile OAuth.', error);
    }
    return redirectToSettings(request, 'configuration_error');
  }
}

function redirectToSettings(request: Request, result: string): NextResponse {
  return NextResponse.redirect(
    new URL(`/settings/integrations?google=${result}`, request.url),
  );
}
