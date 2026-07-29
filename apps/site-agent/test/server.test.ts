import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSiteAgentServer } from '../src/server';
import type { SiteAgentService } from '../src/services/site-agent-service';

const userId = '11111111-1111-4111-8111-111111111111';
const orderId = '22222222-2222-4222-8222-222222222222';
const sessionId = '33333333-3333-4333-8333-333333333333';
const checkedAt = '2026-07-27T12:00:00.000Z';
const sessionToken = 'local-session-token-with-more-than-thirty-two-characters';
const localSession = {
  id: sessionId,
  user: {
    id: userId,
    name: 'Local Admin',
    email: 'admin@yuta.local',
    role: 'admin' as const,
    isActive: true,
  },
  expiresAt: checkedAt,
};
const printJobSnapshot = {
  id: sessionId,
  orderId,
  checkId: null,
  paymentId: null,
  type: 'kitchen_ticket' as const,
  source: 'pos' as const,
  status: 'pending' as const,
  printerName: 'mock-kitchen',
  summary: {
    orderNumber: 'POS-TEST',
    tableLabel: 'Terrasse 5',
    itemCount: 1,
  },
  errorMessage: null,
  createdAt: checkedAt,
  printedAt: null,
};

describe('site-agent HTTP boundary', () => {
  let server: ReturnType<typeof createSiteAgentServer>;
  let baseUrl: string;

  beforeEach(async () => {
    server = createSiteAgentServer({
      env: {
        NODE_ENV: 'test',
        POS_DATABASE_URL: 'postgres://test:test@localhost:5432/yuta_pos_test',
        SITE_AGENT_HOST: '127.0.0.1',
        SITE_AGENT_PORT: 3004,
        SITE_AGENT_ALLOWED_ORIGIN: 'http://localhost:3003',
      },
      service: createMockService(),
    });
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => {
        server.off('error', reject);
        resolve();
      });
    });
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it('serves health without exposing a database URL', async () => {
    const response = await fetch(`${baseUrl}/health`, {
      headers: { Origin: 'http://localhost:3003' },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe(
      'http://localhost:3003',
    );
    expect(await response.json()).toEqual({
      status: 'ok',
      database: 'ready',
      service: 'site-agent',
      apiVersion: 'v1',
      checkedAt,
    });
  });

  it('rejects invalid order commands before calling a service', async () => {
    const response = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3003',
      },
      body: JSON.stringify({
        tableLabel: '',
        orderType: 'dine_in',
        staffUserId: userId,
        unexpected: true,
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
    });
  });

  it('blocks browser origins outside the configured local POS origin', async () => {
    const response = await fetch(`${baseUrl}/api/v1/catalog`, {
      headers: { Origin: 'https://untrusted.example' },
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: { code: 'ORIGIN_NOT_ALLOWED' },
    });
  });

  it('creates and reads an authenticated local session', async () => {
    const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3003',
      },
      body: JSON.stringify({ userId, pin: '1234' }),
    });

    expect(loginResponse.status).toBe(200);
    expect(await loginResponse.json()).toEqual({
      token: sessionToken,
      session: localSession,
    });

    const sessionResponse = await fetch(`${baseUrl}/api/v1/auth/session`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    expect(sessionResponse.status).toBe(200);
    expect(await sessionResponse.json()).toEqual({ session: localSession });
  });

  it('requires a bearer token for the local session endpoint', async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/session`);

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      error: { code: 'LOCAL_SESSION_REQUIRED' },
    });
  });

  it('protects local-user mutations with a management session', async () => {
    const unauthorized = await fetch(`${baseUrl}/api/v1/local-users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Staff',
        email: null,
        role: 'staff',
        pin: '2345',
      }),
    });
    expect(unauthorized.status).toBe(401);

    const created = await fetch(`${baseUrl}/api/v1/local-users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'New Staff',
        email: null,
        role: 'staff',
        pin: '2345',
      }),
    });
    expect(created.status).toBe(201);
    expect(await created.json()).toMatchObject({
      user: { name: 'New Staff', role: 'staff', isActive: true },
    });
  });

  it('validates local-user update and PIN routes', async () => {
    const invalidUpdate = await fetch(
      `${baseUrl}/api/v1/local-users/${userId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      },
    );
    expect(invalidUpdate.status).toBe(400);

    const resetPin = await fetch(
      `${baseUrl}/api/v1/local-users/${userId}/pin`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin: '6789' }),
      },
    );
    expect(resetPin.status).toBe(200);
    expect(await resetPin.json()).toEqual({ user: localSession.user });
  });

  it('protects and validates catalog management routes', async () => {
    const unauthorized = await fetch(`${baseUrl}/api/v1/catalog/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Lunch', sortOrder: 10 }),
    });
    expect(unauthorized.status).toBe(401);

    const created = await fetch(`${baseUrl}/api/v1/catalog/categories`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Lunch', sortOrder: 10 }),
    });
    expect(created.status).toBe(201);
    expect(await created.json()).toMatchObject({
      category: { name: 'Lunch', sortOrder: 10, isActive: true },
    });

    const invalidItem = await fetch(`${baseUrl}/api/v1/catalog/items`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        categoryId: userId,
        name: 'Invalid price',
        priceCents: -1,
        kitchenStation: 'kitchen',
      }),
    });
    expect(invalidItem.status).toBe(400);
  });

  it('protects and validates combo management routes', async () => {
    const unauthorized = await fetch(`${baseUrl}/api/v1/catalog/combo-rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Lunch combo',
        pricingMode: 'fixed',
        comboPriceCents: 1500,
        maxApplications: null,
      }),
    });
    expect(unauthorized.status).toBe(401);

    const created = await fetch(`${baseUrl}/api/v1/catalog/combo-rules`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Lunch combo',
        pricingMode: 'fixed',
        comboPriceCents: 1500,
        maxApplications: null,
      }),
    });
    expect(created.status).toBe(201);
    expect(await created.json()).toMatchObject({
      comboRule: {
        name: 'Lunch combo',
        pricingMode: 'fixed',
        isActive: false,
      },
    });

    const invalidGroup = await fetch(`${baseUrl}/api/v1/catalog/combo-groups`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comboRuleId: userId,
        name: 'Main',
        minQuantity: 2,
        maxQuantity: 1,
      }),
    });
    expect(invalidGroup.status).toBe(400);
  });

  it('protects print queue reads and commands', async () => {
    const unauthorizedList = await fetch(`${baseUrl}/api/v1/print-jobs`);
    expect(unauthorizedList.status).toBe(401);

    const list = await fetch(`${baseUrl}/api/v1/print-jobs?limit=25`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    expect(list.status).toBe(200);
    expect(await list.json()).toEqual({ printJobs: [printJobSnapshot] });

    const unauthorizedCommand = await fetch(
      `${baseUrl}/api/v1/print-jobs/${sessionId}/commands`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_printing' }),
      },
    );
    expect(unauthorizedCommand.status).toBe(401);

    const command = await fetch(
      `${baseUrl}/api/v1/print-jobs/${sessionId}/commands`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'mark_printing' }),
      },
    );
    expect(command.status).toBe(200);
    expect(await command.json()).toEqual(printJobSnapshot);
  });

  it('requires UUIDv7 idempotency keys for kitchen commands', async () => {
    const response = await fetch(
      `${baseUrl}/api/v1/orders/${orderId}/commands`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3003',
        },
        body: JSON.stringify({
          action: 'send_to_kitchen',
          idempotencyKey: userId,
          staffUserId: userId,
        }),
      },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
    });
  });

  it('requires UUIDv7 idempotency keys for payment capture', async () => {
    const response = await fetch(
      `${baseUrl}/api/v1/orders/${orderId}/payments`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3003',
        },
        body: JSON.stringify({
          method: 'card',
          amountCents: 1000,
          staffUserId: userId,
          idempotencyKey: userId,
        }),
      },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
    });
  });
});

