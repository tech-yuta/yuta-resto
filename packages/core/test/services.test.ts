import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { and, eq, inArray, sql } from 'drizzle-orm';
import {
  checkDiscountItems,
  checkDiscounts,
  checkItems,
  checks,
  comboRuleGroupItems,
  comboRuleGroups,
  comboRules,
  menuCategories,
  menuItems,
  orderDiscountItems,
  orderDiscounts,
  orderItems,
  orders,
  payments,
  printJobs,
  users,
  type MenuItem,
  type Order,
  type OrderItem,
  type User,
} from '@yuta/db/schema';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@yuta/db/schema';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createComboService } from '../src/combos';
import { createOrderService } from '../src/orders';
import { createPaymentService } from '../src/payments';
import { createPosService } from '../src/pos';
import { processPendingPrintJobs } from '../src/print-worker';
import { createPrintService } from '../src/prints';

const databaseUrl =
  process.env.DATABASE_TEST_URL ??
  'postgres://yuta:yuta@localhost:55433/yuta_resto_test';

const client = postgres(databaseUrl, { max: 4 });
const db = drizzle(client, { schema });
let context: TestContext;

type TestContext = {
  user: User;
  categories: {
    plats: string;
    drinks: string;
    desserts: string;
  };
  items: {
    bunBo: MenuItem;
    comGa: MenuItem;
    pho: MenuItem;
    coca: MenuItem;
    icedTea: MenuItem;
    che: MenuItem;
  };
};

