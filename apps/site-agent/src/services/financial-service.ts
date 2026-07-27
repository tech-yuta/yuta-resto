import {
  localChecksResponseSchema,
  localOrderResponseSchema,
  localPaymentCaptureResponseSchema,
  localPaymentSummaryResponseSchema,
  type CreateLocalChecksByItemsInput,
  type PayLocalCheckInput,
  type PayLocalOrderInput,
} from '@yuta/contracts/local-pos';
import type { PosDatabaseExecutor } from '@yuta/db-pos/client';
import {
  checkDiscountItems,
  checkDiscounts,
  checkItems,
  checks,
  localUsers,
  orderItems,
  orders,
  payments,
  printJobs,
  type Check,
  type Order,
  type Payment,
} from '@yuta/db-pos/schema';
import { and, asc, eq, inArray, isNull, ne, sql } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { HttpError } from '../http';
import { createComboPersistenceService } from './combo-persistence-service';
import { toOrderSummary } from './site-agent-service';

export function createFinancialService(db: PosDatabaseExecutor) {
  async function splitOrderEqually(orderId: string, parts: number) {
    return db.transaction(async (tx) => {
      await lockOrder(tx, orderId);
      let order = await getRequiredOrder(tx, orderId);
      assertOrderPayable(order);
      await assertNoPaidChecks(tx, orderId);
      await voidOpenChecks(tx, orderId);
      await createComboPersistenceService(tx).optimizeOrder(orderId);
      order = await getRequiredOrder(tx, orderId);
      const totals = splitCents(order.totalCents, parts);
      const created: Check[] = [];
      for (let index = 0; index < totals.length; index++) {
        const [check] = await tx
          .insert(checks)
          .values({
            id: uuidv7(),
            orderId,
            checkLabel: `Part ${index + 1}`,
            splitMode: 'equal',
            subtotalCents: totals[index],
            totalCents: totals[index],
          })
          .returning();
        created.push(check);
      }
      await tx
        .update(orders)
        .set({ paymentMode: 'split_equally' })
        .where(eq(orders.id, orderId));
      return localChecksResponseSchema.parse({
        checks: created.map((check) => toCheck(check)),
      });
    });
  }

  async function createChecksByItems(
    orderId: string,
    input: CreateLocalChecksByItemsInput,
  ) {
    return db.transaction(async (tx) => {
      await lockOrder(tx, orderId);
      const order = await getRequiredOrder(tx, orderId);
      assertOrderPayable(order);
      await assertNoPaidChecks(tx, orderId);
      await createComboPersistenceService(tx).clearOrderDiscounts(orderId);
      await voidOpenChecks(tx, orderId);
      const activeItems = await tx
        .select()
        .from(orderItems)
        .where(
          and(
            eq(orderItems.orderId, orderId),
            ne(orderItems.status, 'cancelled'),
          ),
        );
      const byId = new Map(activeItems.map((item) => [item.id, item]));
      const assigned = new Map<string, number>();
      for (const requestedCheck of input.checks) {
        for (const requestedItem of requestedCheck.items) {
          if (!byId.has(requestedItem.orderItemId)) {
            throw new HttpError(
              422,
              'INVALID_SPLIT',
              'Check includes an invalid order item.',
            );
          }
          assigned.set(
            requestedItem.orderItemId,
            (assigned.get(requestedItem.orderItemId) ?? 0) +
              requestedItem.quantity,
          );
        }
      }
      for (const [itemId, quantity] of assigned) {
        if (quantity > (byId.get(itemId)?.quantity ?? 0)) {
          throw new HttpError(
            422,
            'INVALID_SPLIT',
            'Assigned quantity exceeds the order item quantity.',
          );
        }
      }

      const created: Check[] = [];
      for (const requestedCheck of input.checks) {
        const subtotalCents = requestedCheck.items.reduce((sum, requested) => {
          const item = byId.get(requested.orderItemId);
          return sum + (item?.unitPriceCentsSnapshot ?? 0) * requested.quantity;
        }, 0);
        const [check] = await tx
          .insert(checks)
          .values({
            id: uuidv7(),
            orderId,
            checkLabel: requestedCheck.checkLabel,
            splitMode: 'items',
            subtotalCents,
            totalCents: subtotalCents,
          })
          .returning();
        await tx.insert(checkItems).values(
          requestedCheck.items.map((requested) => {
            const item = byId.get(requested.orderItemId);
            if (!item) {
              throw new HttpError(
                422,
                'INVALID_SPLIT',
                'Check includes an invalid order item.',
              );
            }
            return {
              id: uuidv7(),
              checkId: check.id,
              orderItemId: item.id,
              quantity: requested.quantity,
              amountCentsSnapshot:
                item.unitPriceCentsSnapshot * requested.quantity,
            };
          }),
        );
        await createComboPersistenceService(tx).optimizeCheck(check.id);
        created.push(await getRequiredCheck(tx, check.id));
      }
      await tx
        .update(orders)
        .set({ paymentMode: 'split_by_items' })
        .where(eq(orders.id, orderId));
      return localChecksResponseSchema.parse({
        checks: created.map((check) => toCheck(check)),
      });
    });
  }

  async function cancelOrderSplit(orderId: string) {
    return db.transaction(async (tx) => {
      await lockOrder(tx, orderId);
      const order = await getRequiredOrder(tx, orderId);
      assertOrderPayable(order);
      await assertNoPaidChecks(tx, orderId);
      await voidOpenChecks(tx, orderId);
      await createComboPersistenceService(tx).optimizeOrder(orderId);
      const [updated] = await tx
        .update(orders)
        .set({ paymentMode: 'single' })
        .where(eq(orders.id, orderId))
        .returning();
      return localOrderResponseSchema.parse({
        order: toOrderSummary(updated),
      });
    });
  }

  async function payOrder(orderId: string, input: PayLocalOrderInput) {
    return capturePayment(orderId, null, input);
  }

  async function payCheck(orderId: string, input: PayLocalCheckInput) {
    return capturePayment(orderId, input.checkId, input);
  }

  async function capturePayment(
    orderId: string,
    checkId: string | null,
    input: PayLocalOrderInput,
  ) {
    return db.transaction(async (tx) => {
      await lockOrder(tx, orderId);
      const existing = await tx.query.payments.findFirst({
        where: eq(payments.idempotencyKey, input.idempotencyKey),
      });
      if (existing) {
        assertPaymentReplay(existing, orderId, checkId, input);
        const existingJob =
          (await tx.query.printJobs.findFirst({
            where: eq(printJobs.idempotencyKey, input.idempotencyKey),
          })) ?? null;
        return localPaymentCaptureResponseSchema.parse({
          payment: toPayment(existing),
          printJob: existingJob ? toPrintJob(existingJob) : null,
          replayed: true,
        });
      }
      const conflictingJob = await tx.query.printJobs.findFirst({
        where: eq(printJobs.idempotencyKey, input.idempotencyKey),
      });
      if (conflictingJob) {
        throw new HttpError(
          409,
          'IDEMPOTENCY_CONFLICT',
          'Idempotency key belongs to another command.',
        );
      }
      const user = await tx.query.localUsers.findFirst({
        where: eq(localUsers.id, input.staffUserId),
      });
      if (!user?.isActive) {
        throw new HttpError(
          422,
          'STAFF_USER_UNAVAILABLE',
          'The selected local user is not available.',
        );
      }
      let order = await getRequiredOrder(tx, orderId);
      assertOrderPayable(order);
      let totalCents: number;
      let paidCents: number;
      if (checkId) {
        const check = await getRequiredCheck(tx, checkId);
        if (check.orderId !== orderId) {
          throw new HttpError(
            422,
            'CHECK_ORDER_MISMATCH',
            'Check does not belong to this order.',
          );
        }
        if (check.status !== 'open') {
          throw new HttpError(
            409,
            'CHECK_NOT_PAYABLE',
            'Check is not payable.',
          );
        }
        totalCents = check.totalCents;
        paidCents = await sumPaid(tx, orderId, checkId);
      } else {
        if (order.paymentMode !== 'single') {
          throw new HttpError(
            409,
            'ACTIVE_PAYMENT_SPLIT',
            'Split orders must be paid by check.',
          );
        }
        await createComboPersistenceService(tx).optimizeOrder(orderId);
        order = await getRequiredOrder(tx, orderId);
        totalCents = order.totalCents;
        paidCents = await sumPaid(tx, orderId, null);
      }
      const remainingCents = Math.max(0, totalCents - paidCents);
      if (remainingCents === 0) {
        throw new HttpError(
          409,
          'ALREADY_PAID',
          'The payment target is already fully paid.',
        );
      }
      if (input.amountCents > remainingCents) {
        throw new HttpError(
          422,
          'OVERPAYMENT',
          'Payment amount exceeds the remaining total.',
        );
      }
      const tenderedCents = input.tenderedCents ?? input.amountCents;
      if (tenderedCents < input.amountCents) {
        throw new HttpError(
          422,
          'INVALID_TENDER',
          'Tendered amount cannot be lower than payment amount.',
        );
      }
      const [payment] = await tx
        .insert(payments)
        .values({
          id: uuidv7(),
          orderId,
          checkId,
          method: input.method,
          amountCents: input.amountCents,
          tenderedCents,
          changeCents: tenderedCents - input.amountCents,
          tipCents: input.tipCents ?? 0,
          status: 'paid',
          paidBy: user.name,
          paidAt: new Date(),
          idempotencyKey: input.idempotencyKey,
        })
        .returning();
      const fullyPaid = paidCents + input.amountCents >= totalCents;
      if (checkId && fullyPaid) {
        await tx
          .update(checks)
          .set({ status: 'paid' })
          .where(eq(checks.id, checkId));
      }
      if (
        (!checkId && fullyPaid) ||
        (checkId && (await allChecksPaid(tx, orderId)))
      ) {
        await tx
          .update(orders)
          .set({ status: 'paid', paidAt: new Date() })
          .where(eq(orders.id, orderId));
      }
      const printJob = fullyPaid
        ? await createReceiptJob(
            tx,
            orderId,
            checkId,
            payment.id,
            input.idempotencyKey,
          )
        : null;
      return localPaymentCaptureResponseSchema.parse({
        payment: toPayment(payment),
        printJob: printJob ? toPrintJob(printJob) : null,
        replayed: false,
      });
    });
  }

  async function getPaymentSummary(orderId: string) {
    let order = await getRequiredOrder(db, orderId);
    if (
      order.paymentMode === 'single' &&
      order.status !== 'paid' &&
      order.status !== 'cancelled'
    ) {
      await createComboPersistenceService(db).optimizeOrder(orderId);
      order = await getRequiredOrder(db, orderId);
    }
    const [checkRows, paymentRows] = await Promise.all([
      db
        .select()
        .from(checks)
        .where(eq(checks.orderId, orderId))
        .orderBy(asc(checks.createdAt), asc(checks.id)),
      db
        .select()
        .from(payments)
        .where(eq(payments.orderId, orderId))
        .orderBy(asc(payments.createdAt), asc(payments.id)),
    ]);
    const checkItemRows =
      checkRows.length === 0
        ? []
        : await db
            .select({
              id: checkItems.id,
              checkId: checkItems.checkId,
              quantity: checkItems.quantity,
              amountCentsSnapshot: checkItems.amountCentsSnapshot,
              orderItemId: orderItems.id,
              itemNameSnapshot: orderItems.itemNameSnapshot,
              unitPriceCentsSnapshot: orderItems.unitPriceCentsSnapshot,
            })
            .from(checkItems)
            .innerJoin(orderItems, eq(checkItems.orderItemId, orderItems.id))
            .where(
              inArray(
                checkItems.checkId,
                checkRows.map((check) => check.id),
              ),
            );
    const checkDiscountRows =
      checkRows.length === 0
        ? []
        : await db
            .select()
            .from(checkDiscounts)
            .where(
              inArray(
                checkDiscounts.checkId,
                checkRows.map((check) => check.id),
              ),
            )
            .orderBy(asc(checkDiscounts.createdAt), asc(checkDiscounts.id));
    const checkDiscountItemRows =
      checkDiscountRows.length === 0
        ? []
        : await db
            .select({
              checkDiscountId: checkDiscountItems.checkDiscountId,
              quantityApplied: checkDiscountItems.quantityApplied,
              checkItemId: checkItems.id,
              orderItemId: orderItems.id,
              itemNameSnapshot: orderItems.itemNameSnapshot,
            })
            .from(checkDiscountItems)
            .innerJoin(
              checkItems,
              eq(checkDiscountItems.checkItemId, checkItems.id),
            )
            .innerJoin(orderItems, eq(checkItems.orderItemId, orderItems.id))
            .where(
              inArray(
                checkDiscountItems.checkDiscountId,
                checkDiscountRows.map((discount) => discount.id),
              ),
            );
    const paidCents = paymentRows
      .filter((payment) => payment.status === 'paid')
      .reduce((sum, payment) => sum + payment.amountCents, 0);
    return localPaymentSummaryResponseSchema.parse({
      order: toOrderSummary(order),
      checks: checkRows.map((check) =>
        toCheck(
          check,
          checkItemRows
            .filter((item) => item.checkId === check.id)
            .map((item) => ({
              id: item.id,
              quantity: item.quantity,
              amountCentsSnapshot: item.amountCentsSnapshot,
              orderItem: {
                id: item.orderItemId,
                itemNameSnapshot: item.itemNameSnapshot,
                unitPriceCentsSnapshot: item.unitPriceCentsSnapshot,
              },
            })),
          checkDiscountRows
            .filter((discount) => discount.checkId === check.id)
            .map((discount) => ({
              id: discount.id,
              nameSnapshot: discount.nameSnapshot,
              discountCents: discount.discountCents,
              items: checkDiscountItemRows
                .filter((item) => item.checkDiscountId === discount.id)
                .map((item) => ({
                  quantityApplied: item.quantityApplied,
                  checkItem: {
                    id: item.checkItemId,
                    orderItem: {
                      id: item.orderItemId,
                      itemNameSnapshot: item.itemNameSnapshot,
                    },
                  },
                })),
            })),
        ),
      ),
      payments: paymentRows.map(toPayment),
      paidCents,
      remainingCents: Math.max(0, order.totalCents - paidCents),
    });
  }

  return {
    splitOrderEqually,
    createChecksByItems,
    cancelOrderSplit,
    payOrder,
    payCheck,
    getPaymentSummary,
  };
}

