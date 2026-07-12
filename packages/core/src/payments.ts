import { and, asc, eq, isNull, ne, sql } from 'drizzle-orm';
import {
  checkItems,
  checks,
  comboRuleGroups,
  comboRules,
  orderItems,
  orders,
  payments,
  type Check,
  type Order,
  type Payment,
} from '@yuta/db/schema';
import type { DbClient } from '@yuta/db/client';
import { z } from 'zod';
import { createComboService } from './combos';

type PaymentMethod = 'cash' | 'card' | 'ticket_resto' | 'other';

const paymentMethodSchema = z.enum(['cash', 'card', 'ticket_resto', 'other']);

const payFullOrderSchema = z.object({
  orderId: z.string().uuid(),
  method: paymentMethodSchema,
  amountCents: z.number().int().positive(),
  tenderedCents: z.number().int().positive().optional(),
  tipCents: z.number().int().nonnegative().optional(),
  paidBy: z.string().trim().max(255).optional(),
});

const createChecksByItemsSchema = z.object({
  orderId: z.string().uuid(),
  checks: z
    .array(
      z.object({
        checkLabel: z.string().trim().min(1).max(255),
        items: z
          .array(
            z.object({
              orderItemId: z.string().uuid(),
              quantity: z.number().int().positive(),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});

const splitOrderEquallySchema = z.object({
  orderId: z.string().uuid(),
  parts: z.number().int().min(2).max(99),
});

const payCheckSchema = z.object({
  checkId: z.string().uuid(),
  method: paymentMethodSchema,
  amountCents: z.number().int().positive(),
  tenderedCents: z.number().int().positive().optional(),
  tipCents: z.number().int().nonnegative().optional(),
  paidBy: z.string().trim().max(255).optional(),
});

const orderIdSchema = z.object({
  orderId: z.string().uuid(),
});

export type PayFullOrderInput = z.infer<typeof payFullOrderSchema>;
export type CreateChecksByItemsInput = z.infer<typeof createChecksByItemsSchema>;
export type SplitOrderEquallyInput = z.infer<typeof splitOrderEquallySchema>;
export type PayCheckInput = z.infer<typeof payCheckSchema>;

export type PaymentSummary = {
  order: Order;
  checks: Check[];
  payments: Payment[];
  paidCents: number;
  remainingCents: number;
};

export class PaymentServiceError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'not_found'
      | 'invalid_input'
      | 'invalid_status'
      | 'invalid_split'
      | 'overpayment',
  ) {
    super(message);
    this.name = 'PaymentServiceError';
  }
}

export function createPaymentService(db: DbClient) {
  const comboService = createComboService(db);

  async function payFullOrder(input: PayFullOrderInput): Promise<Payment> {
    const values = payFullOrderSchema.parse(input);
    let order = await getRequiredOrder(values.orderId);

    assertOrderPayable(order);
    await comboService.optimizeOrderCombos(order.id);
    order = await getRequiredOrder(order.id);

    const existingPaidCents = await getPaidOrderAmount(order.id);
    const remainingCents = Math.max(0, order.totalCents - existingPaidCents);

    if (remainingCents === 0) {
      await markOrderPaid(order.id);
      throw new PaymentServiceError('Order is already fully paid.', 'invalid_status');
    }

    if (values.amountCents > remainingCents) {
      throw new PaymentServiceError('Payment amount exceeds remaining order total.', 'overpayment');
    }

    const payment = await createPaidPayment({
      orderId: order.id,
      method: values.method,
      amountCents: values.amountCents,
      tenderedCents: values.tenderedCents,
      tipCents: values.tipCents,
      paidBy: values.paidBy,
    });

    const paidCents = existingPaidCents + values.amountCents;
    if (paidCents >= order.totalCents) {
      await markOrderPaid(order.id);
    }

    return payment;
  }

  async function createChecksByItems(input: CreateChecksByItemsInput): Promise<Check[]> {
    const values = createChecksByItemsSchema.parse(input);
    const order = await getRequiredOrder(values.orderId);

    assertOrderPayable(order);
    await assertNoPaidChecks(order.id);
    await comboService.clearOrderComboDiscounts(order.id);
    await voidOpenChecks(order.id);

    const activeItems = await db.query.orderItems.findMany({
      where: and(eq(orderItems.orderId, order.id), ne(orderItems.status, 'cancelled')),
    });
    const activeItemsById = new Map(activeItems.map((item) => [item.id, item]));
    const assignedQuantities = new Map<string, number>();

    for (const checkInput of values.checks) {
      for (const itemInput of checkInput.items) {
        const item = activeItemsById.get(itemInput.orderItemId);
        if (!item) {
          throw new PaymentServiceError('Check includes an invalid order item.', 'invalid_split');
        }

        assignedQuantities.set(
          item.id,
          (assignedQuantities.get(item.id) ?? 0) + itemInput.quantity,
        );
      }
    }

    for (const [orderItemId, assignedQuantity] of assignedQuantities.entries()) {
      const item = activeItemsById.get(orderItemId);
      if (!item || assignedQuantity > item.quantity) {
        throw new PaymentServiceError('Assigned check quantity exceeds order item quantity.', 'invalid_split');
      }
    }

    const createdChecks: Check[] = [];

    for (const checkInput of values.checks) {
      const subtotalCents = checkInput.items.reduce((total, itemInput) => {
        const item = activeItemsById.get(itemInput.orderItemId);
        if (!item) {
          throw new PaymentServiceError('Check includes an invalid order item.', 'invalid_split');
        }

        return total + item.unitPriceCentsSnapshot * itemInput.quantity;
      }, 0);

      const [createdCheck] = await db
        .insert(checks)
        .values({
          orderId: order.id,
          checkLabel: checkInput.checkLabel,
          splitMode: 'items',
          subtotalCents,
          totalCents: subtotalCents,
        })
        .returning();

      await db.insert(checkItems).values(
        checkInput.items.map((itemInput) => {
          const item = activeItemsById.get(itemInput.orderItemId);
          if (!item) {
            throw new PaymentServiceError('Check includes an invalid order item.', 'invalid_split');
          }

          return {
            checkId: createdCheck.id,
            orderItemId: item.id,
            quantity: itemInput.quantity,
            amountCentsSnapshot: item.unitPriceCentsSnapshot * itemInput.quantity,
          };
        }),
      );

      await comboService.optimizeCheckCombos(createdCheck.id);
      createdChecks.push(await getRequiredCheck(createdCheck.id));
    }

    await db
      .update(orders)
      .set({ paymentMode: 'split_by_items' })
      .where(eq(orders.id, order.id));

    return createdChecks;
  }

  async function splitOrderEqually(input: SplitOrderEquallyInput): Promise<Check[]> {
    const values = splitOrderEquallySchema.parse(input);
    let order = await getRequiredOrder(values.orderId);

    assertOrderPayable(order);
    await assertNoPaidChecks(order.id);
    await voidOpenChecks(order.id);
    await comboService.optimizeOrderCombos(order.id);
    order = await getRequiredOrder(order.id);

    const totals = splitCents(order.totalCents, values.parts);
    const createdChecks: Check[] = [];

    for (let index = 0; index < totals.length; index++) {
      const [createdCheck] = await db
        .insert(checks)
        .values({
          orderId: order.id,
          checkLabel: `Part ${index + 1}`,
          splitMode: 'equal',
          subtotalCents: totals[index],
          totalCents: totals[index],
        })
        .returning();

      createdChecks.push(createdCheck);
    }

    await db
      .update(orders)
      .set({ paymentMode: 'split_equally' })
      .where(eq(orders.id, order.id));

    return createdChecks;
  }

  async function payCheck(input: PayCheckInput): Promise<Payment> {
    const values = payCheckSchema.parse(input);
    const check = await getRequiredCheck(values.checkId);
    const order = await getRequiredOrder(check.orderId);

    assertOrderPayable(order);

    if (check.status === 'paid' || check.status === 'void') {
      throw new PaymentServiceError('Check is not payable.', 'invalid_status');
    }

    const existingPaidCents = await getPaidCheckAmount(check.id);
    const remainingCents = Math.max(0, check.totalCents - existingPaidCents);

    if (values.amountCents > remainingCents) {
      throw new PaymentServiceError('Payment amount exceeds remaining check total.', 'overpayment');
    }

    const payment = await createPaidPayment({
      orderId: check.orderId,
      checkId: check.id,
      method: values.method,
      amountCents: values.amountCents,
      tenderedCents: values.tenderedCents,
      tipCents: values.tipCents,
      paidBy: values.paidBy,
    });

    const paidCents = existingPaidCents + values.amountCents;
    if (paidCents >= check.totalCents) {
      await db.update(checks).set({ status: 'paid' }).where(eq(checks.id, check.id));
    }

    await markOrderPaidIfAllChecksPaid(check.orderId);

    return payment;
  }

  async function cancelOrderSplit(orderId: string): Promise<Order> {
    const { orderId: parsedOrderId } = orderIdSchema.parse({ orderId });
    const order = await getRequiredOrder(parsedOrderId);

    assertOrderPayable(order);
    await assertNoPaidChecks(order.id);
    await voidOpenChecks(order.id);
    await comboService.optimizeOrderCombos(order.id);

    const [updatedOrder] = await db
      .update(orders)
      .set({ paymentMode: 'single' })
      .where(eq(orders.id, order.id))
      .returning();

    return updatedOrder;
  }

  async function getPaymentSummary(orderId: string): Promise<PaymentSummary> {
    const { orderId: parsedOrderId } = orderIdSchema.parse({ orderId });
    const order = await getRequiredOrder(parsedOrderId);
    const orderChecks = await db.query.checks.findMany({
      where: eq(checks.orderId, parsedOrderId),
      orderBy: [asc(checks.createdAt), asc(checks.id)],
    });
    const orderPayments = await db.query.payments.findMany({
      where: eq(payments.orderId, parsedOrderId),
      orderBy: [asc(payments.createdAt), asc(payments.id)],
    });
    const paidCents = orderPayments
      .filter((payment) => payment.status === 'paid')
      .reduce((total, payment) => total + payment.amountCents, 0);

    return {
      order,
      checks: orderChecks,
      payments: orderPayments,
      paidCents,
      remainingCents: Math.max(0, order.totalCents - paidCents),
    };
  }

  async function voidOpenChecks(orderId: string): Promise<void> {
    await db
      .update(checks)
      .set({ status: 'void' })
      .where(and(eq(checks.orderId, orderId), ne(checks.status, 'paid')));
  }

  async function assertNoPaidChecks(orderId: string): Promise<void> {
    const paidChecks = await db.query.checks.findMany({
      where: and(eq(checks.orderId, orderId), eq(checks.status, 'paid')),
    });

    if (paidChecks.length > 0) {
      throw new PaymentServiceError('Cannot replace a split after a check has been paid.', 'invalid_status');
    }
  }

  async function createPaidPayment(values: {
    orderId: string;
    checkId?: string;
    method: PaymentMethod;
    amountCents: number;
    tenderedCents?: number;
    tipCents?: number;
    paidBy?: string;
  }): Promise<Payment> {
    const tenderedCents = values.tenderedCents ?? values.amountCents;
    if (tenderedCents < values.amountCents) {
      throw new PaymentServiceError('Tendered amount cannot be lower than payment amount.', 'invalid_input');
    }

    const [payment] = await db
      .insert(payments)
      .values({
        orderId: values.orderId,
        checkId: values.checkId,
        method: values.method,
        amountCents: values.amountCents,
        tenderedCents,
        changeCents: tenderedCents - values.amountCents,
        tipCents: values.tipCents ?? 0,
        status: 'paid',
        paidBy: values.paidBy,
        paidAt: new Date(),
      })
      .returning();

    return payment;
  }

  async function getRequiredOrder(orderId: string): Promise<Order> {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      throw new PaymentServiceError('Order not found.', 'not_found');
    }

    return order;
  }

  async function getRequiredCheck(checkId: string): Promise<Check> {
    const check = await db.query.checks.findFirst({
      where: eq(checks.id, checkId),
    });

    if (!check) {
      throw new PaymentServiceError('Check not found.', 'not_found');
    }

    return check;
  }

  async function getPaidOrderAmount(orderId: string): Promise<number> {
    const result = await db
      .select({ total: sql<number>`coalesce(sum(${payments.amountCents}), 0)` })
      .from(payments)
      .where(and(eq(payments.orderId, orderId), isNull(payments.checkId), eq(payments.status, 'paid')));

    return Number(result[0]?.total ?? 0);
  }

  async function getPaidCheckAmount(checkId: string): Promise<number> {
    const result = await db
      .select({ total: sql<number>`coalesce(sum(${payments.amountCents}), 0)` })
      .from(payments)
      .where(and(eq(payments.checkId, checkId), eq(payments.status, 'paid')));

    return Number(result[0]?.total ?? 0);
  }

  async function markOrderPaid(orderId: string): Promise<void> {
    await db.update(orders).set({ status: 'paid', paidAt: new Date() }).where(eq(orders.id, orderId));
  }

  async function markOrderPaidIfAllChecksPaid(orderId: string): Promise<void> {
    const payableChecks = await db.query.checks.findMany({
      where: and(eq(checks.orderId, orderId), ne(checks.status, 'void')),
    });

    if (payableChecks.length > 0 && payableChecks.every((check) => check.status === 'paid')) {
      await markOrderPaid(orderId);
    }
  }

  async function getPaymentViewData(orderId: string) {
    const { orderId: parsedOrderId } = orderIdSchema.parse({ orderId });

    const existingOrder = await db.query.orders.findFirst({
      where: eq(orders.id, parsedOrderId),
      with: { checks: true },
    });

    if (!existingOrder) {
      throw new PaymentServiceError('Order not found.', 'not_found');
    }

    const hasActiveItemSplitChecks = existingOrder.checks.some(
      (check) => check.splitMode === 'items' && check.status !== 'void',
    );

    if (hasActiveItemSplitChecks) {
      await comboService.clearOrderComboDiscounts(parsedOrderId);
    } else {
      await comboService.optimizeOrderCombos(parsedOrderId);
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, parsedOrderId),
      with: {
        checks: {
          with: {
            items: {
              with: { orderItem: true },
            },
            discounts: {
              with: {
                items: {
                  with: {
                    checkItem: {
                      with: { orderItem: true },
                    },
                  },
                },
              },
            },
          },
        },
        items: true,
        discounts: {
          with: {
            items: {
              with: { orderItem: true },
            },
          },
        },
        payments: true,
      },
    });

    if (!order) {
      throw new PaymentServiceError('Order not found.', 'not_found');
    }

    const activeComboRules = await db.query.comboRules.findMany({
      where: eq(comboRules.isActive, true),
      with: {
        groups: {
          with: { items: true },
          orderBy: [asc(comboRuleGroups.sortOrder)],
        },
      },
      orderBy: [asc(comboRules.priority), asc(comboRules.name)],
    });

    return { order, activeComboRules };
  }

  return {
    payFullOrder,
    createChecksByItems,
    splitOrderEqually,
    payCheck,
    cancelOrderSplit,
    getPaymentSummary,
    getPaymentViewData,
  };
}

function assertOrderPayable(order: Order): void {
  if (order.status === 'paid' || order.status === 'cancelled') {
    throw new PaymentServiceError('Order is not payable.', 'invalid_status');
  }
}

function splitCents(totalCents: number, parts: number): number[] {
  const base = Math.floor(totalCents / parts);
  const remainder = totalCents % parts;

  return Array.from({ length: parts }, (_, index) => base + (index < remainder ? 1 : 0));
}
