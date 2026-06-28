import { asc, desc, eq } from 'drizzle-orm';
import type { DbClient } from '@yuta/db/client';
import { printJobs, type PrintJob } from '@yuta/db/schema';
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

const orderIdSchema = z.object({
  orderId: z.string().uuid(),
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

  async function listPendingPrintJobs(): Promise<PrintJob[]> {
    return db.query.printJobs.findMany({
      where: eq(printJobs.status, 'pending'),
      orderBy: [asc(printJobs.createdAt)],
      limit: 50,
    });
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
    listPrintJobs,
    listPendingPrintJobs,
    markPrintJobPrinted,
    markPrintJobFailed,
    retryPrintJob,
  };
}

function requirePrintJob(job: PrintJob | undefined): PrintJob {
  if (!job) {
    throw new PrintServiceError('Print job not found.', 'not_found');
  }

  return job;
}