async function createReceiptJob(
  db: PosDatabaseExecutor,
  orderId: string,
  checkId: string | null,
  paymentId: string,
  idempotencyKey: string,
) {
  const [order, itemRows, paymentRows] = await Promise.all([
    getRequiredOrder(db, orderId),
    checkId
      ? db
          .select({
            name: orderItems.itemNameSnapshot,
            quantity: checkItems.quantity,
            unitPriceCents: orderItems.unitPriceCentsSnapshot,
            amountCents: checkItems.amountCentsSnapshot,
          })
          .from(checkItems)
          .innerJoin(orderItems, eq(checkItems.orderItemId, orderItems.id))
          .where(eq(checkItems.checkId, checkId))
      : db
          .select({
            name: orderItems.itemNameSnapshot,
            quantity: orderItems.quantity,
            unitPriceCents: orderItems.unitPriceCentsSnapshot,
            amountCents: sql<number>`${orderItems.unitPriceCentsSnapshot} * ${orderItems.quantity}`,
          })
          .from(orderItems)
          .where(
            and(
              eq(orderItems.orderId, orderId),
              ne(orderItems.status, 'cancelled'),
            ),
          ),
    db
      .select()
      .from(payments)
      .where(
        checkId
          ? and(eq(payments.checkId, checkId), eq(payments.status, 'paid'))
          : and(
              eq(payments.orderId, orderId),
              isNull(payments.checkId),
              eq(payments.status, 'paid'),
            ),
      ),
  ]);
  const check = checkId ? await getRequiredCheck(db, checkId) : null;
  const [job] = await db
    .insert(printJobs)
    .values({
      id: uuidv7(),
      orderId,
      checkId,
      paymentId,
      source: 'pos',
      printerName: 'mock-receipt',
      jobType: 'customer_receipt',
      payload: {
        orderId,
        orderNumber: order.orderNumber,
        tableLabel: order.tableLabel,
        orderType: order.orderType,
        checkId,
        checkLabel: check?.checkLabel,
        createdAt: new Date().toISOString(),
        subtotalCents: check?.subtotalCents ?? order.subtotalCents,
        discountCents: check?.discountCents ?? order.discountCents,
        totalCents: check?.totalCents ?? order.totalCents,
        paidCents: paymentRows.reduce(
          (sum, payment) => sum + payment.amountCents,
          0,
        ),
        items: itemRows.map((item) => ({
          ...item,
          amountCents: Number(item.amountCents),
        })),
        payments: paymentRows.map((payment) => ({
          method: payment.method,
          amountCents: payment.amountCents,
          paidAt: payment.paidAt?.toISOString() ?? null,
        })),
      },
      idempotencyKey,
    })
    .returning();
  return job;
}

