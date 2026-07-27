import { localPosRoutes } from '@yuta/contracts/local-pos';
import { sendJson } from '../http';
import type { RouteHandler } from './types';

export const handleLocalUsersRoute: RouteHandler = async ({
  request,
  response,
  url,
  service,
}) => {
  if (request.method !== 'GET' || url.pathname !== localPosRoutes.localUsers) {
    return false;
  }

  sendJson(response, 200, await service.listLocalUsers());
  return true;
};
