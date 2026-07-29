import {
  localAuthLoginInputSchema,
  localAuthLogoutResponseSchema,
  localAuthSessionResponseSchema,
  localPosRoutes,
} from '@yuta/contracts/local-pos';
import { HttpError, readJsonBody, sendJson } from '../http';
import type { SiteAgentService } from '../services/site-agent-service';
import type { RouteHandler } from './types';

export const handleAuthRoutes: RouteHandler = async ({
  request,
  response,
  url,
  service,
}) => {
  if (request.method === 'POST' && url.pathname === localPosRoutes.authLogin) {
    const input = await readJsonBody(request, localAuthLoginInputSchema);
    sendJson(response, 200, await service.signIn(input));
    return true;
  }

  if (request.method === 'GET' && url.pathname === localPosRoutes.authSession) {
    const token = requireBearerToken(request.headers.authorization);
    const session = await service.findSession(token);
    if (!session) {
      throw new HttpError(
        401,
        'LOCAL_SESSION_INVALID',
        'The local session is missing, expired, or invalid.',
      );
    }
    sendJson(response, 200, localAuthSessionResponseSchema.parse({ session }));
    return true;
  }

  if (
    request.method === 'DELETE' &&
    url.pathname === localPosRoutes.authSession
  ) {
    const token = readBearerToken(request.headers.authorization);
    if (token) {
      await service.revokeSession(token);
    }
    sendJson(
      response,
      200,
      localAuthLogoutResponseSchema.parse({ success: true }),
    );
    return true;
  }

  return false;
};

export async function requireLocalManagementSession(
  authorization: string | string[] | undefined,
  service: SiteAgentService,
) {
  const token = requireBearerToken(authorization);
  const session = await service.findSession(token);
  if (!session) {
    throw new HttpError(
      401,
      'LOCAL_SESSION_INVALID',
      'The local session is missing, expired, or invalid.',
    );
  }
  if (!['admin', 'manager'].includes(session.user.role)) {
    throw new HttpError(
      403,
      'LOCAL_MANAGEMENT_FORBIDDEN',
      'Local management requires an admin or manager role.',
    );
  }
  return session;
}

function requireBearerToken(
  authorization: string | string[] | undefined,
): string {
  const token = readBearerToken(authorization);
  if (!token) {
    throw new HttpError(
      401,
      'LOCAL_SESSION_REQUIRED',
      'A local bearer session is required.',
    );
  }
  return token;
}

function readBearerToken(
  authorization: string | string[] | undefined,
): string | null {
  if (typeof authorization !== 'string') return null;
  const match = /^Bearer ([A-Za-z0-9_-]{32,200})$/.exec(authorization);
  return match?.[1] ?? null;
}