async function lockOrder(
  db: PosDatabaseExecutor,
  orderId: string,
): Promise<void> {
  const result = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.id, orderId))
    .for('update');
  if (!result[0]) {
    throw new HttpError(404, 'ORDER_NOT_FOUND', 'Order not found.');
  }
}

async function getRequiredOrder(
  db: PosDatabaseExecutor,
  orderId: string,
): Promise<Order> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });
  if (!order) {
    throw new HttpError(404, 'ORDER_NOT_FOUND', 'Order not found.');
  }
  return order;
}

async function getRequiredCheck(
  db: PosDatabaseExecutor,
  checkId: string,
): Promise<Check> {
  const check = await db.query.checks.findFirst({
    where: eq(checks.id, checkId),
  });
  if (!check) {
    throw new HttpError(404, 'CHECK_NOT_FOUND', 'Check not found.');
  }
  return check;
}

function assertOrderPayable(order: Order): void {
  if (order.status === 'paid' || order.status === 'cancelled') {
    throw new HttpError(409, 'ORDER_NOT_PAYABLE', 'Order is not payable.');
  }
}

async function assertNoPaidChecks(
  db: PosDatabaseExecutor,
  orderId: string,
): Promise<void> {
  const paid = await db.query.checks.findFirst({
    where: and(eq(checks.orderId, orderId), eq(checks.status, 'paid')),
  });
  if (paid) {
    throw new HttpError(
      409,
      'PAID_CHECK_EXISTS',
      'Cannot replace a split after a check has been paid.',
    );
  }
}

