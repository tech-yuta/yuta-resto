import { and, asc, desc, eq } from 'drizzle-orm';
import type { DbClient } from '@yuta/db/client';
import { printJobs, type Payment, type PrintJob } from '@yuta/db/schema';
import { z } from 'zod';

type PrintJobStatus = 'pending' | 'printing' | 'printed' | 'failed';

type KitchenTicketPayload = {
  orderId: string;
  orderNumber: string;
  tableLabel: string;
  orderType: string;
  createdAt: string;
  items: {
    orderItemId: string;
    name: string;
    quantity: number;
    note: string | null;
    station: string;
  }[];
};

type CustomerReceiptPayload = {
  orderId: string;
  orderNumber: string;
  tableLabel: string;
  orderType: string;
  checkId?: string;
  checkLabel?: string;
  createdAt: string;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  paidCents: number;
  items: {
    name: string;
    quantity: number;
    unitPriceCents: number;
    amountCents: number;
  }[];
  payments: {
    method: string;
    amountCents: number;
    paidAt: string | null;
  }[];
};

const orderIdSchema = z.object({
  orderId: z.string().uuid(),
});

const createCustomerReceiptSchema = z.object({
  orderId: z.string().uuid(),
  checkId: z.string().uuid().optional(),
});

const printJobIdSchema = z.object({
  printJobId: z.string().uuid(),
});

const listPrintJobsSchema = z
  .object({
    status: z.enum(['pending', 'printing', 'printed', 'failed']).optional(),
    limit: z.number().int().positive().max(200).default(50),
  })
  .optional();

const listPendingPrintJobsSchema = z
  .object({
    limit: z.number().int().positive().max(200).default(50),
  })
  .optional();

const failPrintJobSchema = z.object({
  printJobId: z.string().uuid(),
  errorMessage: z.string().trim().min(1).max(2000),
});

export class PrintServiceError extends Error {
  constructor(
    message: string,
    public readonly code: 'not_found' | 'empty_ticket',
  ) {
    super(message);
    this.name = 'PrintServiceError';
  }
}

