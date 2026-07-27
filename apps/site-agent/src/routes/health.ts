import { localPosRoutes } from '@yuta/contracts/local-pos';
import { sendJson } from '../http';
import type { RouteHandler } from './types';

export const handleHealthRoute: RouteHandler = async ({
  request,
  response,
  url,
  service,
}) => {
  if (request.method !== 'GET' || url.pathname !== localPosRoutes.health) {
    return false;
  }

  const health = await service.getHealth();
  sendJson(response, health.status === 'ok' ? 200 : 503, health);
  return true;
};