async function voidOpenChecks(
  db: PosDatabaseExecutor,
  orderId: string,
): Promise<void> {
  await db
    .update(checks)
    .set({ status: 'void' })
    .where(and(eq(checks.orderId, orderId), ne(checks.status, 'paid')));
}

async function sumPaid(
  db: PosDatabaseExecutor,
  orderId: string,
  checkId: string | null,
): Promise<number> {
  const rows = await db
    .select({ total: sql<number>`coalesce(sum(${payments.amountCents}), 0)` })
    .from(payments)
    .where(
      checkId
        ? and(eq(payments.checkId, checkId), eq(payments.status, 'paid'))
        : and(
            eq(payments.orderId, orderId),
            isNull(payments.checkId),
            eq(payments.status, 'paid'),
          ),
    );
  return Number(rows[0]?.total ?? 0);
}

async function allChecksPaid(
  db: PosDatabaseExecutor,
  orderId: string,
): Promise<boolean> {
  const rows = await db
    .select()
    .from(checks)
    .where(and(eq(checks.orderId, orderId), ne(checks.status, 'void')));
  return rows.length > 0 && rows.every((check) => check.status === 'paid');
}

function assertPaymentReplay(
  payment: Payment,
  orderId: string,
  checkId: string | null,
  input: PayLocalOrderInput,
): void {
  if (
    payment.orderId !== orderId ||
    payment.checkId !== checkId ||
    payment.method !== input.method ||
    payment.amountCents !== input.amountCents ||
    payment.tenderedCents !== (input.tenderedCents ?? input.amountCents) ||
    payment.tipCents !== (input.tipCents ?? 0)
  ) {
    throw new HttpError(
      409,
      'IDEMPOTENCY_CONFLICT',
      'Idempotency key was reused with different payment input.',
    );
  }
}

