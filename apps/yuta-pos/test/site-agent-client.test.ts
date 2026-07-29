import { describe, expect, it, vi } from 'vitest';
import {
  createSiteAgentClient,
  SiteAgentClientError,
} from '../src/lib/site-agent-client';

const userId = '019c9b83-7c2d-70e5-8000-000000000001';
const orderId = '019c9b83-7c2d-70e5-8000-000000000002';
const orderItemId = '019c9b83-7c2d-70e5-8000-000000000003';
const menuItemId = '019c9b83-7c2d-70e5-8000-000000000004';
const checkedAt = '2026-07-27T12:00:00.000Z';
const sessionToken = 'local-session-token-with-more-than-thirty-two-characters';

const orderSnapshot = {
  id: orderId,
  orderNumber: 'POS-TEST',
  tableLabel: 'Terrasse 5',
  orderType: 'dine_in' as const,
  status: 'draft' as const,
  subtotalCents: 0,
  discountCents: 0,
  totalCents: 0,
  paymentMode: 'single' as const,
  note: null,
  hasAllergy: false,
  allergyNote: null,
  allergyAcknowledgedAt: null,
  createdBy: userId,
  sentAt: null,
  paidAt: null,
  cancelledAt: null,
  cancelledReason: null,
  createdAt: checkedAt,
  updatedAt: checkedAt,
};

const orderItemSnapshot = {
  id: orderItemId,
  orderId,
  menuItemId,
  itemNameSnapshot: 'Integration item',
  unitPriceCentsSnapshot: 1000,
  kitchenStationSnapshot: 'kitchen' as const,
  quantity: 1,
  note: null,
  quickInstructions: [],
  selectedVariants: [],
  hasAllergy: false,
  allergenCodes: [],
  allergySeverity: null,
  allergyNote: null,
  allergyAcknowledgedAt: null,
  allergyKitchenConfirmedAt: null,
  status: 'pending' as const,
  sentAt: null,
  readyAt: null,
  servedAt: null,
  cancelledAt: null,
  cancelledReason: null,
  createdAt: checkedAt,
  updatedAt: checkedAt,
};