describe('YuTa core services', () => {
  beforeAll(async () => {
    await cleanupTestData();
    context = await createTestContext();
  });

  beforeEach(async () => {
    await cleanupRuntimeData();
    await cleanupDynamicComboRule();
    await resetMenuPrices(context);
  });

  afterAll(async () => {
    await cleanupTestData();
    await client.end();
  });

  it('stores menu snapshots when adding an order item', async () => {
    const orderService = createOrderService(db);
    const order = await createTestOrder(context.user.id);
    const item = await orderService.addOrderItem({
      orderId: order.id,
      menuItemId: context.items.bunBo.id,
      quantity: 2,
    });

    expect(item.itemNameSnapshot).toBe('Test Bun bo');
    expect(item.unitPriceCentsSnapshot).toBe(1300);
    expect(item.kitchenStationSnapshot).toBe('kitchen');
  });

  it('sends pending order items to kitchen', async () => {
    const orderService = createOrderService(db);
    const order = await createTestOrder(context.user.id);
    await orderService.addOrderItem({
      orderId: order.id,
      menuItemId: context.items.bunBo.id,
      quantity: 1,
    });
    await orderService.addOrderItem({
      orderId: order.id,
      menuItemId: context.items.coca.id,
      quantity: 1,
    });

    const detail = await orderService.sendOrderToKitchen(order.id);

    expect(detail.status).toBe('sent');
    expect(detail.items).toHaveLength(2);
    expect(
      detail.items.every(
        (item) => item.status === 'sent' && item.sentAt !== null,
      ),
    ).toBe(true);
  });

  it('allows kitchen staff to reopen an item after a mistaken status change', async () => {
    const orderService = createOrderService(db);
    const order = await createTestOrder(context.user.id);
    const item = await orderService.addOrderItem({
      orderId: order.id,
      menuItemId: context.items.bunBo.id,
      quantity: 1,
    });
    await orderService.sendOrderToKitchen(order.id);
    await orderService.markOrderItemPreparing(item.id);
    const readyItem = await orderService.markOrderItemReady(item.id);

    expect(readyItem.status).toBe('ready');
    expect(readyItem.readyAt).toBeInstanceOf(Date);

    const reopenedItem = await orderService.markOrderItemPreparing(item.id);

    expect(reopenedItem.status).toBe('preparing');
    expect(reopenedItem.readyAt).toBeNull();

    const sentItem = await orderService.markOrderItemSent(item.id);

    expect(sentItem.status).toBe('sent');
    expect(sentItem.readyAt).toBeNull();
  });

  it('allows kitchen status updates after the order has been paid', async () => {
    const orderService = createOrderService(db);
    const paymentService = createPaymentService(db);
    const order = await createTestOrder(context.user.id);
    const item = await orderService.addOrderItem({
      orderId: order.id,
      menuItemId: context.items.bunBo.id,
      quantity: 1,
    });
    await orderService.sendOrderToKitchen(order.id);
    await paymentService.payFullOrder({
      orderId: order.id,
      method: 'card',
      amountCents: 1300,
    });

    const readyItem = await orderService.markOrderItemReady(item.id);
    const paidOrder = await orderService.getOrderDetail(order.id);

    expect(readyItem.status).toBe('ready');
    expect(paidOrder.status).toBe('paid');
  });

  it('creates and updates a kitchen ticket print job', async () => {
    const orderService = createOrderService(db);
    const printService = createPrintService(db);
    const order = await createTestOrder(context.user.id);
    await orderService.addOrderItem({
      orderId: order.id,
      menuItemId: context.items.bunBo.id,
      quantity: 2,
    });
    await orderService.sendOrderToKitchen(order.id);

    const job = await printService.createKitchenTicketPrintJob(order.id);

    expect(job.status).toBe('pending');
    expect(job.source).toBe('pos');
    expect(job.jobType).toBe('kitchen_ticket');
    expect(job.payload).toMatchObject({
      orderId: order.id,
      tableLabel: order.tableLabel,
      items: [{ name: 'Test Bun bo', quantity: 2, station: 'kitchen' }],
    });

    const failedJob = await printService.markPrintJobFailed({
      printJobId: job.id,
      errorMessage: 'Mock printer offline',
    });
    expect(failedJob.status).toBe('failed');
    expect(failedJob.errorMessage).toBe('Mock printer offline');

    const retriedJob = await printService.retryPrintJob(job.id);
    expect(retriedJob.status).toBe('pending');
    expect(retriedJob.errorMessage).toBeNull();

    const printedJob = await printService.markPrintJobPrinted(job.id);
    expect(printedJob.status).toBe('printed');
    expect(printedJob.printedAt).toBeInstanceOf(Date);
  });

  it('creates kitchen ticket print jobs for only the newly sent item batch', async () => {
    const orderService = createOrderService(db);
    const printService = createPrintService(db);
    const order = await createTestOrder(context.user.id);
    const firstItem = await orderService.addOrderItem({
      orderId: order.id,
      menuItemId: context.items.bunBo.id,
      quantity: 1,
    });
    await orderService.sendOrderToKitchen(order.id);
    await printService.createKitchenTicketPrintJob({
      orderId: order.id,
      orderItemIds: [firstItem.id],
    });

    const secondItem = await orderService.addOrderItem({
      orderId: order.id,
      menuItemId: context.items.coca.id,
      quantity: 1,
    });
    await orderService.sendOrderToKitchen(order.id);
    const secondJob = await printService.createKitchenTicketPrintJob({
      orderId: order.id,
      orderItemIds: [secondItem.id],
    });

    expect(secondJob.payload).toMatchObject({
      items: [{ name: 'Test Coca', quantity: 1, station: 'bar' }],
    });
  });

  it('atomically sends a kitchen batch and replays the same command once', async () => {
    const posService = createPosService(db);
    const order = await createTestOrder(context.user.id);
    await createOrderService(db).addOrderItem({
      orderId: order.id,
      menuItemId: context.items.bunBo.id,
      quantity: 1,
    });
    const idempotencyKey = randomUUID();

    const firstResult = await posService.sendToKitchen({
      orderId: order.id,
      idempotencyKey,
    });
    const replayedResult = await posService.sendToKitchen({
      orderId: order.id,
      idempotencyKey,
    });
    const jobs = await db.query.printJobs.findMany({
      where: eq(printJobs.orderId, order.id),
    });

    expect(firstResult.replayed).toBe(false);
    expect(replayedResult.replayed).toBe(true);
    expect(replayedResult.printJob.id).toBe(firstResult.printJob.id);
    expect(jobs).toHaveLength(1);
  });

  it('requires allergy acknowledgement and prints the warning on the kitchen ticket', async () => {
    const orderService = createOrderService(db);
    const posService = createPosService(db);
    const order = await createTestOrder(context.user.id);
    const item = await orderService.addOrderItem({
      orderId: order.id,
      menuItemId: context.items.bunBo.id,
      quantity: 1,
    });
    await orderService.updateOrderItemInstructions({
      orderItemId: item.id,
      note: 'No vegetables',
      selectedInstructionCodes: ['SANS_CORIANDRE', 'SAUCE_A_PART'],
      hasAllergy: true,
      allergenCodes: ['PEANUTS'],
      allergySeverity: 'severe_no_traces',
      allergyNote: 'Severe peanut allergy',
    });

    await expect(
      posService.sendToKitchen({
        orderId: order.id,
        idempotencyKey: randomUUID(),
      }),
    ).rejects.toMatchObject({ code: 'allergy_acknowledgement_required' });

    const result = await posService.sendToKitchen({
      orderId: order.id,
      idempotencyKey: randomUUID(),
      allergyAcknowledged: true,
      allergyAcknowledgedBy: context.user.id,
    });
    const savedItem = await db.query.orderItems.findFirst({
      where: eq(orderItems.id, item.id),
    });

    expect(savedItem?.allergyAcknowledgedAt).toBeInstanceOf(Date);
    expect(savedItem?.allergyAcknowledgedBy).toBe(context.user.id);
    expect(result.printJob.payload).toMatchObject({
      items: [
        {
          note: 'No vegetables',
          quickInstructions: [
            { code: 'SANS_CORIANDRE', labelSnapshot: 'Sans coriandre' },
            { code: 'SAUCE_A_PART', labelSnapshot: 'Sauce à part' },
          ],
          hasAllergy: true,
          allergenCodes: ['PEANUTS'],
          allergySeverity: 'severe_no_traces',
          allergyNote: 'Severe peanut allergy',
        },
      ],
    });

    await expect(
      orderService.markOrderItemReady(item.id),
    ).rejects.toMatchObject({
      code: 'invalid_status',
    });
    await orderService.confirmOrderItemAllergy({
      orderItemId: item.id,
      confirmedBy: context.user.id,
    });
    await expect(
      orderService.markOrderItemReady(item.id),
    ).resolves.toMatchObject({
      status: 'ready',
    });
  });

  it('updates notes only while an order item is pending', async () => {
    const orderService = createOrderService(db);
    const order = await createTestOrder(context.user.id);
    const item = await orderService.addOrderItem({
      orderId: order.id,
      menuItemId: context.items.bunBo.id,
      quantity: 1,
    });

    const updated = await orderService.updateOrderItemInstructions({
      orderItemId: item.id,
      note: 'No coriander',
      hasAllergy: false,
    });
    expect(updated.note).toBe('No coriander');

    await expect(
      orderService.updateOrderItemInstructions({
        orderItemId: item.id,
        selectedInstructionCodes: ['SANS_SAUCE', 'SAUCE_A_PART'],
        hasAllergy: false,
      }),
    ).rejects.toMatchObject({ code: 'invalid_input' });

    await orderService.sendOrderToKitchen(order.id);
    await expect(
      orderService.updateOrderItemInstructions({
        orderItemId: item.id,
        note: 'Too late',
        hasAllergy: false,
      }),
    ).rejects.toMatchObject({ code: 'invalid_status' });
  });

  it('rolls back a kitchen send when its print job cannot be created', async () => {
    const posService = createPosService(db);
    const orderService = createOrderService(db);
    const order = await createTestOrder(context.user.id);
    await orderService.addOrderItem({
      orderId: order.id,
      menuItemId: context.items.bunBo.id,
      quantity: 1,
    });

    await installRejectPrintJobTrigger();
    try {
      await expect(
        posService.sendToKitchen({
          orderId: order.id,
          idempotencyKey: randomUUID(),
        }),
      ).rejects.toThrow('Core test rejected print job');
    } finally {
      await removeRejectPrintJobTrigger();
    }

    const detail = await orderService.getOrderDetail(order.id);
    expect(detail.status).toBe('draft');
    expect(detail.items.map((item) => item.status)).toEqual(['pending']);
    expect(
      await db.query.printJobs.findMany({
        where: eq(printJobs.orderId, order.id),
      }),
    ).toHaveLength(0);
  });

  it('creates a customer receipt print job for a paid order', async () => {
    const paymentService = createPaymentService(db);
    const printService = createPrintService(db);
    const order = await createOrderWithItems([
      { menuItemId: context.items.bunBo.id, quantity: 1 },
      { menuItemId: context.items.coca.id, quantity: 1 },
    ]);
    await paymentService.payFullOrder({
      orderId: order.id,
      method: 'card',
      amountCents: 1400,
    });

    const job = await printService.createCustomerReceiptPrintJob({
      orderId: order.id,
    });

    expect(job.jobType).toBe('customer_receipt');
    expect(job.printerName).toBe('mock-receipt');
    expect(job.payload).toMatchObject({
      orderId: order.id,
      totalCents: 1400,
      paidCents: 1400,
      items: [
        { name: 'Test Bun bo', quantity: 1, amountCents: 1300 },
        { name: 'Test Coca', quantity: 1, amountCents: 300 },
      ],
      payments: [{ method: 'card', amountCents: 1400 }],
    });
  });

  it('atomically captures a full payment and replays the same command once', async () => {
    const posService = createPosService(db);
    const order = await createOrderWithItems([
      { menuItemId: context.items.bunBo.id, quantity: 1 },
    ]);
    const idempotencyKey = randomUUID();
    const input = {
      orderId: order.id,
      method: 'cash' as const,
      amountCents: 1300,
      tenderedCents: 1500,
      idempotencyKey,
    };

    const firstResult = await posService.payFullOrder(input);
    const replayedResult = await posService.payFullOrder(input);
    const savedPayments = await db.query.payments.findMany({
      where: eq(payments.orderId, order.id),
    });
    const jobs = await db.query.printJobs.findMany({
      where: eq(printJobs.orderId, order.id),
    });

    expect(firstResult.replayed).toBe(false);
    expect(firstResult.printJob?.paymentId).toBe(firstResult.payment.id);
    expect(replayedResult.replayed).toBe(true);
    expect(replayedResult.payment.id).toBe(firstResult.payment.id);
    expect(replayedResult.printJob?.id).toBe(firstResult.printJob?.id);
    expect(savedPayments).toHaveLength(1);
    expect(jobs).toHaveLength(1);
  });

  it('rolls back a completed payment when its receipt job cannot be created', async () => {
    const posService = createPosService(db);
    const order = await createOrderWithItems([
      { menuItemId: context.items.bunBo.id, quantity: 1 },
    ]);

    await installRejectPrintJobTrigger();
    try {
      await expect(
        posService.payFullOrder({
          orderId: order.id,
          method: 'card',
          amountCents: 1300,
          idempotencyKey: randomUUID(),
        }),
      ).rejects.toThrow('Core test rejected print job');
    } finally {
      await removeRejectPrintJobTrigger();
    }

    expect(
      await db.query.payments.findMany({
        where: eq(payments.orderId, order.id),
      }),
    ).toHaveLength(0);
    expect((await getOrder(order.id)).status).toBe('draft');
  });

  it('serializes competing full payments for the same order', async () => {
    const posService = createPosService(db);
    const order = await createOrderWithItems([
      { menuItemId: context.items.bunBo.id, quantity: 1 },
    ]);

    const results = await Promise.allSettled([
      posService.payFullOrder({
        orderId: order.id,
        method: 'card',
        amountCents: 1300,
        idempotencyKey: randomUUID(),
      }),
      posService.payFullOrder({
        orderId: order.id,
        method: 'card',
        amountCents: 1300,
        idempotencyKey: randomUUID(),
      }),
    ]);

    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1);
    expect(
      await db.query.payments.findMany({
        where: eq(payments.orderId, order.id),
      }),
    ).toHaveLength(1);
  });

  it('serializes order cancellation against a competing full payment', async () => {
    const posService = createPosService(db);
    const order = await createOrderWithItems([
      { menuItemId: context.items.bunBo.id, quantity: 1 },
    ]);

    const results = await Promise.allSettled([
      posService.cancelOrder({
        orderId: order.id,
        reason: 'Competing test cancellation',
      }),
      posService.payFullOrder({
        orderId: order.id,
        method: 'card',
        amountCents: 1300,
        idempotencyKey: randomUUID(),
      }),
    ]);
    const savedOrder = await getOrder(order.id);
    const savedPayments = await db.query.payments.findMany({
      where: eq(payments.orderId, order.id),
    });

    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1);
    expect(['cancelled', 'paid']).toContain(savedOrder.status);
    expect(savedPayments).toHaveLength(savedOrder.status === 'paid' ? 1 : 0);
  });

  it('creates a customer receipt print job for a paid split check', async () => {
    const paymentService = createPaymentService(db);
    const printService = createPrintService(db);
    const { order, items } = await createOrderWithItemRecords([
      { menuItemId: context.items.bunBo.id, quantity: 1 },
      { menuItemId: context.items.coca.id, quantity: 1 },
    ]);
    const [check] = await paymentService.createChecksByItems({
      orderId: order.id,
      checks: [
        {
          checkLabel: 'Client 1',
          items: [
            { orderItemId: items[0].id, quantity: 1 },
            { orderItemId: items[1].id, quantity: 1 },
          ],
        },
      ],
    });
    await paymentService.payCheck({
      checkId: check.id,
      method: 'cash',
      amountCents: 1400,
    });

    const job = await printService.createCustomerReceiptPrintJob({
      orderId: order.id,
      checkId: check.id,
    });

    expect(job.payload).toMatchObject({
      orderId: order.id,
      checkId: check.id,
      checkLabel: 'Client 1',
      totalCents: 1400,
      paidCents: 1400,
      payments: [{ method: 'cash', amountCents: 1400 }],
    });
  });

  it('creates a customer receipt print job for a paid equal split check', async () => {
    const paymentService = createPaymentService(db);
    const printService = createPrintService(db);
    const order = await createOrderWithItems([
      { menuItemId: context.items.bunBo.id, quantity: 1 },
      { menuItemId: context.items.coca.id, quantity: 1 },
    ]);
    const [check] = await paymentService.splitOrderEqually({
      orderId: order.id,
      parts: 2,
    });
    await paymentService.payCheck({
      checkId: check.id,
      method: 'card',
      amountCents: check.totalCents,
    });

    const job = await printService.createCustomerReceiptPrintJob({
      orderId: order.id,
      checkId: check.id,
    });

    expect(job.payload).toMatchObject({
      orderId: order.id,
      checkId: check.id,
      checkLabel: 'Part 1',
      totalCents: 700,
      paidCents: 700,
      items: [{ name: 'Part 1', quantity: 1, amountCents: 700 }],
      payments: [{ method: 'card', amountCents: 700 }],
    });
  });

  it('processes pending print jobs with the mock worker', async () => {
    const orderService = createOrderService(db);
    const printService = createPrintService(db);
    const outputDir = await mkdtemp(path.join(tmpdir(), 'yuta-print-worker-'));
    const order = await createTestOrder(context.user.id);
    await orderService.addOrderItem({
      orderId: order.id,
      menuItemId: context.items.bunBo.id,
      quantity: 1,
    });
    await orderService.sendOrderToKitchen(order.id);
    const job = await printService.createKitchenTicketPrintJob(order.id);

    try {
      const result = await processPendingPrintJobs(db, { outputDir });

      expect(result).toMatchObject({
        scanned: 1,
        printed: 1,
        failed: 0,
        skipped: 0,
      });
      await expect(
        readFile(path.join(outputDir, `${job.id}.txt`), 'utf8'),
      ).resolves.toContain('Test Bun bo');
      await expect(printService.getPrintJob(job.id)).resolves.toMatchObject({
        status: 'printed',
      });
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  it('applies a main dish plus drink combo discount', async () => {
    const order = await createOrderWithItems([
      { menuItemId: context.items.bunBo.id, quantity: 1 },
      { menuItemId: context.items.coca.id, quantity: 1 },
    ]);
    const comboService = createComboService(db);

    const discounts = await comboService.optimizeOrderCombos(order.id);
    const updatedOrder = await getOrder(order.id);

    expect(discounts).toHaveLength(1);
    expect(discounts[0].nameSnapshot).toBe('Test Combo A');
    expect(discounts[0].discountCents).toBe(200);
    expect(updatedOrder.discountCents).toBe(200);
    expect(updatedOrder.totalCents).toBe(1400);
  });

  it('applies a base item plus delta combo discount', async () => {
    await createComboRule(
      'Test Dynamic Combo',
      0,
      0,
      [
        {
          name: 'Plat',
          items: [{ item: context.items.comGa, extraPriceCents: 0 }],
        },
        {
          name: 'Boisson',
          items: [{ item: context.items.coca, extraPriceCents: 0 }],
        },
      ],
      {
        pricingMode: 'base_item_plus_delta',
        priceDeltaCents: 200,
        basePricingGroupName: 'Plat',
      },
    );
    const order = await createOrderWithItems([
      { menuItemId: context.items.comGa.id, quantity: 1 },
      { menuItemId: context.items.coca.id, quantity: 1 },
    ]);
    const comboService = createComboService(db);

    const discounts = await comboService.optimizeOrderCombos(order.id);
    const updatedOrder = await getOrder(order.id);

    expect(discounts).toHaveLength(1);
    expect(discounts[0].nameSnapshot).toBe('Test Dynamic Combo');
    expect(discounts[0].discountCents).toBe(100);
    expect(updatedOrder.totalCents).toBe(1400);
  });

  it('does not reuse the same item quantity twice', async () => {
    const order = await createOrderWithItems([
      { menuItemId: context.items.bunBo.id, quantity: 1 },
      { menuItemId: context.items.coca.id, quantity: 2 },
    ]);
    const comboService = createComboService(db);

    const discounts = await comboService.optimizeOrderCombos(order.id);

    expect(discounts).toHaveLength(1);
    expect(
      discounts[0].itemApplications.reduce(
        (total, item) => total + item.quantityApplied,
        0,
      ),
    ).toBe(2);
  });

  it('applies the higher-priority rule first', async () => {
    const order = await createOrderWithItems([
      { menuItemId: context.items.bunBo.id, quantity: 1 },
      { menuItemId: context.items.coca.id, quantity: 1 },
      { menuItemId: context.items.che.id, quantity: 1 },
    ]);
    const comboService = createComboService(db);

    const discounts = await comboService.optimizeOrderCombos(order.id);

    expect(discounts).toHaveLength(1);
    expect(discounts[0].nameSnapshot).toBe('Test Combo A');
  });

  it('recalculates combo discounts inside each item-split check', async () => {
    const { order, items } = await createOrderWithItemRecords([
      { menuItemId: context.items.bunBo.id, quantity: 2 },
      { menuItemId: context.items.coca.id, quantity: 2 },
    ]);
    const paymentService = createPaymentService(db);

    const createdChecks = await paymentService.createChecksByItems({
      orderId: order.id,
      checks: [
        {
          checkLabel: 'Client 1',
          items: [
            { orderItemId: items[0].id, quantity: 1 },
            { orderItemId: items[1].id, quantity: 1 },
          ],
        },
        {
          checkLabel: 'Client 2',
          items: [
            { orderItemId: items[0].id, quantity: 1 },
            { orderItemId: items[1].id, quantity: 1 },
          ],
        },
      ],
    });

    expect(createdChecks.map((check) => check.discountCents)).toEqual([
      200, 200,
    ]);
    expect(createdChecks.map((check) => check.totalCents)).toEqual([
      1400, 1400,
    ]);
  });

  it('clears order-level combo discounts when switching to split by items', async () => {
    const order = await createOrderWithItemRecords([
      { menuItemId: context.items.bunBo.id, quantity: 1 },
      { menuItemId: context.items.coca.id, quantity: 1 },
    ]);
    const comboService = createComboService(db);
    const paymentService = createPaymentService(db);
    await comboService.optimizeOrderCombos(order.order.id);

    const createdChecks = await paymentService.createChecksByItems({
      orderId: order.order.id,
      checks: [
        {
          checkLabel: 'Client 1',
          items: [{ orderItemId: order.items[0].id, quantity: 1 }],
        },
        {
          checkLabel: 'Client 2',
          items: [{ orderItemId: order.items[1].id, quantity: 1 }],
        },
      ],
    });
    const updatedOrder = await getOrder(order.order.id);

    expect(updatedOrder.paymentMode).toBe('split_by_items');
    expect(updatedOrder.discountCents).toBe(0);
    expect(updatedOrder.totalCents).toBe(1600);
    expect(createdChecks.map((check) => check.totalCents)).toEqual([1300, 300]);
  });

  it('splits equally using the optimized order total', async () => {
    const order = await createOrderWithItems([
      { menuItemId: context.items.bunBo.id, quantity: 2 },
      { menuItemId: context.items.coca.id, quantity: 2 },
    ]);
    const paymentService = createPaymentService(db);

    const createdChecks = await paymentService.splitOrderEqually({
      orderId: order.id,
      parts: 3,
    });

    expect(createdChecks.map((check) => check.totalCents)).toEqual([
      934, 933, 933,
    ]);
    expect(
      createdChecks.reduce((total, check) => total + check.totalCents, 0),
    ).toBe(2800);
  });

  it('voids unpaid checks when replacing a split mode', async () => {
    const { order, items } = await createOrderWithItemRecords([
      { menuItemId: context.items.bunBo.id, quantity: 1 },
      { menuItemId: context.items.coca.id, quantity: 1 },
    ]);
    const paymentService = createPaymentService(db);
    const itemChecks = await paymentService.createChecksByItems({
      orderId: order.id,
      checks: [
        {
          checkLabel: 'Client 1',
          items: [{ orderItemId: items[0].id, quantity: 1 }],
        },
        {
          checkLabel: 'Client 2',
          items: [{ orderItemId: items[1].id, quantity: 1 }],
        },
      ],
    });

    const equalChecks = await paymentService.splitOrderEqually({
      orderId: order.id,
      parts: 2,
    });
    const replacedChecks = await db.query.checks.findMany({
      where: inArray(
        checks.id,
        itemChecks.map((check) => check.id),
      ),
    });

    expect(replacedChecks.every((check) => check.status === 'void')).toBe(true);
    expect(equalChecks).toHaveLength(2);
    expect(equalChecks.every((check) => check.status === 'open')).toBe(true);
  });

  it('prevents replacing a split after a check is paid', async () => {
    const { order, items } = await createOrderWithItemRecords([
      { menuItemId: context.items.bunBo.id, quantity: 1 },
      { menuItemId: context.items.coca.id, quantity: 1 },
    ]);
    const paymentService = createPaymentService(db);
    const [check] = await paymentService.createChecksByItems({
      orderId: order.id,
      checks: [
        {
          checkLabel: 'Client 1',
          items: [{ orderItemId: items[0].id, quantity: 1 }],
        },
        {
          checkLabel: 'Client 2',
          items: [{ orderItemId: items[1].id, quantity: 1 }],
        },
      ],
    });

    await paymentService.payCheck({
      checkId: check.id,
      method: 'card',
      amountCents: check.totalCents,
    });

    await expect(
      paymentService.splitOrderEqually({ orderId: order.id, parts: 2 }),
    ).rejects.toMatchObject({
      code: 'invalid_status',
    });
  });

  it('cancels an unpaid split and returns the order to single payment mode', async () => {
    const order = await createOrderWithItems([
      { menuItemId: context.items.bunBo.id, quantity: 1 },
      { menuItemId: context.items.coca.id, quantity: 1 },
    ]);
    const paymentService = createPaymentService(db);
    const splitChecks = await paymentService.splitOrderEqually({
      orderId: order.id,
      parts: 2,
    });

    const updatedOrder = await paymentService.cancelOrderSplit(order.id);
    const cancelledChecks = await db.query.checks.findMany({
      where: inArray(
        checks.id,
        splitChecks.map((check) => check.id),
      ),
    });

    expect(updatedOrder.paymentMode).toBe('single');
    expect(updatedOrder.discountCents).toBe(200);
    expect(updatedOrder.totalCents).toBe(1400);
    expect(cancelledChecks.every((check) => check.status === 'void')).toBe(
      true,
    );
  });

  it('prevents cancelling a split after a check is paid', async () => {
    const order = await createOrderWithItems([
      { menuItemId: context.items.bunBo.id, quantity: 1 },
      { menuItemId: context.items.coca.id, quantity: 1 },
    ]);
    const paymentService = createPaymentService(db);
    const [check] = await paymentService.splitOrderEqually({
      orderId: order.id,
      parts: 2,
    });
    await paymentService.payCheck({
      checkId: check.id,
      method: 'card',
      amountCents: check.totalCents,
    });

    await expect(
      paymentService.cancelOrderSplit(order.id),
    ).rejects.toMatchObject({
      code: 'invalid_status',
    });
  });

  it('marks an order paid only when fully paid', async () => {
    const order = await createOrderWithItems([
      { menuItemId: context.items.bunBo.id, quantity: 1 },
      { menuItemId: context.items.coca.id, quantity: 1 },
    ]);
    const paymentService = createPaymentService(db);

    await paymentService.payFullOrder({
      orderId: order.id,
      method: 'card',
      amountCents: 500,
    });
    expect((await getOrder(order.id)).status).not.toBe('paid');

    await paymentService.payFullOrder({
      orderId: order.id,
      method: 'card',
      amountCents: 900,
    });
    expect((await getOrder(order.id)).status).toBe('paid');
  });

  it('merges repeated additions only within the pending kitchen batch', async () => {
    const orderService = createOrderService(db);
    const order = await createTestOrder(context.user.id);

    await orderService.addOrderItem({
      orderId: order.id,
      menuItemId: context.items.bunBo.id,
      quantity: 1,
    });
    await orderService.addOrderItem({
      orderId: order.id,
      menuItemId: context.items.bunBo.id,
      quantity: 1,
    });

    const pendingDetail = await orderService.getOrderDetail(order.id);
    expect(pendingDetail.items).toHaveLength(1);
    expect(pendingDetail.items[0]?.quantity).toBe(2);

    await orderService.sendOrderToKitchen(order.id);
    await orderService.addOrderItem({
      orderId: order.id,
      menuItemId: context.items.bunBo.id,
      quantity: 1,
    });

    const nextBatchDetail = await orderService.getOrderDetail(order.id);
    expect(nextBatchDetail.items).toHaveLength(2);
    expect(nextBatchDetail.items.map((item) => item.status).sort()).toEqual([
      'pending',
      'sent',
    ]);

    const sentItem = nextBatchDetail.items.find(
      (item) => item.status === 'sent',
    );
    expect(sentItem).toBeDefined();
    await expect(
      orderService.updateOrderItemQuantity({
        orderItemId: sentItem!.id,
        quantity: 1,
      }),
    ).rejects.toMatchObject({ code: 'invalid_status' });
    await expect(
      orderService.removePendingOrderItem(sentItem!.id),
    ).rejects.toMatchObject({ code: 'invalid_status' });
  });

  it('keeps item display order stable after a quantity update', async () => {
    const orderService = createOrderService(db);
    const order = await createTestOrder(context.user.id);
    const firstItem = await orderService.addOrderItem({
      orderId: order.id,
      menuItemId: context.items.bunBo.id,
      quantity: 1,
    });
    const secondItem = await orderService.addOrderItem({
      orderId: order.id,
      menuItemId: context.items.coca.id,
      quantity: 1,
    });

    expect(
      (await orderService.getOrderDetail(order.id)).items.map(
        (item) => item.id,
      ),
    ).toEqual([firstItem.id, secondItem.id]);

    await orderService.updateOrderItemQuantity({
      orderItemId: firstItem.id,
      quantity: 2,
    });

    expect(
      (await orderService.getOrderDetail(order.id)).items.map(
        (item) => item.id,
      ),
    ).toEqual([firstItem.id, secondItem.id]);
  });

  it('blocks item changes after a payment has been recorded', async () => {
    const orderService = createOrderService(db);
    const paymentService = createPaymentService(db);
    const order = await createTestOrder(context.user.id);
    const item = await orderService.addOrderItem({
      orderId: order.id,
      menuItemId: context.items.bunBo.id,
      quantity: 2,
    });

    await paymentService.payFullOrder({
      orderId: order.id,
      method: 'card',
      amountCents: 500,
    });

    await expect(
      orderService.addOrderItem({
        orderId: order.id,
        menuItemId: context.items.coca.id,
        quantity: 1,
      }),
    ).rejects.toMatchObject({ code: 'invalid_status' });
    await expect(
      orderService.updateOrderItemQuantity({
        orderItemId: item.id,
        quantity: 1,
      }),
    ).rejects.toMatchObject({ code: 'invalid_status' });
    await expect(
      orderService.removePendingOrderItem(item.id),
    ).rejects.toMatchObject({ code: 'invalid_status' });
  });

  it('blocks item changes while a payment split is active', async () => {
    const orderService = createOrderService(db);
    const paymentService = createPaymentService(db);
    const order = await createTestOrder(context.user.id);
    await orderService.addOrderItem({
      orderId: order.id,
      menuItemId: context.items.bunBo.id,
      quantity: 1,
    });

    await paymentService.splitOrderEqually({ orderId: order.id, parts: 2 });

    await expect(
      orderService.addOrderItem({
        orderId: order.id,
        menuItemId: context.items.coca.id,
        quantity: 1,
      }),
    ).rejects.toMatchObject({ code: 'invalid_status' });

    await paymentService.cancelOrderSplit(order.id);
    await expect(
      orderService.addOrderItem({
        orderId: order.id,
        menuItemId: context.items.coca.id,
        quantity: 1,
      }),
    ).resolves.toMatchObject({ status: 'pending' });
  });

  it('excludes cancelled items from totals', async () => {
    const orderService = createOrderService(db);
    const order = await createTestOrder(context.user.id);
    const bunBo = await orderService.addOrderItem({
      orderId: order.id,
      menuItemId: context.items.bunBo.id,
      quantity: 1,
    });
    await orderService.addOrderItem({
      orderId: order.id,
      menuItemId: context.items.coca.id,
      quantity: 1,
    });

    await orderService.cancelOrderItem({
      orderItemId: bunBo.id,
      reason: 'Test cancellation',
    });

    expect((await getOrder(order.id)).totalCents).toBe(300);
  });

  it('restores a cancelled pending item', async () => {
    const orderService = createOrderService(db);
    const order = await createTestOrder(context.user.id);
    const bunBo = await orderService.addOrderItem({
      orderId: order.id,
      menuItemId: context.items.bunBo.id,
      quantity: 1,
    });

    await orderService.cancelOrderItem({
      orderItemId: bunBo.id,
      reason: 'Test cancellation',
    });
    const restoredItem = await orderService.restoreOrderItem({
      orderItemId: bunBo.id,
    });

    expect(restoredItem.status).toBe('pending');
    expect((await getOrder(order.id)).totalCents).toBe(1300);
  });

  it('restores a cancelled sent item back to kitchen queue', async () => {
    const orderService = createOrderService(db);
    const order = await createTestOrder(context.user.id);
    const bunBo = await orderService.addOrderItem({
      orderId: order.id,
      menuItemId: context.items.bunBo.id,
      quantity: 1,
    });
    await orderService.sendOrderToKitchen(order.id);

    await orderService.cancelOrderItem({
      orderItemId: bunBo.id,
      reason: 'Test cancellation',
    });
    const restoredItem = await orderService.restoreOrderItem({
      orderItemId: bunBo.id,
    });

    expect(restoredItem.status).toBe('sent');
    expect((await getOrder(order.id)).status).toBe('sent');
  });

  it('keeps historical order item snapshots after menu price changes', async () => {
    const orderService = createOrderService(db);
    const order = await createTestOrder(context.user.id);
    const item = await orderService.addOrderItem({
      orderId: order.id,
      menuItemId: context.items.bunBo.id,
      quantity: 1,
    });

    await db
      .update(menuItems)
      .set({ priceCents: 9900, name: 'Changed Bun bo' })
      .where(eq(menuItems.id, context.items.bunBo.id));

    const savedItem = await db.query.orderItems.findFirst({
      where: eq(orderItems.id, item.id),
    });
    expect(savedItem?.itemNameSnapshot).toBe('Test Bun bo');
    expect(savedItem?.unitPriceCentsSnapshot).toBe(1300);
  });
});

async function createTestContext(): Promise<TestContext> {
  const suffix = randomUUID();
  const [user] = await db
    .insert(users)
    .values({
      name: 'Core Test Staff',
      email: `core-test-${suffix}@yuta.local`,
      role: 'staff',
    })
    .returning();
  const plats = await createCategory('Core Test Plats', 10);
  const drinks = await createCategory('Core Test Drinks', 20);
  const desserts = await createCategory('Core Test Desserts', 30);
  const bunBo = await createMenuItem(
    plats.id,
    'Test Bun bo',
    1300,
    'kitchen',
    10,
  );
  const comGa = await createMenuItem(
    plats.id,
    'Test Com ga',
    1200,
    'kitchen',
    20,
  );
  const pho = await createMenuItem(plats.id, 'Test Pho', 1400, 'kitchen', 30);
  const coca = await createMenuItem(drinks.id, 'Test Coca', 300, 'bar', 10);
  const icedTea = await createMenuItem(
    drinks.id,
    'Test Iced Tea',
    400,
    'bar',
    20,
  );
  const che = await createMenuItem(desserts.id, 'Test Che', 500, 'dessert', 10);

  await createComboRule('Test Combo A', 1400, 10, [
    {
      name: 'Plat',
      items: [
        { item: bunBo, extraPriceCents: 0 },
        { item: comGa, extraPriceCents: 0 },
        { item: pho, extraPriceCents: 100 },
      ],
    },
    {
      name: 'Boisson',
      items: [
        { item: coca, extraPriceCents: 0 },
        { item: icedTea, extraPriceCents: 100 },
      ],
    },
  ]);
  await createComboRule('Test Combo B', 1700, 20, [
    {
      name: 'Plat',
      items: [
        { item: bunBo, extraPriceCents: 0 },
        { item: comGa, extraPriceCents: 0 },
        { item: pho, extraPriceCents: 100 },
      ],
    },
    {
      name: 'Boisson',
      items: [
        { item: coca, extraPriceCents: 0 },
        { item: icedTea, extraPriceCents: 100 },
      ],
    },
    { name: 'Dessert', items: [{ item: che, extraPriceCents: 0 }] },
  ]);

  return {
    user,
    categories: { plats: plats.id, drinks: drinks.id, desserts: desserts.id },
    items: { bunBo, comGa, pho, coca, icedTea, che },
  };
}

async function createTestOrder(createdBy: string): Promise<Order> {
  const orderService = createOrderService(db);
  return orderService.createOrder({
    tableLabel: `Core Test ${randomUUID()}`,
    orderType: 'dine_in',
    createdBy,
  });
}

async function createOrderWithItems(
  items: Array<{ menuItemId: string; quantity: number }>,
): Promise<Order> {
  return (await createOrderWithItemRecords(items)).order;
}

async function createOrderWithItemRecords(
  items: Array<{ menuItemId: string; quantity: number }>,
): Promise<{ order: Order; items: OrderItem[] }> {
  const orderService = createOrderService(db);
  const order = await createTestOrder((await getTestUser()).id);
  const createdItems: OrderItem[] = [];

  for (const item of items) {
    createdItems.push(
      await orderService.addOrderItem({
        orderId: order.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      }),
    );
  }

  return { order, items: createdItems };
}

async function getTestUser(): Promise<User> {
  if (!context?.user) {
    throw new Error('Test user not found.');
  }
  return context.user;
}

async function getOrder(orderId: string): Promise<Order> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });
  if (!order) {
    throw new Error(`Order ${orderId} not found.`);
  }
  return order;
}

