import {
  createLocalUserInputSchema,
  localPosRoutes,
  localUserSchema,
  resetLocalUserPinInputSchema,
  updateLocalUserInputSchema,
} from '@yuta/contracts/local-pos';
import { readJsonBody, sendJson } from '../http';
import { requireLocalManagementSession } from './auth';
import type { RouteHandler } from './types';

export const handleLocalUsersRoute: RouteHandler = async ({
  request,
  response,
  url,
  service,
}) => {
  if (url.pathname === localPosRoutes.localUsers) {
    if (request.method === 'GET') {
      sendJson(response, 200, await service.listLocalUsers());
      return true;
    }
    if (request.method === 'POST') {
      const session = await requireLocalManagementSession(
        request.headers.authorization,
        service,
      );
      const input = await readJsonBody(request, createLocalUserInputSchema);
      sendJson(response, 201, await service.createLocalUser(session, input));
      return true;
    }
  }

  const match = new RegExp(
    `^${localPosRoutes.localUsers}/([^/]+)(/pin)?$`,
  ).exec(url.pathname);
  if (!match) return false;

  const userId = localUserSchema.shape.id.parse(match[1]);
  const session = await requireLocalManagementSession(
    request.headers.authorization,
    service,
  );
  if (request.method === 'PATCH' && !match[2]) {
    const input = await readJsonBody(request, updateLocalUserInputSchema);
    sendJson(
      response,
      200,
      await service.updateLocalUser(session, userId, input),
    );
    return true;
  }
  if (request.method === 'PATCH' && match[2] === '/pin') {
    const input = await readJsonBody(request, resetLocalUserPinInputSchema);
    sendJson(
      response,
      200,
      await service.resetLocalUserPin(session, userId, input),
    );
    return true;
  }

  return false;
};
