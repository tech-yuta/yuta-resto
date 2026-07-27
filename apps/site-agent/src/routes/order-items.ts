import { identifierSchema } from '@yuta/contracts/common';
import {
  localOrderItemCommandSchema,
  updateLocalOrderItemInputSchema,
} from '@yuta/contracts/local-pos';
import { readJsonBody, sendJson } from '../http';
import type { RouteHandler } from './types';

export const handleOrderItemsRoute: RouteHandler = async ({
  request,
  response,
  url,
  service,
}) => {
  const itemMatch = /^\/api\/v1\/order-items\/([^/]+)$/.exec(url.pathname);
  const commandMatch = /^\/api\/v1\/order-items\/([^/]+)\/commands$/.exec(
    url.pathname,
  );

  if (itemMatch && request.method === 'PATCH') {
    const input = await readJsonBody(request, updateLocalOrderItemInputSchema);
    sendJson(
      response,
      200,
      await service.updateOrderItem(
        identifierSchema.parse(itemMatch[1]),
        input,
      ),
    );
    return true;
  }

  if (commandMatch && request.method === 'POST') {
    const command = await readJsonBody(request, localOrderItemCommandSchema);
    sendJson(
      response,
      200,
      await service.executeOrderItemCommand(
        identifierSchema.parse(commandMatch[1]),
        command,
      ),
    );
    return true;
  }

  return false;
};