async function createCategory(name: string, sortOrder: number) {
  const [category] = await db
    .insert(menuCategories)
    .values({ name, sortOrder })
    .returning();
  return category;
}

async function createMenuItem(
  categoryId: string,
  name: string,
  priceCents: number,
  kitchenStation: 'kitchen' | 'bar' | 'dessert' | 'none',
  sortOrder: number,
): Promise<MenuItem> {
  const [item] = await db
    .insert(menuItems)
    .values({ categoryId, name, priceCents, kitchenStation, sortOrder })
    .returning();
  return item;
}

async function createComboRule(
  name: string,
  comboPriceCents: number,
  priority: number,
  groups: Array<{
    name: string;
    items: Array<{ item: MenuItem; extraPriceCents: number }>;
  }>,
  options: {
    pricingMode?: 'fixed' | 'base_item_plus_delta';
    priceDeltaCents?: number;
    basePricingGroupName?: string;
  } = {},
) {
  const [rule] = await db
    .insert(comboRules)
    .values({
      name,
      pricingMode: options.pricingMode ?? 'fixed',
      comboPriceCents,
      priceDeltaCents: options.priceDeltaCents ?? 0,
      basePricingGroupName: options.basePricingGroupName ?? null,
      priority,
    })
    .returning();

  for (const [index, group] of groups.entries()) {
    const [createdGroup] = await db
      .insert(comboRuleGroups)
      .values({
        comboRuleId: rule.id,
        name: group.name,
        minQuantity: 1,
        maxQuantity: 1,
        sortOrder: (index + 1) * 10,
      })
      .returning();

    await db.insert(comboRuleGroupItems).values(
      group.items.map(({ item, extraPriceCents }) => ({
        comboRuleGroupId: createdGroup.id,
        menuItemId: item.id,
        extraPriceCents,
      })),
    );
  }
}

