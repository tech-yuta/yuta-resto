import {
  addLocalOrderItemInputSchema,
  createLocalOrderInputSchema,
  localOrderCommandSchema,
  localOrdersQuerySchema,
  localPosRoutes,
} from '@yuta/contracts/local-pos';
import { identifierSchema } from '@yuta/contracts/common';
import { readJsonBody, sendJson } from '../http';
import type { RouteHandler } from './types';

export const handleOrdersRoute: RouteHandler = async ({
  request,
  response,
  url,
  service,
}) => {
  if (url.pathname !== localPosRoutes.orders) {
    const detailMatch = /^\/api\/v1\/orders\/([^/]+)$/.exec(url.pathname);
    const itemsMatch = /^\/api\/v1\/orders\/([^/]+)\/items$/.exec(url.pathname);
    const commandsMatch = /^\/api\/v1\/orders\/([^/]+)\/commands$/.exec(
      url.pathname,
    );

    if (detailMatch && request.method === 'GET') {
      sendJson(
        response,
        200,
        await service.getOrderDetail(identifierSchema.parse(detailMatch[1])),
      );
      return true;
    }
    if (itemsMatch && request.method === 'POST') {
      const input = await readJsonBody(request, addLocalOrderItemInputSchema);
      sendJson(
        response,
        201,
        await service.addOrderItem(
          identifierSchema.parse(itemsMatch[1]),
          input,
        ),
      );
      return true;
    }
    if (commandsMatch && request.method === 'POST') {
      const command = await readJsonBody(request, localOrderCommandSchema);
      sendJson(
        response,
        200,
        await service.executeOrderCommand(
          identifierSchema.parse(commandsMatch[1]),
          command,
        ),
      );
      return true;
    }

    return false;
  }

  if (request.method === 'GET') {
    const query = localOrdersQuerySchema.parse({
      status: url.searchParams.get('status') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });
    sendJson(response, 200, await service.listOrders(query));
    return true;
  }

  if (request.method === 'POST') {
    const input = await readJsonBody(request, createLocalOrderInputSchema);
    sendJson(response, 201, await service.createOrder(input));
    return true;
  }

  return false;
};
