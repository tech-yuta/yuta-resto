import { identifierSchema } from '@yuta/contracts/common';
import {
  createLocalChecksByItemsInputSchema,
  payLocalOrderInputSchema,
  splitLocalOrderEquallyInputSchema,
} from '@yuta/contracts/local-pos';
import { readJsonBody, sendJson } from '../http';
import type { RouteHandler } from './types';

export const handlePaymentRoutes: RouteHandler = async ({
  request,
  response,
  url,
  service,
}) => {
  const summaryMatch = /^\/api\/v1\/orders\/([^/]+)\/payment-summary$/.exec(
    url.pathname,
  );
  const equalMatch = /^\/api\/v1\/orders\/([^/]+)\/checks\/equal$/.exec(
    url.pathname,
  );
  const itemMatch = /^\/api\/v1\/orders\/([^/]+)\/checks\/by-items$/.exec(
    url.pathname,
  );
  const checksMatch = /^\/api\/v1\/orders\/([^/]+)\/checks$/.exec(url.pathname);
  const orderPaymentMatch = /^\/api\/v1\/orders\/([^/]+)\/payments$/.exec(
    url.pathname,
  );
  const checkPaymentMatch =
    /^\/api\/v1\/orders\/([^/]+)\/checks\/([^/]+)\/payments$/.exec(
      url.pathname,
    );

  if (summaryMatch && request.method === 'GET') {
    sendJson(
      response,
      200,
      await service.getPaymentSummary(identifierSchema.parse(summaryMatch[1])),
    );
    return true;
  }
  if (equalMatch && request.method === 'POST') {
    const input = await readJsonBody(
      request,
      splitLocalOrderEquallyInputSchema,
    );
    sendJson(
      response,
      201,
      await service.splitOrderEqually(
        identifierSchema.parse(equalMatch[1]),
        input.parts,
      ),
    );
    return true;
  }
  if (itemMatch && request.method === 'POST') {
    const input = await readJsonBody(
      request,
      createLocalChecksByItemsInputSchema,
    );
    sendJson(
      response,
      201,
      await service.createChecksByItems(
        identifierSchema.parse(itemMatch[1]),
        input,
      ),
    );
    return true;
  }
  if (checksMatch && request.method === 'DELETE') {
    sendJson(
      response,
      200,
      await service.cancelOrderSplit(identifierSchema.parse(checksMatch[1])),
    );
    return true;
  }
  if (orderPaymentMatch && request.method === 'POST') {
    const input = await readJsonBody(request, payLocalOrderInputSchema);
    sendJson(
      response,
      201,
      await service.payOrder(
        identifierSchema.parse(orderPaymentMatch[1]),
        input,
      ),
    );
    return true;
  }
  if (checkPaymentMatch && request.method === 'POST') {
    const input = await readJsonBody(request, payLocalOrderInputSchema);
    sendJson(
      response,
      201,
      await service.payCheck(identifierSchema.parse(checkPaymentMatch[1]), {
        ...input,
        checkId: identifierSchema.parse(checkPaymentMatch[2]),
      }),
    );
    return true;
  }
  return false;
};