async function resetMenuPrices(testContext: TestContext): Promise<void> {
  await db
    .update(menuItems)
    .set({ name: 'Test Bun bo', priceCents: 1300 })
    .where(eq(menuItems.id, testContext.items.bunBo.id));
}

async function cleanupRuntimeData(): Promise<void> {
  const testUsers = await db.query.users.findMany({
    where: eq(users.name, 'Core Test Staff'),
  });
  if (testUsers.length === 0) {
    return;
  }

  const testOrders = await db.query.orders.findMany({
    where: inArray(
      orders.createdBy,
      testUsers.map((user) => user.id),
    ),
  });
  if (testOrders.length === 0) {
    return;
  }

  const orderIds = testOrders.map((order) => order.id);
  const testChecks = await db.query.checks.findMany({
    where: inArray(checks.orderId, orderIds),
  });
  const checkIds = testChecks.map((check) => check.id);
  const orderDiscountRows = await db.query.orderDiscounts.findMany({
    where: inArray(orderDiscounts.orderId, orderIds),
  });
  const checkDiscountRows =
    checkIds.length > 0
      ? await db.query.checkDiscounts.findMany({
          where: inArray(checkDiscounts.checkId, checkIds),
        })
      : [];

  if (checkDiscountRows.length > 0) {
    await db.delete(checkDiscountItems).where(
      inArray(
        checkDiscountItems.checkDiscountId,
        checkDiscountRows.map((discount) => discount.id),
      ),
    );
    await db.delete(checkDiscounts).where(
      inArray(
        checkDiscounts.id,
        checkDiscountRows.map((discount) => discount.id),
      ),
    );
  }
  if (orderDiscountRows.length > 0) {
    await db.delete(orderDiscountItems).where(
      inArray(
        orderDiscountItems.orderDiscountId,
        orderDiscountRows.map((discount) => discount.id),
      ),
    );
    await db.delete(orderDiscounts).where(
      inArray(
        orderDiscounts.id,
        orderDiscountRows.map((discount) => discount.id),
      ),
    );
  }
  await db.delete(printJobs).where(inArray(printJobs.orderId, orderIds));
  await db.delete(payments).where(inArray(payments.orderId, orderIds));
  if (checkIds.length > 0) {
    await db.delete(checkItems).where(inArray(checkItems.checkId, checkIds));
    await db.delete(checks).where(inArray(checks.id, checkIds));
  }
  await db.delete(printJobs);
  await db.delete(orderItems).where(inArray(orderItems.orderId, orderIds));
  await db.delete(orders).where(inArray(orders.id, orderIds));
}

