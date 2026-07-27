import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSiteAgentServer } from '../src/server';
import type { SiteAgentService } from '../src/services/site-agent-service';

const userId = '11111111-1111-4111-8111-111111111111';
const orderId = '22222222-2222-4222-8222-222222222222';
const checkedAt = '2026-07-27T12:00:00.000Z';

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
    listLocalUsers: async () => ({ users: [] }),
    getCatalog: async () => ({ categories: [], comboRules: [] }),
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
    listPrintJobs: async () => {
      throw new Error('Not called by this test.');
    },
    executePrintJobCommand: async () => {
      throw new Error('Not called by this test.');
    },
  };
}
