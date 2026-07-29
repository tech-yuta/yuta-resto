import {
  addLocalOrderItemInputSchema,
  createLocalCatalogCategoryInputSchema,
  createLocalCatalogItemInputSchema,
  createLocalComboGroupInputSchema,
  createLocalComboGroupItemInputSchema,
  createLocalComboRuleInputSchema,
  createLocalUserInputSchema,
  createLocalChecksByItemsInputSchema,
  createLocalOrderInputSchema,
  localAuthLoginInputSchema,
  localAuthLoginResponseSchema,
  localAuthLogoutResponseSchema,
  localAuthSessionResponseSchema,
  localCatalogResponseSchema,
  localCatalogCategoryResponseSchema,
  localCatalogItemResponseSchema,
  localComboDeleteResponseSchema,
  localComboGroupItemResponseSchema,
  localComboGroupResponseSchema,
  localComboRuleResponseSchema,
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
  localPrintJobsResponseSchema,
  localPrintJobSchema,
  localPosRoutes,
  localUserResponseSchema,
  localUsersResponseSchema,
  payLocalCheckInputSchema,
  payLocalOrderInputSchema,
  printJobCommandSchema,
  printJobsQuerySchema,
  siteAgentHealthResponseSchema,
  splitLocalOrderEquallyInputSchema,
  updateLocalCatalogCategoryInputSchema,
  updateLocalCatalogItemInputSchema,
  updateLocalComboGroupInputSchema,
  updateLocalComboGroupItemInputSchema,
  updateLocalComboRuleInputSchema,
  resetLocalUserPinInputSchema,
  updateLocalUserInputSchema,
  updateLocalOrderItemInputSchema,
  type AddLocalOrderItemInput,
  type CreateLocalCatalogCategoryInput,
  type CreateLocalCatalogItemInput,
  type CreateLocalComboGroupInput,
  type CreateLocalComboGroupItemInput,
  type CreateLocalComboRuleInput,
  type CreateLocalChecksByItemsInput,
  type CreateLocalOrderInput,
  type CreateLocalUserInput,
  type LocalAuthLoginInput,
  type LocalOrderCommand,
  type LocalOrderItemCommand,
  type LocalOrdersQuery,
  type PayLocalCheckInput,
  type PayLocalOrderInput,
  type PrintJobCommand,
  type PrintJobsQuery,
  type ResetLocalUserPinInput,
  type UpdateLocalCatalogCategoryInput,
  type UpdateLocalCatalogItemInput,
  type UpdateLocalComboGroupInput,
  type UpdateLocalComboGroupItemInput,
  type UpdateLocalComboRuleInput,
  type UpdateLocalUserInput,
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
    async signInLocalUser(input: LocalAuthLoginInput) {
      const body = localAuthLoginInputSchema.parse(input);
      return request(localPosRoutes.authLogin, localAuthLoginResponseSchema, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    },
    async getLocalSession(token: string) {
      return request(
        localPosRoutes.authSession,
        localAuthSessionResponseSchema,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    },
    async signOutLocalSession(token: string) {
      return request(
        localPosRoutes.authSession,
        localAuthLogoutResponseSchema,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    },
    async listLocalUsers() {
      return request(localPosRoutes.localUsers, localUsersResponseSchema);
    },
    async createLocalUser(token: string, input: CreateLocalUserInput) {
      const body = createLocalUserInputSchema.parse(input);
      return request(localPosRoutes.localUsers, localUserResponseSchema, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    },
    async updateLocalUser(
      token: string,
      userId: string,
      input: UpdateLocalUserInput,
    ) {
      const body = updateLocalUserInputSchema.parse(input);
      return request(
        `${localPosRoutes.localUsers}/${encodeURIComponent(userId)}`,
        localUserResponseSchema,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      );
    },
    async resetLocalUserPin(
      token: string,
      userId: string,
      input: ResetLocalUserPinInput,
    ) {
      const body = resetLocalUserPinInputSchema.parse(input);
      return request(
        `${localPosRoutes.localUsers}/${encodeURIComponent(userId)}/pin`,
        localUserResponseSchema,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      );
    },
    async getCatalog() {
      return request(localPosRoutes.catalog, localCatalogResponseSchema);
    },
    async createCatalogCategory(
      token: string,
      input: CreateLocalCatalogCategoryInput,
    ) {
      const body = createLocalCatalogCategoryInputSchema.parse(input);
      return request(
        localPosRoutes.catalogCategories,
        localCatalogCategoryResponseSchema,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      );
    },
    async updateCatalogCategory(
      token: string,
      categoryId: string,
      input: UpdateLocalCatalogCategoryInput,
    ) {
      const body = updateLocalCatalogCategoryInputSchema.parse(input);
      return request(
        `${localPosRoutes.catalogCategories}/${encodeURIComponent(categoryId)}`,
        localCatalogCategoryResponseSchema,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      );
    },
    async createCatalogItem(token: string, input: CreateLocalCatalogItemInput) {
      const body = createLocalCatalogItemInputSchema.parse(input);
      return request(
        localPosRoutes.catalogItems,
        localCatalogItemResponseSchema,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      );
    },
    async updateCatalogItem(
      token: string,
      itemId: string,
      input: UpdateLocalCatalogItemInput,
    ) {
      const body = updateLocalCatalogItemInputSchema.parse(input);
      return request(
        `${localPosRoutes.catalogItems}/${encodeURIComponent(itemId)}`,
        localCatalogItemResponseSchema,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      );
    },
    async createComboRule(token: string, input: CreateLocalComboRuleInput) {
      const body = createLocalComboRuleInputSchema.parse(input);
      return request(localPosRoutes.comboRules, localComboRuleResponseSchema, {
        method: 'POST',
        headers: managementJsonHeaders(token),
        body: JSON.stringify(body),
      });
    },
    async updateComboRule(
      token: string,
      ruleId: string,
      input: UpdateLocalComboRuleInput,
    ) {
      const body = updateLocalComboRuleInputSchema.parse(input);
      return request(
        `${localPosRoutes.comboRules}/${encodeURIComponent(ruleId)}`,
        localComboRuleResponseSchema,
        {
          method: 'PATCH',
          headers: managementJsonHeaders(token),
          body: JSON.stringify(body),
        },
      );
    },
    async createComboGroup(token: string, input: CreateLocalComboGroupInput) {
      const body = createLocalComboGroupInputSchema.parse(input);
      return request(
        localPosRoutes.comboRuleGroups,
        localComboGroupResponseSchema,
        {
          method: 'POST',
          headers: managementJsonHeaders(token),
          body: JSON.stringify(body),
        },
      );
    },
    async updateComboGroup(
      token: string,
      groupId: string,
      input: UpdateLocalComboGroupInput,
    ) {
      const body = updateLocalComboGroupInputSchema.parse(input);
      return request(
        `${localPosRoutes.comboRuleGroups}/${encodeURIComponent(groupId)}`,
        localComboGroupResponseSchema,
        {
          method: 'PATCH',
          headers: managementJsonHeaders(token),
          body: JSON.stringify(body),
        },
      );
    },
    async deleteComboGroup(token: string, groupId: string) {
      return request(
        `${localPosRoutes.comboRuleGroups}/${encodeURIComponent(groupId)}`,
        localComboDeleteResponseSchema,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    },
    async createComboGroupItem(
      token: string,
      input: CreateLocalComboGroupItemInput,
    ) {
      const body = createLocalComboGroupItemInputSchema.parse(input);
      return request(
        localPosRoutes.comboRuleGroupItems,
        localComboGroupItemResponseSchema,
        {
          method: 'POST',
          headers: managementJsonHeaders(token),
          body: JSON.stringify(body),
        },
      );
    },
    async updateComboGroupItem(
      token: string,
      groupItemId: string,
      input: UpdateLocalComboGroupItemInput,
    ) {
      const body = updateLocalComboGroupItemInputSchema.parse(input);
      return request(
        `${localPosRoutes.comboRuleGroupItems}/${encodeURIComponent(groupItemId)}`,
        localComboGroupItemResponseSchema,
        {
          method: 'PATCH',
          headers: managementJsonHeaders(token),
          body: JSON.stringify(body),
        },
      );
    },
    async deleteComboGroupItem(token: string, groupItemId: string) {
      return request(
        `${localPosRoutes.comboRuleGroupItems}/${encodeURIComponent(groupItemId)}`,
        localComboDeleteResponseSchema,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    },
    async listPrintJobs(token: string, input: Partial<PrintJobsQuery> = {}) {
      const query = printJobsQuerySchema.parse(input);
      const search = new URLSearchParams({ limit: String(query.limit) });
      if (query.status) search.set('status', query.status);
      return request(
        `${localPosRoutes.printJobs}?${search.toString()}`,
        localPrintJobsResponseSchema,
        { headers: { Authorization: `Bearer ${token}` } },
      );
    },
    async executePrintJobCommand(
      token: string,
      printJobId: string,
      input: PrintJobCommand,
    ) {
      const body = printJobCommandSchema.parse(input);
      return request(
        `${localPosRoutes.printJobs}/${encodeURIComponent(printJobId)}/commands`,
        localPrintJobSchema,
        {
          method: 'POST',
          headers: managementJsonHeaders(token),
          body: JSON.stringify(body),
        },
      );
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

function managementJsonHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function normalizeBaseUrl(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}