async function cleanupTestData(): Promise<void> {
  await cleanupRuntimeData();

  const rules = await db.query.comboRules.findMany({
    where: inArray(comboRules.name, [
      'Test Combo A',
      'Test Combo B',
      'Test Dynamic Combo',
    ]),
  });
  if (rules.length > 0) {
    const ruleIds = rules.map((rule) => rule.id);
    const groups = await db.query.comboRuleGroups.findMany({
      where: inArray(comboRuleGroups.comboRuleId, ruleIds),
    });
    if (groups.length > 0) {
      await db.delete(comboRuleGroupItems).where(
        inArray(
          comboRuleGroupItems.comboRuleGroupId,
          groups.map((group) => group.id),
        ),
      );
      await db.delete(comboRuleGroups).where(
        inArray(
          comboRuleGroups.id,
          groups.map((group) => group.id),
        ),
      );
    }
    await db.delete(comboRules).where(inArray(comboRules.id, ruleIds));
  }

  await db
    .delete(menuItems)
    .where(
      inArray(menuItems.name, [
        'Test Bun bo',
        'Changed Bun bo',
        'Test Com ga',
        'Test Pho',
        'Test Coca',
        'Test Iced Tea',
        'Test Che',
      ]),
    );
  await db
    .delete(menuCategories)
    .where(
      inArray(menuCategories.name, [
        'Core Test Plats',
        'Core Test Drinks',
        'Core Test Desserts',
      ]),
    );
  await db.delete(users).where(eq(users.name, 'Core Test Staff'));
}

