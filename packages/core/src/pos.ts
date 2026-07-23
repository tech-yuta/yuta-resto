import type { DbClient } from '@yuta/db/client';
import {
  orders,
  orderItems,
  payments,
  printJobs,
  type Check,
  type Order,
  type Payment,
  type PrintJob,
} from '@yuta/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { createOrderService, type OrderDetail } from './orders';
import {
  createPaymentService,
  type CreateChecksByItemsInput,
  type PayCheckInput,
  type PayFullOrderInput,
  type SplitOrderEquallyInput,
} from './payments';
import { createPrintService } from './prints';

const sendToKitchenSchema = z.object({
  orderId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
  allergyAcknowledged: z.boolean().optional(),
  allergyAcknowledgedBy: z.string().uuid().optional(),
});

const payFullOrderWithReceiptSchema = z.object({
  orderId: z.string().uuid(),
  method: z.enum(['cash', 'card', 'ticket_resto', 'other']),
  amountCents: z.number().int().positive(),
  tenderedCents: z.number().int().positive().optional(),
  tipCents: z.number().int().nonnegative().optional(),
  paidBy: z.string().trim().max(255).optional(),
  idempotencyKey: z.string().uuid(),
});

const payCheckWithReceiptSchema = payFullOrderWithReceiptSchema.extend({
  checkId: z.string().uuid(),
});

export type SendToKitchenInput = z.infer<typeof sendToKitchenSchema>;
export type PayFullOrderWithReceiptInput = z.infer<
  typeof payFullOrderWithReceiptSchema
>;
export type PayCheckWithReceiptInput = z.infer<
  typeof payCheckWithReceiptSchema
>;

export type KitchenSendResult = {
  order: OrderDetail;
  printJob: PrintJob;
  replayed: boolean;
};

export type PaymentCaptureResult = {
  payment: Payment;
  printJob: PrintJob | null;
  replayed: boolean;
};

export class PosServiceError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'not_found'
      | 'idempotency_conflict'
      | 'allergy_acknowledgement_required',
  ) {
    super(message);
    this.name = 'PosServiceError';
  }
}

