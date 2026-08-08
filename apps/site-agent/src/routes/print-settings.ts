import {
  localPosRoutes,
  updateLocalPrintSettingsInputSchema,
} from '@yuta/contracts/local-pos';
import { readJsonBody, sendJson } from '../http';
import { requireLocalManagementSession } from './auth';
import type { RouteHandler } from './types';

export const handlePrintSettingsRoutes: RouteHandler = async ({
  request,
  response,
  url,
  service,
}) => {
  if (url.pathname !== localPosRoutes.printSettings) return false;
  await requireLocalManagementSession(request.headers.authorization, service);
  if (request.method === 'GET') {
    sendJson(response, 200, await service.getPrintSettings());
    return true;
  }
  if (request.method === 'PATCH') {
    const input = await readJsonBody(
      request,
      updateLocalPrintSettingsInputSchema,
    );
    sendJson(response, 200, await service.updatePrintSettings(input));
    return true;
  }
  return false;
};