async function cleanupDynamicComboRule(): Promise<void> {
  const rules = await db.query.comboRules.findMany({
    where: eq(comboRules.name, 'Test Dynamic Combo'),
  });

  if (rules.length === 0) {
    return;
  }

  const ruleIds = rules.map((rule) => rule.id);
  const groups = await db.query.comboRuleGroups.findMany({
    where: inArray(comboRuleGroups.comboRuleId, ruleIds),
  });

  if (groups.length > 0) {
    await db.delete(comboRuleGroupItems).where(
      inArray(
        comboRuleGroupItems.comboRuleGroupId,
        groups.map((group) => group.id),
      ),
    );
    await db.delete(comboRuleGroups).where(
      inArray(
        comboRuleGroups.id,
        groups.map((group) => group.id),
      ),
    );
  }

  await db.delete(comboRules).where(inArray(comboRules.id, ruleIds));
}

async function installRejectPrintJobTrigger(): Promise<void> {
  await db.execute(sql`
    create or replace function yuta_core_test_reject_print_job()
    returns trigger
    language plpgsql
    as $$
    begin
      raise exception 'Core test rejected print job';
    end;
    $$
  `);
  await db.execute(sql`
    create trigger yuta_core_test_reject_print_job_trigger
    before insert on print_jobs
    for each row execute function yuta_core_test_reject_print_job()
  `);
}

async function removeRejectPrintJobTrigger(): Promise<void> {
  await db.execute(
    sql`drop trigger if exists yuta_core_test_reject_print_job_trigger on print_jobs`,
  );
  await db.execute(
    sql`drop function if exists yuta_core_test_reject_print_job()`,
  );
}