describe('yuta-pos site-agent client', () => {
  it('loads and validates site-agent health', async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        status: 'ok',
        database: 'ready',
        service: 'site-agent',
        apiVersion: 'v1',
        checkedAt: '2026-07-27T12:00:00.000Z',
      }),
    );
    const client = createSiteAgentClient({
      baseUrl: 'http://site-agent.test/',
      fetchImplementation,
    });

    const result = await client.getHealth();

    expect(result.database).toBe('ready');
    expect(fetchImplementation).toHaveBeenCalledWith(
      'http://site-agent.test/health',
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('loads and validates local users without caching', async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        users: [
          {
            id: userId,
            name: 'Local Staff',
            email: 'staff@yuta.local',
            role: 'staff',
            isActive: true,
          },
        ],
      }),
    );
    const client = createSiteAgentClient({
      baseUrl: 'http://site-agent.test/',
      fetchImplementation,
    });

    const result = await client.listLocalUsers();

    expect(result.users[0]?.id).toBe(userId);
    expect(fetchImplementation).toHaveBeenCalledWith(
      'http://site-agent.test/api/v1/local-users',
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('uses bearer tokens for local authentication sessions', async () => {
    const session = {
      id: orderItemId,
      user: {
        id: userId,
        name: 'Local Admin',
        email: 'admin@yuta.local',
        role: 'admin' as const,
        isActive: true,
      },
      expiresAt: checkedAt,
    };
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ token: sessionToken, session }))
      .mockResolvedValueOnce(Response.json({ session }))
      .mockResolvedValueOnce(Response.json({ success: true }));
    const client = createSiteAgentClient({
      baseUrl: 'http://site-agent.test',
      fetchImplementation,
    });

    await client.signInLocalUser({ userId, pin: '1234' });
    await client.getLocalSession(sessionToken);
    await client.signOutLocalSession(sessionToken);

    expect(fetchImplementation.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ userId, pin: '1234' }),
    });
    expect(fetchImplementation.mock.calls[1]?.[1]).toMatchObject({
      headers: expect.objectContaining({
        Authorization: `Bearer ${sessionToken}`,
      }),
    });
    expect(fetchImplementation.mock.calls[2]?.[1]).toMatchObject({
      method: 'DELETE',
      headers: expect.objectContaining({
        Authorization: `Bearer ${sessionToken}`,
      }),
    });
  });

  it('uses bearer tokens for local-user management mutations', async () => {
    const user = {
      id: userId,
      name: 'Local Staff',
      email: null,
      role: 'staff' as const,
      isActive: true,
    };
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => Response.json({ user }));
    const client = createSiteAgentClient({
      baseUrl: 'http://site-agent.test',
      fetchImplementation,
    });

    await client.createLocalUser(sessionToken, {
      name: user.name,
      email: null,
      role: user.role,
      pin: '2345',
    });
    await client.updateLocalUser(sessionToken, userId, { isActive: false });
    await client.resetLocalUserPin(sessionToken, userId, { pin: '6789' });

    expect(fetchImplementation.mock.calls.map(([url]) => url)).toEqual([
      'http://site-agent.test/api/v1/local-users',
      `http://site-agent.test/api/v1/local-users/${userId}`,
      `http://site-agent.test/api/v1/local-users/${userId}/pin`,
    ]);
    for (const [, init] of fetchImplementation.mock.calls) {
      expect(init?.headers).toMatchObject({
        Authorization: `Bearer ${sessionToken}`,
      });
    }
  });

  it('uses bearer tokens for catalog management mutations', async () => {
    const category = {
      id: userId,
      name: 'Lunch',
      sortOrder: 10,
      isActive: true,
      items: [],
    };
    const item = {
      id: menuItemId,
      categoryId: category.id,
      name: 'Pho',
      description: null,
      priceCents: 1290,
      kitchenStation: 'kitchen' as const,
      isAvailable: true,
      sortOrder: 10,
    };
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockImplementationOnce(async () => Response.json({ category }))
      .mockImplementationOnce(async () => Response.json({ category }))
      .mockImplementationOnce(async () => Response.json({ item }))
      .mockImplementationOnce(async () => Response.json({ item }));
    const client = createSiteAgentClient({
      baseUrl: 'http://site-agent.test',
      fetchImplementation,
    });

    await client.createCatalogCategory(sessionToken, {
      name: category.name,
      sortOrder: category.sortOrder,
    });
    await client.updateCatalogCategory(sessionToken, category.id, {
      isActive: false,
    });
    await client.createCatalogItem(sessionToken, {
      categoryId: category.id,
      name: item.name,
      description: null,
      priceCents: item.priceCents,
      kitchenStation: item.kitchenStation,
      isAvailable: true,
      sortOrder: item.sortOrder,
    });
    await client.updateCatalogItem(sessionToken, item.id, {
      isAvailable: false,
    });

    expect(fetchImplementation.mock.calls.map(([url]) => url)).toEqual([
      'http://site-agent.test/api/v1/catalog/categories',
      `http://site-agent.test/api/v1/catalog/categories/${category.id}`,
      'http://site-agent.test/api/v1/catalog/items',
      `http://site-agent.test/api/v1/catalog/items/${item.id}`,
    ]);
    for (const [, init] of fetchImplementation.mock.calls) {
      expect(init?.headers).toMatchObject({
        Authorization: `Bearer ${sessionToken}`,
      });
    }
  });

  it('uses bearer tokens for combo management mutations', async () => {
    const rule = {
      id: userId,
      name: 'Lunch combo',
      pricingMode: 'fixed' as const,
      comboPriceCents: 1500,
      priceDeltaCents: 0,
      basePricingGroupName: null,
      priority: 10,
      maxApplications: null,
      isActive: false,
      groups: [],
    };
    const group = {
      id: orderId,
      name: 'Main',
      minQuantity: 1,
      maxQuantity: 1,
      sortOrder: 10,
      items: [],
    };
    const groupItem = {
      id: orderItemId,
      menuItemId,
      extraPriceCents: 0,
    };
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockImplementationOnce(async () => Response.json({ comboRule: rule }))
      .mockImplementationOnce(async () => Response.json({ comboRule: rule }))
      .mockImplementationOnce(async () => Response.json({ group }))
      .mockImplementationOnce(async () => Response.json({ item: groupItem }))
      .mockImplementationOnce(async () => Response.json({ item: groupItem }))
      .mockImplementationOnce(async () => Response.json({ success: true }))
      .mockImplementationOnce(async () => Response.json({ success: true }));
    const client = createSiteAgentClient({
      baseUrl: 'http://site-agent.test',
      fetchImplementation,
    });

    await client.createComboRule(sessionToken, {
      name: rule.name,
      pricingMode: rule.pricingMode,
      comboPriceCents: rule.comboPriceCents,
      priceDeltaCents: 0,
      basePricingGroupName: null,
      priority: 10,
      maxApplications: null,
      isActive: false,
    });
    await client.updateComboRule(sessionToken, rule.id, { isActive: true });
    await client.createComboGroup(sessionToken, {
      comboRuleId: rule.id,
      name: group.name,
      minQuantity: 1,
      maxQuantity: 1,
      sortOrder: 10,
    });
    await client.createComboGroupItem(sessionToken, {
      comboRuleGroupId: group.id,
      menuItemId,
      extraPriceCents: 0,
    });
    await client.updateComboGroupItem(sessionToken, groupItem.id, {
      extraPriceCents: 100,
    });
    await client.deleteComboGroupItem(sessionToken, groupItem.id);
    await client.deleteComboGroup(sessionToken, group.id);

    expect(fetchImplementation.mock.calls.map(([url]) => url)).toEqual([
      'http://site-agent.test/api/v1/catalog/combo-rules',
      `http://site-agent.test/api/v1/catalog/combo-rules/${rule.id}`,
      'http://site-agent.test/api/v1/catalog/combo-groups',
      'http://site-agent.test/api/v1/catalog/combo-group-items',
      `http://site-agent.test/api/v1/catalog/combo-group-items/${groupItem.id}`,
      `http://site-agent.test/api/v1/catalog/combo-group-items/${groupItem.id}`,
      `http://site-agent.test/api/v1/catalog/combo-groups/${group.id}`,
    ]);
  });

  it('uses bearer tokens for print queue reads and commands', async () => {
    const printJob = {
      id: orderItemId,
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
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ printJobs: [printJob] }))
      .mockResolvedValueOnce(
        Response.json({ ...printJob, status: 'printing' }),
      );
    const client = createSiteAgentClient({
      baseUrl: 'http://site-agent.test',
      fetchImplementation,
    });

    await client.listPrintJobs(sessionToken, { status: 'pending', limit: 25 });
    await client.executePrintJobCommand(sessionToken, printJob.id, {
      action: 'mark_printing',
    });

    expect(fetchImplementation.mock.calls.map(([url]) => url)).toEqual([
      'http://site-agent.test/api/v1/print-jobs?limit=25&status=pending',
      `http://site-agent.test/api/v1/print-jobs/${printJob.id}/commands`,
    ]);
    for (const [, init] of fetchImplementation.mock.calls) {
      expect(init?.headers).toMatchObject({
        Authorization: `Bearer ${sessionToken}`,
      });
    }
    expect(fetchImplementation.mock.calls[1]?.[1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ action: 'mark_printing' }),
    });
  });

  it('sends validated create-order input to the versioned API', async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json(
        {
          order: orderSnapshot,
        },
        { status: 201 },
      ),
    );
    const client = createSiteAgentClient({
      baseUrl: 'http://site-agent.test',
      fetchImplementation,
    });

    await client.createOrder({
      tableLabel: 'Terrasse 5',
      orderType: 'dine_in',
      staffUserId: userId,
    });

    expect(fetchImplementation).toHaveBeenCalledWith(
      'http://site-agent.test/api/v1/orders',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          tableLabel: 'Terrasse 5',
          orderType: 'dine_in',
          staffUserId: userId,
        }),
      }),
    );
  });

  it('uses the versioned order-entry endpoints', async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ categories: [], comboRules: [] }))
      .mockResolvedValueOnce(Response.json({ orders: [orderSnapshot] }))
      .mockResolvedValueOnce(
        Response.json({
          order: orderSnapshot,
          items: [orderItemSnapshot],
          discounts: [],
        }),
      )
      .mockResolvedValueOnce(Response.json({ item: orderItemSnapshot }))
      .mockResolvedValueOnce(Response.json({ item: orderItemSnapshot }))
      .mockResolvedValueOnce(Response.json({ item: orderItemSnapshot }))
      .mockResolvedValueOnce(
        Response.json({
          order: orderSnapshot,
          items: [orderItemSnapshot],
          discounts: [],
        }),
      );
    const client = createSiteAgentClient({
      baseUrl: 'http://site-agent.test',
      fetchImplementation,
    });

    await client.getCatalog();
    await client.listOrders({ status: 'draft', limit: 25 });
    await client.getOrderDetail(orderId);
    await client.addOrderItem(orderId, { menuItemId, quantity: 1 });
    await client.updateOrderItem(orderItemId, { quantity: 2 });
    await client.executeOrderItemCommand(orderItemId, {
      action: 'remove_pending',
    });
    await client.executeOrderCommand(orderId, { action: 'cancel' });

    expect(fetchImplementation.mock.calls.map(([url]) => url)).toEqual([
      'http://site-agent.test/api/v1/catalog',
      'http://site-agent.test/api/v1/orders?limit=25&status=draft',
      `http://site-agent.test/api/v1/orders/${orderId}`,
      `http://site-agent.test/api/v1/orders/${orderId}/items`,
      `http://site-agent.test/api/v1/order-items/${orderItemId}`,
      `http://site-agent.test/api/v1/order-items/${orderItemId}/commands`,
      `http://site-agent.test/api/v1/orders/${orderId}/commands`,
    ]);
    expect(fetchImplementation.mock.calls[3]?.[1]).toMatchObject({
      method: 'POST',
    });
    expect(fetchImplementation.mock.calls[4]?.[1]).toMatchObject({
      method: 'PATCH',
    });
  });

  it('uses the versioned financial endpoints', async () => {
    const payment = {
      id: '019c9b83-7c2d-70e5-8000-000000000005',
      orderId,
      checkId: null,
      method: 'card' as const,
      amountCents: 1000,
      tenderedCents: null,
      changeCents: null,
      tipCents: 0,
      status: 'paid' as const,
      paidBy: userId,
      paidAt: checkedAt,
      createdAt: checkedAt,
    };
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({
          order: orderSnapshot,
          checks: [],
          payments: [],
          paidCents: 0,
          remainingCents: 0,
        }),
      )
      .mockResolvedValueOnce(Response.json({ checks: [] }))
      .mockResolvedValueOnce(Response.json({ checks: [] }))
      .mockResolvedValueOnce(Response.json({ order: orderSnapshot }))
      .mockResolvedValueOnce(
        Response.json({ payment, printJob: null, replayed: false }),
      )
      .mockResolvedValueOnce(
        Response.json({
          payment: { ...payment, checkId: orderItemId },
          printJob: null,
          replayed: false,
        }),
      );
    const client = createSiteAgentClient({
      baseUrl: 'http://site-agent.test',
      fetchImplementation,
    });

    await client.getPaymentSummary(orderId);
    await client.splitOrderEqually(orderId, 2);
    await client.createChecksByItems(orderId, {
      checks: [
        {
          checkLabel: 'Client 1',
          items: [{ orderItemId, quantity: 1 }],
        },
      ],
    });
    await client.cancelOrderSplit(orderId);
    await client.payOrder(orderId, {
      method: 'card',
      amountCents: 1000,
      staffUserId: userId,
      idempotencyKey: userId,
    });
    await client.payCheck(orderId, {
      checkId: orderItemId,
      method: 'card',
      amountCents: 1000,
      staffUserId: userId,
      idempotencyKey: userId,
    });

    expect(fetchImplementation.mock.calls.map(([url]) => url)).toEqual([
      `http://site-agent.test/api/v1/orders/${orderId}/payment-summary`,
      `http://site-agent.test/api/v1/orders/${orderId}/checks/equal`,
      `http://site-agent.test/api/v1/orders/${orderId}/checks/by-items`,
      `http://site-agent.test/api/v1/orders/${orderId}/checks`,
      `http://site-agent.test/api/v1/orders/${orderId}/payments`,
      `http://site-agent.test/api/v1/orders/${orderId}/checks/${orderItemId}/payments`,
    ]);
  });

  it('preserves structured site-agent errors', async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json(
        {
          error: {
            code: 'STAFF_USER_UNAVAILABLE',
            message: 'The selected local staff user is not available.',
            requestId: 'request-1',
          },
        },
        { status: 422 },
      ),
    );
    const client = createSiteAgentClient({
      baseUrl: 'http://site-agent.test',
      fetchImplementation,
    });

    await expect(client.listLocalUsers()).rejects.toEqual(
      expect.objectContaining<Partial<SiteAgentClientError>>({
        status: 422,
        code: 'STAFF_USER_UNAVAILABLE',
        requestId: 'request-1',
      }),
    );
  });
});