export function createPrintService(db: DbClient) {
  async function createKitchenTicketPrintJob(orderId: string): Promise<PrintJob> {
    const values = orderIdSchema.parse({ orderId });
    const order = await db.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, values.orderId),
      with: {
        items: true,
      },
    });

    if (!order) {
      throw new PrintServiceError('Order not found.', 'not_found');
    }

    const printableItems = order.items
      .filter((item) => item.status !== 'pending' && item.status !== 'cancelled')
      .sort((left, right) => {
        const stationOrder = left.kitchenStationSnapshot.localeCompare(right.kitchenStationSnapshot);
        return stationOrder === 0 ? left.itemNameSnapshot.localeCompare(right.itemNameSnapshot) : stationOrder;
      });

    if (printableItems.length === 0) {
      throw new PrintServiceError('Kitchen ticket has no printable items.', 'empty_ticket');
    }

    const payload: KitchenTicketPayload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableLabel: order.tableLabel,
      orderType: order.orderType,
      createdAt: new Date().toISOString(),
      items: printableItems.map((item) => ({
        orderItemId: item.id,
        name: item.itemNameSnapshot,
        quantity: item.quantity,
        note: item.note,
        station: item.kitchenStationSnapshot,
      })),
    };

    const [createdJob] = await db
      .insert(printJobs)
      .values({
        source: 'pos',
        printerName: 'mock-kitchen',
        jobType: 'kitchen_ticket',
        status: 'pending',
        payload,
      })
      .returning();

    return createdJob;
  }

  async function createCustomerReceiptPrintJob(input: {
    orderId: string;
    checkId?: string;
  }): Promise<PrintJob> {
    const values = createCustomerReceiptSchema.parse(input);
    const payload = values.checkId
      ? await buildCheckReceiptPayload(values.orderId, values.checkId)
      : await buildOrderReceiptPayload(values.orderId);

    const [createdJob] = await db
      .insert(printJobs)
      .values({
        source: 'pos',
        printerName: 'mock-receipt',
        jobType: 'customer_receipt',
        status: 'pending',
        payload,
      })
      .returning();

    return createdJob;
  }

  async function listPrintJobs(input?: { status?: PrintJobStatus; limit?: number }): Promise<PrintJob[]> {
    const values = listPrintJobsSchema.parse(input);

    if (values?.status) {
      return db.query.printJobs.findMany({
        where: eq(printJobs.status, values.status),
        orderBy: [desc(printJobs.createdAt)],
        limit: values.limit,
      });
    }

    return db.query.printJobs.findMany({
      orderBy: [desc(printJobs.createdAt)],
      limit: values?.limit ?? 50,
    });
  }

  async function listPendingPrintJobs(input?: { limit?: number }): Promise<PrintJob[]> {
    const values = listPendingPrintJobsSchema.parse(input);

    return db.query.printJobs.findMany({
      where: eq(printJobs.status, 'pending'),
      orderBy: [asc(printJobs.createdAt)],
      limit: values?.limit ?? 50,
    });
  }

  async function markPrintJobPrinting(printJobId: string): Promise<PrintJob> {
    const values = printJobIdSchema.parse({ printJobId });
    const [updatedJob] = await db
      .update(printJobs)
      .set({
        status: 'printing',
        errorMessage: null,
      })
      .where(and(eq(printJobs.id, values.printJobId), eq(printJobs.status, 'pending')))
      .returning();

    return requirePrintJob(updatedJob);
  }

  async function getPrintJob(printJobId: string): Promise<PrintJob> {
    const values = printJobIdSchema.parse({ printJobId });
    const job = await db.query.printJobs.findFirst({
      where: eq(printJobs.id, values.printJobId),
    });

    return requirePrintJob(job);
  }

  async function markPrintJobPrinted(printJobId: string): Promise<PrintJob> {
    const values = printJobIdSchema.parse({ printJobId });
    const [updatedJob] = await db
      .update(printJobs)
      .set({
        status: 'printed',
        errorMessage: null,
        printedAt: new Date(),
      })
      .where(eq(printJobs.id, values.printJobId))
      .returning();

    return requirePrintJob(updatedJob);
  }

  async function markPrintJobFailed(input: { printJobId: string; errorMessage: string }): Promise<PrintJob> {
    const values = failPrintJobSchema.parse(input);
    const [updatedJob] = await db
      .update(printJobs)
      .set({
        status: 'failed',
        errorMessage: values.errorMessage,
      })
      .where(eq(printJobs.id, values.printJobId))
      .returning();

    return requirePrintJob(updatedJob);
  }

  async function retryPrintJob(printJobId: string): Promise<PrintJob> {
    const values = printJobIdSchema.parse({ printJobId });
    const [updatedJob] = await db
      .update(printJobs)
      .set({
        status: 'pending',
        errorMessage: null,
        printedAt: null,
      })
      .where(eq(printJobs.id, values.printJobId))
      .returning();

    return requirePrintJob(updatedJob);
  }

  return {
    createKitchenTicketPrintJob,
    createCustomerReceiptPrintJob,
    listPrintJobs,
    listPendingPrintJobs,
    getPrintJob,
    markPrintJobPrinting,
    markPrintJobPrinted,
    markPrintJobFailed,
    retryPrintJob,
  };

  async function buildOrderReceiptPayload(orderId: string): Promise<CustomerReceiptPayload> {
    const order = await db.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, orderId),
      with: {
        items: true,
        payments: true,
      },
    });

    if (!order) {
      throw new PrintServiceError('Order not found.', 'not_found');
    }

    const activeItems = order.items.filter((item) => item.status !== 'cancelled');
    const paidPayments = order.payments.filter((payment) => payment.status === 'paid');

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableLabel: order.tableLabel,
      orderType: order.orderType,
      createdAt: new Date().toISOString(),
      subtotalCents: order.subtotalCents,
      discountCents: order.discountCents,
      totalCents: order.totalCents,
      paidCents: sumPayments(paidPayments),
      items: activeItems.map((item) => ({
        name: item.itemNameSnapshot,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCentsSnapshot,
        amountCents: item.unitPriceCentsSnapshot * item.quantity,
      })),
      payments: paidPayments.map(formatPayment),
    };
  }

  async function buildCheckReceiptPayload(
    orderId: string,
    checkId: string,
  ): Promise<CustomerReceiptPayload> {
    const [order, check] = await Promise.all([
      db.query.orders.findFirst({
        where: (orders, { eq }) => eq(orders.id, orderId),
      }),
      db.query.checks.findFirst({
        where: (checks, { eq }) => eq(checks.id, checkId),
        with: {
          items: {
            with: {
              orderItem: true,
            },
          },
          payments: true,
        },
      }),
    ]);

    if (!order || !check || check.orderId !== order.id) {
      throw new PrintServiceError('Check not found.', 'not_found');
    }

    const paidPayments = check.payments.filter((payment) => payment.status === 'paid');

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableLabel: order.tableLabel,
      orderType: order.orderType,
      checkId: check.id,
      checkLabel: check.checkLabel,
      createdAt: new Date().toISOString(),
      subtotalCents: check.subtotalCents,
      discountCents: check.discountCents,
      totalCents: check.totalCents,
      paidCents: sumPayments(paidPayments),
      items: check.items.map((item) => ({
        name: item.orderItem.itemNameSnapshot,
        quantity: item.quantity,
        unitPriceCents: item.orderItem.unitPriceCentsSnapshot,
        amountCents: item.amountCentsSnapshot,
      })),
      payments: paidPayments.map(formatPayment),
    };
  }
}

function requirePrintJob(job: PrintJob | undefined): PrintJob {
  if (!job) {
    throw new PrintServiceError('Print job not found.', 'not_found');
  }

  return job;
}

function sumPayments(payments: Payment[]): number {
  return payments.reduce((total, payment) => total + payment.amountCents, 0);
}

function formatPayment(payment: Payment): CustomerReceiptPayload['payments'][number] {
  return {
    method: payment.method,
    amountCents: payment.amountCents,
    paidAt: payment.paidAt?.toISOString() ?? null,
  };
}
