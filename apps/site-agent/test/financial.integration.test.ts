import { config } from 'dotenv';
import { and, eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import {
  createPosDatabaseClient,
  type PosDatabaseClient,
} from '@yuta/db-pos/client';
import {
  checkDiscountItems,
  checkDiscounts,
  checkItems,
  checks,
  comboRuleGroupItems,
  comboRuleGroups,
  comboRules,
  localUsers,
  menuCategories,
  menuItems,
  orderItems,
  orders,
  payments,
  printJobs,
} from '@yuta/db-pos/schema';
import { createLocalPrinterWorker } from '../src/services/local-printer-worker';
import { createSiteAgentService } from '../src/services/site-agent-service';

config({ path: '.env.test' });
config({ path: '.env.local' });

const integrationTest =
  process.env.POS_DATABASE_URL &&
  process.env.YUTA_ALLOW_DATABASE_INTEGRATION_TESTS === 'true'
    ? describe
    : describe.skip;

integrationTest('site-agent financial transaction integration', () => {
  let db: PosDatabaseClient;
  const userId = uuidv7();
  const categoryId = uuidv7();
  const mainItemId = uuidv7();
  const drinkItemId = uuidv7();
  const ruleId = uuidv7();
  const mainGroupId = uuidv7();
  const drinkGroupId = uuidv7();
  const orderId = uuidv7();
  const mainOrderItemId = uuidv7();
  const drinkOrderItemId = uuidv7();
  const kitchenSendKey = uuidv7();
  const paymentKey = uuidv7();

  beforeAll(async () => {
    db = createPosDatabaseClient(process.env);
    await db.insert(localUsers).values({
      id: userId,
      name: 'Financial Integration User',
      role: 'admin',
    });
    await db.insert(menuCategories).values({
      id: categoryId,
      name: `Financial Integration ${categoryId}`,
    });
    await db.insert(menuItems).values([
      {
        id: mainItemId,
        categoryId,
        name: 'Integration Main',
        priceCents: 1400,
        kitchenStation: 'kitchen',
      },
      {
        id: drinkItemId,
        categoryId,
        name: 'Integration Drink',
        priceCents: 300,
        kitchenStation: 'bar',
      },
    ]);
    await db.insert(comboRules).values({
      id: ruleId,
      name: `Integration Combo ${ruleId}`,
      comboPriceCents: 1400,
      priority: 1,
    });
    await db.insert(comboRuleGroups).values([
      {
        id: mainGroupId,
        comboRuleId: ruleId,
        name: 'Main',
        minQuantity: 1,
        maxQuantity: 1,
        sortOrder: 1,
      },
      {
        id: drinkGroupId,
        comboRuleId: ruleId,
        name: 'Drink',
        minQuantity: 1,
        maxQuantity: 1,
        sortOrder: 2,
      },
    ]);
    await db.insert(comboRuleGroupItems).values([
      {
        id: uuidv7(),
        comboRuleGroupId: mainGroupId,
        menuItemId: mainItemId,
        extraPriceCents: 0,
      },
      {
        id: uuidv7(),
        comboRuleGroupId: drinkGroupId,
        menuItemId: drinkItemId,
        extraPriceCents: 0,
      },
    ]);
    await db.insert(orders).values({
      id: orderId,
      orderNumber: `FIN-${orderId}`,
      tableLabel: 'Financial Integration',
      orderType: 'dine_in',
      subtotalCents: 1700,
      totalCents: 1700,
      createdBy: userId,
    });
    await db.insert(orderItems).values([
      {
        id: mainOrderItemId,
        orderId,
        menuItemId: mainItemId,
        itemNameSnapshot: 'Integration Main',
        unitPriceCentsSnapshot: 1400,
        kitchenStationSnapshot: 'kitchen',
        quantity: 1,
      },
      {
        id: drinkOrderItemId,
        orderId,
        menuItemId: drinkItemId,
        itemNameSnapshot: 'Integration Drink',
        unitPriceCentsSnapshot: 300,
        kitchenStationSnapshot: 'bar',
        quantity: 1,
      },
    ]);
  });

  afterAll(async () => {
    if (!db) {
      return;
    }
    const orderChecks = await db
      .select({ id: checks.id })
      .from(checks)
      .where(eq(checks.orderId, orderId));
    const checkIds = orderChecks.map(({ id }) => id);
    if (checkIds.length > 0) {
      const discounts = await db
        .select({ id: checkDiscounts.id })
        .from(checkDiscounts)
        .where(inArray(checkDiscounts.checkId, checkIds));
      const discountIds = discounts.map(({ id }) => id);
      if (discountIds.length > 0) {
        await db
          .delete(checkDiscountItems)
          .where(inArray(checkDiscountItems.checkDiscountId, discountIds));
        await db
          .delete(checkDiscounts)
          .where(inArray(checkDiscounts.id, discountIds));
      }
      await db.delete(checkItems).where(inArray(checkItems.checkId, checkIds));
    }
    await db.delete(printJobs).where(eq(printJobs.orderId, orderId));
    await db.delete(payments).where(eq(payments.orderId, orderId));
    await db.delete(checks).where(eq(checks.orderId, orderId));
    await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
    await db.delete(orders).where(eq(orders.id, orderId));
    await db
      .delete(comboRuleGroupItems)
      .where(
        inArray(comboRuleGroupItems.comboRuleGroupId, [
          mainGroupId,
          drinkGroupId,
        ]),
      );
    await db
      .delete(comboRuleGroups)
      .where(eq(comboRuleGroups.comboRuleId, ruleId));
    await db.delete(comboRules).where(eq(comboRules.id, ruleId));
    await db
      .delete(menuItems)
      .where(inArray(menuItems.id, [mainItemId, drinkItemId]));
    await db.delete(menuCategories).where(eq(menuCategories.id, categoryId));
    await db.delete(localUsers).where(eq(localUsers.id, userId));
    await db.$client.end({ timeout: 5 });
  });

  it('prints an internal ticket, captures payment once, and replays', async () => {
    const service = createSiteAgentService(db);
    const catalog = await service.getCatalog();
    expect(
      catalog.comboRules.find((rule) => rule.id === ruleId)?.groups,
    ).toEqual([
      expect.objectContaining({
        id: mainGroupId,
        items: [expect.objectContaining({ menuItemId: mainItemId })],
      }),
      expect.objectContaining({
        id: drinkGroupId,
        items: [expect.objectContaining({ menuItemId: drinkItemId })],
      }),
    ]);

    await service.executeOrderCommand(orderId, {
      action: 'send_to_kitchen',
      staffUserId: userId,
      idempotencyKey: kitchenSendKey,
      allergyAcknowledged: false,
    });
    const kitchenJob = await db.query.printJobs.findFirst({
      where: eq(printJobs.idempotencyKey, kitchenSendKey),
    });
    expect(kitchenJob?.printerName).toBe('tm-m30-internal');
    if (!kitchenJob) throw new Error('Expected kitchen print job.');

    const output: Buffer[] = [];
    const worker = createLocalPrinterWorker({
      db,
      devicePath: '/dev/rfcomm-test',
      pollIntervalMs: 1_000,
      write: async (_devicePath, data) => {
        output.push(data);
      },
    });
    expect(await worker.processNext()).toBe(true);
    expect(output).toHaveLength(1);
    const printedOutput = output[0];
    expect(printedOutput).toBeDefined();
    expect(printedOutput?.toString('ascii')).toContain('=== CUISINE ===');
    expect(printedOutput?.toString('ascii')).toContain(
      '=== CAISSE - BOISSONS / DESSERTS ===',
    );
    const [printedJob] = await db
      .select({ status: printJobs.status })
      .from(printJobs)
      .where(eq(printJobs.id, kitchenJob.id));
    expect(printedJob?.status).toBe('printed');
    const singleSummary = await service.getPaymentSummary(orderId);
    expect(singleSummary.order.totalCents).toBe(1400);
    const discountedDetail = await service.getOrderDetail(orderId);
    expect(discountedDetail.discounts).toEqual([
      expect.objectContaining({
        discountCents: 300,
        items: expect.arrayContaining([
          expect.objectContaining({
            orderItem: expect.objectContaining({ id: mainOrderItemId }),
          }),
          expect.objectContaining({
            orderItem: expect.objectContaining({ id: drinkOrderItemId }),
          }),
        ]),
      }),
    ]);

    const split = await service.createChecksByItems(orderId, {
      checks: [
        {
          checkLabel: 'Client 1',
          items: [
            { orderItemId: mainOrderItemId, quantity: 1 },
            { orderItemId: drinkOrderItemId, quantity: 1 },
          ],
        },
      ],
    });
    expect(split.checks[0]?.totalCents).toBe(1400);
    const summary = await service.getPaymentSummary(orderId);
    expect(summary.checks[0]?.items).toEqual([
      expect.objectContaining({
        quantity: 1,
        orderItem: expect.objectContaining({ id: mainOrderItemId }),
      }),
      expect.objectContaining({
        quantity: 1,
        orderItem: expect.objectContaining({ id: drinkOrderItemId }),
      }),
    ]);
    expect(summary.checks[0]?.discounts).toEqual([
      expect.objectContaining({
        nameSnapshot: `Integration Combo ${ruleId}`,
        discountCents: 300,
        items: expect.arrayContaining([
          expect.objectContaining({
            quantityApplied: 1,
            checkItem: expect.objectContaining({
              orderItem: expect.objectContaining({ id: mainOrderItemId }),
            }),
          }),
          expect.objectContaining({
            quantityApplied: 1,
            checkItem: expect.objectContaining({
              orderItem: expect.objectContaining({ id: drinkOrderItemId }),
            }),
          }),
        ]),
      }),
    ]);

    const input = {
      checkId: split.checks[0].id,
      method: 'card' as const,
      amountCents: 1400,
      staffUserId: userId,
      idempotencyKey: paymentKey,
    };
    const captured = await service.payCheck(orderId, input);
    expect(captured.replayed).toBe(false);
    expect(captured.printJob).toBeNull();

    const replayed = await service.payCheck(orderId, input);
    expect(replayed.replayed).toBe(true);
    expect(replayed.payment.id).toBe(captured.payment.id);
    expect(replayed.printJob).toBeNull();

    const paymentCount = await db
      .select({ id: payments.id })
      .from(payments)
      .where(
        and(
          eq(payments.orderId, orderId),
          eq(payments.idempotencyKey, paymentKey),
        ),
      );
    expect(paymentCount).toHaveLength(1);

    const receiptJobs = await db
      .select({ id: printJobs.id })
      .from(printJobs)
      .where(
        and(
          eq(printJobs.orderId, orderId),
          eq(printJobs.jobType, 'customer_receipt'),
        ),
      );
    expect(receiptJobs).toHaveLength(0);
  });
});