export function createPosService(db: DbClient) {
  async function cancelOrder(input: {
    orderId: string;
    reason?: string;
  }): Promise<Order> {
    return db.transaction(async (tx) => {
      await lockOrder(tx, input.orderId);

      return createOrderService(tx).cancelOrder(input);
    });
  }

  async function sendToKitchen(
    input: SendToKitchenInput,
  ): Promise<KitchenSendResult> {
    const values = sendToKitchenSchema.parse(input);

    return db.transaction(async (tx) => {
      await lockOrder(tx, values.orderId);

      const existingJob = await tx.query.printJobs.findFirst({
        where: eq(printJobs.idempotencyKey, values.idempotencyKey),
      });

      if (existingJob) {
        assertKitchenReplay(existingJob, values.orderId);

        return {
          order: await createOrderService(tx).getOrderDetail(values.orderId),
          printJob: existingJob,
          replayed: true,
        };
      }

      await assertIdempotencyKeyUnusedByPayment(tx, values.idempotencyKey);

      const currentOrder = await tx.query.orders.findFirst({
        where: eq(orders.id, values.orderId),
      });

      if (!currentOrder) {
        throw new PosServiceError('Order not found.', 'not_found');
      }

      if (currentOrder.hasAllergy && !currentOrder.allergyAcknowledgedAt) {
        if (!values.allergyAcknowledged || !values.allergyAcknowledgedBy) {
          throw new PosServiceError(
            'The allergy warning must be acknowledged before sending to the kitchen.',
            'allergy_acknowledgement_required',
          );
        }

        await tx
          .update(orders)
          .set({
            allergyAcknowledgedAt: new Date(),
            allergyAcknowledgedBy: values.allergyAcknowledgedBy,
          })
          .where(eq(orders.id, values.orderId));
      }

      const pendingItems = await tx.query.orderItems.findMany({
        where: (items, { and, eq }) =>
          and(eq(items.orderId, values.orderId), eq(items.status, 'pending')),
      });
      const unacknowledgedAllergyItems = pendingItems.filter(
        (item) => item.hasAllergy && !item.allergyAcknowledgedAt,
      );

      if (unacknowledgedAllergyItems.length > 0) {
        if (!values.allergyAcknowledged || !values.allergyAcknowledgedBy) {
          throw new PosServiceError(
            'Every pending item allergy must be acknowledged before sending to the kitchen.',
            'allergy_acknowledgement_required',
          );
        }

        await tx
          .update(orderItems)
          .set({
            allergyAcknowledgedAt: new Date(),
            allergyAcknowledgedBy: values.allergyAcknowledgedBy,
          })
          .where(
            inArray(
              orderItems.id,
              unacknowledgedAllergyItems.map((item) => item.id),
            ),
          );
      }
      const orderService = createOrderService(tx);
      const order = await orderService.sendOrderToKitchen(values.orderId);
      const printJob = await createPrintService(tx).createKitchenTicketPrintJob(
        {
          orderId: values.orderId,
          orderItemIds: pendingItems.map((item) => item.id),
          idempotencyKey: values.idempotencyKey,
        },
      );

      return { order, printJob, replayed: false };
    });
  }

  async function payFullOrder(
    input: PayFullOrderWithReceiptInput,
  ): Promise<PaymentCaptureResult> {
    const values = payFullOrderWithReceiptSchema.parse(input);

    return capturePayment(values, (paymentService) =>
      paymentService.payFullOrder(values satisfies PayFullOrderInput),
    );
  }

  async function payCheck(
    input: PayCheckWithReceiptInput,
  ): Promise<PaymentCaptureResult> {
    const values = payCheckWithReceiptSchema.parse(input);

    return capturePayment(values, (paymentService) =>
      paymentService.payCheck(values satisfies PayCheckInput),
    );
  }

  async function createChecksByItems(
    input: CreateChecksByItemsInput,
  ): Promise<Check[]> {
    return db.transaction(async (tx) => {
      await lockOrder(tx, input.orderId);

      return createPaymentService(tx).createChecksByItems(input);
    });
  }

  async function splitOrderEqually(
    input: SplitOrderEquallyInput,
  ): Promise<Check[]> {
    return db.transaction(async (tx) => {
      await lockOrder(tx, input.orderId);

      return createPaymentService(tx).splitOrderEqually(input);
    });
  }

  async function cancelOrderSplit(orderId: string): Promise<Order> {
    return db.transaction(async (tx) => {
      await lockOrder(tx, orderId);

      return createPaymentService(tx).cancelOrderSplit(orderId);
    });
  }

  async function capturePayment(
    values: PayFullOrderWithReceiptInput | PayCheckWithReceiptInput,
    createPayment: (
      paymentService: ReturnType<typeof createPaymentService>,
    ) => Promise<Payment>,
  ): Promise<PaymentCaptureResult> {
    return db.transaction(async (tx) => {
      await lockOrder(tx, values.orderId);

      const existingPayment = await tx.query.payments.findFirst({
        where: eq(payments.idempotencyKey, values.idempotencyKey),
      });

      if (existingPayment) {
        assertPaymentReplay(existingPayment, values);

        return {
          payment: existingPayment,
          printJob:
            (await tx.query.printJobs.findFirst({
              where: eq(printJobs.idempotencyKey, values.idempotencyKey),
            })) ?? null,
          replayed: true,
        };
      }

      await assertIdempotencyKeyUnusedByPrintJob(tx, values.idempotencyKey);

      const payment = await createPayment(createPaymentService(tx));
      const order = await tx.query.orders.findFirst({
        where: eq(orders.id, values.orderId),
      });

      if (!order) {
        throw new PosServiceError('Order not found.', 'not_found');
      }

      const checkId = 'checkId' in values ? values.checkId : undefined;
      const shouldPrint = checkId
        ? (
            await tx.query.checks.findFirst({
              where: (checks, { eq }) => eq(checks.id, checkId),
            })
          )?.status === 'paid'
        : order.status === 'paid';
      const printJob = shouldPrint
        ? await createPrintService(tx).createCustomerReceiptPrintJob({
            orderId: values.orderId,
            checkId,
            paymentId: payment.id,
            idempotencyKey: values.idempotencyKey,
          })
        : null;

      return { payment, printJob, replayed: false };
    });
  }

  return {
    cancelOrder,
    sendToKitchen,
    payFullOrder,
    payCheck,
    createChecksByItems,
    splitOrderEqually,
    cancelOrderSplit,
  };
}

async function lockOrder(db: DbClient, orderId: string): Promise<void> {
  const [order] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.id, orderId))
    .for('update');

  if (!order) {
    throw new PosServiceError('Order not found.', 'not_found');
  }
}

async function assertIdempotencyKeyUnusedByPayment(
  db: DbClient,
  idempotencyKey: string,
): Promise<void> {
  const existingPayment = await db.query.payments.findFirst({
    where: eq(payments.idempotencyKey, idempotencyKey),
  });

  if (existingPayment) {
    throw new PosServiceError(
      'Idempotency key belongs to another command.',
      'idempotency_conflict',
    );
  }
}

async function assertIdempotencyKeyUnusedByPrintJob(
  db: DbClient,
  idempotencyKey: string,
): Promise<void> {
  const existingJob = await db.query.printJobs.findFirst({
    where: eq(printJobs.idempotencyKey, idempotencyKey),
  });

  if (existingJob) {
    throw new PosServiceError(
      'Idempotency key belongs to another command.',
      'idempotency_conflict',
    );
  }
}

function assertKitchenReplay(job: PrintJob, orderId: string): void {
  if (job.jobType !== 'kitchen_ticket' || job.orderId !== orderId) {
    throw new PosServiceError(
      'Idempotency key was reused with different kitchen input.',
      'idempotency_conflict',
    );
  }
}

function assertPaymentReplay(
  payment: Payment,
  values: PayFullOrderWithReceiptInput | PayCheckWithReceiptInput,
): void {
  const checkId = 'checkId' in values ? values.checkId : null;
  const expectedTenderedCents = values.tenderedCents ?? values.amountCents;

  if (
    payment.orderId !== values.orderId ||
    payment.checkId !== checkId ||
    payment.method !== values.method ||
    payment.amountCents !== values.amountCents ||
    payment.tenderedCents !== expectedTenderedCents ||
    payment.tipCents !== (values.tipCents ?? 0)
  ) {
    throw new PosServiceError(
      'Idempotency key was reused with different payment input.',
      'idempotency_conflict',
    );
  }
}
