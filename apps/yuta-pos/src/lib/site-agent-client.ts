import {
  addLocalOrderItemInputSchema,
  createLocalChecksByItemsInputSchema,
  createLocalOrderInputSchema,
  localCatalogResponseSchema,
  localKitchenSendResponseSchema,
  localChecksResponseSchema,
  localOrderCommandSchema,
  localOrderDetailResponseSchema,
  localOrderItemCommandSchema,
  localOrderItemResponseSchema,
  localOrderResponseSchema,
  localOrdersQuerySchema,
  localOrdersResponseSchema,
  localPaymentCaptureResponseSchema,
  localPaymentSummaryResponseSchema,
  localPosRoutes,
  localUsersResponseSchema,
  payLocalCheckInputSchema,
  payLocalOrderInputSchema,
  siteAgentHealthResponseSchema,
  splitLocalOrderEquallyInputSchema,
  updateLocalOrderItemInputSchema,
  type AddLocalOrderItemInput,
  type CreateLocalChecksByItemsInput,
  type CreateLocalOrderInput,
  type LocalOrderCommand,
  type LocalOrderItemCommand,
  type LocalOrdersQuery,
  type PayLocalCheckInput,
  type PayLocalOrderInput,
  type UpdateLocalOrderItemInput,
} from '@yuta/contracts/local-pos';
import { z } from 'zod';

const posRuntimeEnvSchema = z.object({
  SITE_AGENT_URL: z.string().url().default('http://127.0.0.1:3004'),
});

const siteAgentErrorResponseSchema = z
  .object({
    error: z
      .object({
        code: z.string().min(1),
        message: z.string().min(1),
        requestId: z.string().min(1).optional(),
      })
      .strict(),
  })
  .strict();

type FetchImplementation = typeof fetch;

export class SiteAgentClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'SiteAgentClientError';
  }
}

export function createSiteAgentClient(input?: {
  baseUrl?: string;
  fetchImplementation?: FetchImplementation;
}) {
  const baseUrl = normalizeBaseUrl(
    input?.baseUrl ?? posRuntimeEnvSchema.parse(process.env).SITE_AGENT_URL,
  );
  const fetchImplementation = input?.fetchImplementation ?? fetch;

  async function request<T>(
    path: string,
    schema: { parse(value: unknown): T },
    init?: RequestInit,
  ): Promise<T> {
    const response = await fetchImplementation(`${baseUrl}${path}`, {
      ...init,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        ...init?.headers,
      },
    });
    const payload: unknown = await response.json();

    if (!response.ok) {
      const error = siteAgentErrorResponseSchema.safeParse(payload);
      if (error.success) {
        throw new SiteAgentClientError(
          response.status,
          error.data.error.code,
          error.data.error.message,
          error.data.error.requestId,
        );
      }
      throw new SiteAgentClientError(
        response.status,
        'INVALID_ERROR_RESPONSE',
        'The site agent returned an invalid error response.',
      );
    }

    return schema.parse(payload);
  }

  return {
    async getHealth() {
      return request(localPosRoutes.health, siteAgentHealthResponseSchema);
    },
    async listLocalUsers() {
      return request(localPosRoutes.localUsers, localUsersResponseSchema);
    },
    async getCatalog() {
      return request(localPosRoutes.catalog, localCatalogResponseSchema);
    },
    async listOrders(input: Partial<LocalOrdersQuery> = {}) {
      const query = localOrdersQuerySchema.parse(input);
      const search = new URLSearchParams({ limit: String(query.limit) });
      if (query.status) {
        search.set('status', query.status);
      }
      return request(
        `${localPosRoutes.orders}?${search.toString()}`,
        localOrdersResponseSchema,
      );
    },
    async createOrder(input: CreateLocalOrderInput) {
      const body = createLocalOrderInputSchema.parse(input);
      return request(localPosRoutes.orders, localOrderResponseSchema, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    },
    async getOrderDetail(orderId: string) {
      return request(
        `${localPosRoutes.orders}/${encodeURIComponent(orderId)}`,
        localOrderDetailResponseSchema,
      );
    },
    async addOrderItem(orderId: string, input: AddLocalOrderItemInput) {
      const body = addLocalOrderItemInputSchema.parse(input);
      return request(
        `${localPosRoutes.orders}/${encodeURIComponent(orderId)}/items`,
        localOrderItemResponseSchema,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
    },
    async updateOrderItem(
      orderItemId: string,
      input: UpdateLocalOrderItemInput,
    ) {
      const body = updateLocalOrderItemInputSchema.parse(input);
      return request(
        `${localPosRoutes.orderItems}/${encodeURIComponent(orderItemId)}`,
        localOrderItemResponseSchema,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
    },
    async executeOrderItemCommand(
      orderItemId: string,
      input: LocalOrderItemCommand,
    ) {
      const body = localOrderItemCommandSchema.parse(input);
      return request(
        `${localPosRoutes.orderItems}/${encodeURIComponent(orderItemId)}/commands`,
        localOrderItemResponseSchema,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
    },
    async executeOrderCommand(orderId: string, input: LocalOrderCommand) {
      const body = localOrderCommandSchema.parse(input);
      return request(
        `${localPosRoutes.orders}/${encodeURIComponent(orderId)}/commands`,
        body.action === 'send_to_kitchen'
          ? localKitchenSendResponseSchema
          : localOrderDetailResponseSchema,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
    },
    async getPaymentSummary(orderId: string) {
      return request(
        `${localPosRoutes.orders}/${encodeURIComponent(orderId)}/payment-summary`,
        localPaymentSummaryResponseSchema,
      );
    },
    async splitOrderEqually(orderId: string, parts: number) {
      const body = splitLocalOrderEquallyInputSchema.parse({ parts });
      return request(
        `${localPosRoutes.orders}/${encodeURIComponent(orderId)}/checks/equal`,
        localChecksResponseSchema,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
    },
    async createChecksByItems(
      orderId: string,
      input: CreateLocalChecksByItemsInput,
    ) {
      const body = createLocalChecksByItemsInputSchema.parse(input);
      return request(
        `${localPosRoutes.orders}/${encodeURIComponent(orderId)}/checks/by-items`,
        localChecksResponseSchema,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
    },
    async cancelOrderSplit(orderId: string) {
      return request(
        `${localPosRoutes.orders}/${encodeURIComponent(orderId)}/checks`,
        localOrderResponseSchema,
        { method: 'DELETE' },
      );
    },
    async payOrder(orderId: string, input: PayLocalOrderInput) {
      const body = payLocalOrderInputSchema.parse(input);
      return request(
        `${localPosRoutes.orders}/${encodeURIComponent(orderId)}/payments`,
        localPaymentCaptureResponseSchema,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
    },
    async payCheck(orderId: string, input: PayLocalCheckInput) {
      const parsed = payLocalCheckInputSchema.parse(input);
      const { checkId, ...body } = parsed;
      return request(
        `${localPosRoutes.orders}/${encodeURIComponent(orderId)}/checks/${encodeURIComponent(checkId)}/payments`,
        localPaymentCaptureResponseSchema,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
    },
  };
}

export const siteAgentClient = createSiteAgentClient();

function normalizeBaseUrl(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}