export function splitCents(total: number, parts: number): number[] {
  const base = Math.floor(total / parts);
  const remainder = total % parts;
  return Array.from(
    { length: parts },
    (_, index) => base + (index < remainder ? 1 : 0),
  );
}

function toCheck(
  check: Check,
  items: Array<{
    id: string;
    quantity: number;
    amountCentsSnapshot: number;
    orderItem: {
      id: string;
      itemNameSnapshot: string;
      unitPriceCentsSnapshot: number;
    };
  }> = [],
  discounts: Array<{
    id: string;
    nameSnapshot: string;
    discountCents: number;
    items: Array<{
      quantityApplied: number;
      checkItem: {
        id: string;
        orderItem: {
          id: string;
          itemNameSnapshot: string;
        };
      };
    }>;
  }> = [],
) {
  return {
    id: check.id,
    orderId: check.orderId,
    checkLabel: check.checkLabel,
    splitMode: check.splitMode,
    status: check.status,
    subtotalCents: check.subtotalCents,
    discountCents: check.discountCents,
    totalCents: check.totalCents,
    items,
    discounts,
    createdAt: check.createdAt.toISOString(),
  };
}

function toPayment(payment: Payment) {
  return {
    id: payment.id,
    orderId: payment.orderId,
    checkId: payment.checkId,
    method: payment.method,
    amountCents: payment.amountCents,
    tenderedCents: payment.tenderedCents,
    changeCents: payment.changeCents,
    tipCents: payment.tipCents,
    status: payment.status,
    paidBy: payment.paidBy,
    paidAt: payment.paidAt?.toISOString() ?? null,
    createdAt: payment.createdAt.toISOString(),
  };
}

function toPrintJob(job: typeof printJobs.$inferSelect) {
  return {
    id: job.id,
    orderId: job.orderId,
    checkId: job.checkId,
    paymentId: job.paymentId,
    type: job.jobType,
    status: job.status,
    printerName: job.printerName,
    errorMessage: job.errorMessage,
    createdAt: job.createdAt.toISOString(),
    printedAt: job.printedAt?.toISOString() ?? null,
  };
}