function createMockService(): SiteAgentService {
  return {
    getHealth: async () => ({
      status: 'ok',
      database: 'ready',
      service: 'site-agent',
      apiVersion: 'v1',
      checkedAt,
    }),
    signIn: async () => ({ token: sessionToken, session: localSession }),
    findSession: async (token) =>
      token === sessionToken ? localSession : null,
    revokeSession: async () => undefined,
    listLocalUsers: async () => ({ users: [] }),
    createLocalUser: async (_session, input) => ({
      user: {
        id: userId,
        name: input.name,
        email: input.email,
        role: input.role,
        isActive: true,
      },
    }),
    updateLocalUser: async (_session, _userId, input) => ({
      user: {
        ...localSession.user,
        ...input,
      },
    }),
    resetLocalUserPin: async () => ({ user: localSession.user }),
    getCatalog: async () => ({ categories: [], comboRules: [] }),
    createCatalogCategory: async (input) => ({
      category: {
        id: userId,
        name: input.name,
        sortOrder: input.sortOrder,
        isActive: true,
        items: [],
      },
    }),
    updateCatalogCategory: async (_categoryId, input) => ({
      category: {
        id: userId,
        name: input.name ?? 'Category',
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive ?? true,
        items: [],
      },
    }),
    createCatalogItem: async (input) => ({
      item: {
        id: orderId,
        ...input,
      },
    }),
    updateCatalogItem: async (_itemId, input) => ({
      item: {
        id: orderId,
        categoryId: input.categoryId ?? userId,
        name: input.name ?? 'Item',
        description: input.description ?? null,
        priceCents: input.priceCents ?? 1000,
        kitchenStation: input.kitchenStation ?? 'kitchen',
        isAvailable: input.isAvailable ?? true,
        sortOrder: input.sortOrder ?? 0,
      },
    }),
    createComboRule: async (input) => ({
      comboRule: { id: userId, ...input, groups: [] },
    }),
    updateComboRule: async (_ruleId, input) => ({
      comboRule: {
        id: userId,
        name: input.name ?? 'Combo',
        pricingMode: input.pricingMode ?? 'fixed',
        comboPriceCents: input.comboPriceCents ?? 1000,
        priceDeltaCents: input.priceDeltaCents ?? 0,
        basePricingGroupName: input.basePricingGroupName ?? null,
        priority: input.priority ?? 0,
        maxApplications: input.maxApplications ?? null,
        isActive: input.isActive ?? false,
        groups: [],
      },
    }),
    createComboGroup: async (input) => ({
      group: {
        id: orderId,
        name: input.name,
        minQuantity: input.minQuantity,
        maxQuantity: input.maxQuantity,
        sortOrder: input.sortOrder,
        items: [],
      },
    }),
    updateComboGroup: async (_groupId, input) => ({
      group: {
        id: orderId,
        name: input.name ?? 'Group',
        minQuantity: input.minQuantity ?? 1,
        maxQuantity: input.maxQuantity ?? 1,
        sortOrder: input.sortOrder ?? 0,
        items: [],
      },
    }),
    deleteComboGroup: async () => ({ success: true as const }),
    createComboGroupItem: async (input) => ({
      item: { id: sessionId, ...input },
    }),
    updateComboGroupItem: async (_groupItemId, input) => ({
      item: {
        id: sessionId,
        menuItemId: orderId,
        extraPriceCents: input.extraPriceCents,
      },
    }),
    deleteComboGroupItem: async () => ({ success: true as const }),
    listOrders: async () => ({ orders: [] }),
    createOrder: async (input) => ({
      order: {
        id: orderId,
        orderNumber: 'POS-TEST',
        tableLabel: input.tableLabel,
        orderType: input.orderType,
        status: 'draft',
        subtotalCents: 0,
        discountCents: 0,
        totalCents: 0,
        paymentMode: 'single',
        note: input.note ?? null,
        hasAllergy: false,
        allergyNote: null,
        allergyAcknowledgedAt: null,
        createdBy: input.staffUserId,
        sentAt: null,
        paidAt: null,
        cancelledAt: null,
        cancelledReason: null,
        createdAt: checkedAt,
        updatedAt: checkedAt,
      },
    }),
    getOrderDetail: async () => {
      throw new Error('Not called by this test.');
    },
    addOrderItem: async () => {
      throw new Error('Not called by this test.');
    },
    updateOrderItem: async () => {
      throw new Error('Not called by this test.');
    },
    executeOrderItemCommand: async () => {
      throw new Error('Not called by this test.');
    },
    executeOrderCommand: async () => {
      throw new Error('Not called by this test.');
    },
    splitOrderEqually: async () => {
      throw new Error('Not called by this test.');
    },
    createChecksByItems: async () => {
      throw new Error('Not called by this test.');
    },
    cancelOrderSplit: async () => {
      throw new Error('Not called by this test.');
    },
    payOrder: async () => {
      throw new Error('Not called by this test.');
    },
    payCheck: async () => {
      throw new Error('Not called by this test.');
    },
    getPaymentSummary: async () => {
      throw new Error('Not called by this test.');
    },
    listPrintJobs: async () => ({ printJobs: [printJobSnapshot] }),
    executePrintJobCommand: async () => printJobSnapshot,
  };
}
