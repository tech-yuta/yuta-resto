import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { DbClient } from '@yuta/db/client';
import type { PrintJob } from '@yuta/db/schema';
import { z } from 'zod';
import { createPrintService, PrintServiceError } from './prints';

const processPrintJobsSchema = z.object({
  batchSize: z.number().int().positive().max(50).default(10),
  outputDir: z.string().trim().min(1).optional(),
  failRate: z.number().min(0).max(1).default(0),
});

export type ProcessPrintJobsInput = z.input<typeof processPrintJobsSchema>;

export type ProcessPrintJobsResult = {
  scanned: number;
  printed: number;
  failed: number;
  skipped: number;
};

export async function processPendingPrintJobs(
  db: DbClient,
  input: ProcessPrintJobsInput = {},
): Promise<ProcessPrintJobsResult> {
  const values = processPrintJobsSchema.parse(input);
  const printService = createPrintService(db);
  const pendingJobs = await printService.listPendingPrintJobs({ limit: values.batchSize });
  const result: ProcessPrintJobsResult = {
    scanned: pendingJobs.length,
    printed: 0,
    failed: 0,
    skipped: 0,
  };

  for (const pendingJob of pendingJobs) {
    try {
      const claimedJob = await printService.markPrintJobPrinting(pendingJob.id);
      await mockPrint(claimedJob, values);
      await printService.markPrintJobPrinted(claimedJob.id);
      result.printed += 1;
    } catch (error) {
      if (error instanceof PrintServiceError && error.code === 'not_found') {
        result.skipped += 1;
        continue;
      }

      await printService.markPrintJobFailed({
        printJobId: pendingJob.id,
        errorMessage: error instanceof Error ? error.message : 'Unknown print worker error.',
      });
      result.failed += 1;
    }
  }

  return result;
}

async function mockPrint(job: PrintJob, options: { outputDir?: string; failRate: number }): Promise<void> {
  if (Math.random() < options.failRate) {
    throw new Error('Mock printer failure.');
  }

  if (!options.outputDir) {
    return;
  }

  await mkdir(options.outputDir, { recursive: true });
  await writeFile(path.join(options.outputDir, `${job.id}.txt`), renderPrintJob(job), 'utf8');
}

function renderPrintJob(job: PrintJob): string {
  const lines = [
    'YuTa mock print job',
    `Job: ${job.id}`,
    `Printer: ${job.printerName}`,
    `Type: ${job.jobType}`,
    `Created: ${job.createdAt.toISOString()}`,
    '',
    renderPayload(job.payload),
    '',
  ];

  return lines.join('\n');
}

function renderPayload(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return JSON.stringify(payload, null, 2);
  }

  const record = payload as Record<string, unknown>;
  const items = Array.isArray(record.items) ? record.items : [];
  const header = [
    valueLine('Order', record.orderNumber),
    valueLine('Table', record.tableLabel),
    valueLine('Check', record.checkLabel),
    valueLine('Type', record.orderType),
  ].filter(Boolean);
  const itemLines = items.map((item) => renderPayloadItem(item));
  const totalLines = [
    centsLine('Subtotal', record.subtotalCents),
    centsLine('Discount', record.discountCents),
    centsLine('Total', record.totalCents),
    centsLine('Paid', record.paidCents),
  ].filter(Boolean);
  const payments = Array.isArray(record.payments) ? record.payments : [];
  const paymentLines = payments.map((payment) => renderPayloadPayment(payment));

  return [...header, '', ...itemLines, '', ...totalLines, '', ...paymentLines].join('\n').trim();
}

function valueLine(label: string, value: unknown): string {
  return typeof value === 'string' && value.length > 0 ? `${label}: ${value}` : '';
}

function renderPayloadItem(item: unknown): string {
  if (!item || typeof item !== 'object') {
    return `- ${String(item)}`;
  }

  const record = item as Record<string, unknown>;
  const quantity = typeof record.quantity === 'number' ? record.quantity : 1;
  const name = typeof record.name === 'string' ? record.name : 'Item';
  const station = typeof record.station === 'string' ? ` [${record.station}]` : '';
  const note = typeof record.note === 'string' && record.note.length > 0 ? ` - ${record.note}` : '';

  return `- ${quantity}x ${name}${station}${note}`;
}

function centsLine(label: string, value: unknown): string {
  return typeof value === 'number' ? `${label}: ${formatCents(value)}` : '';
}

function renderPayloadPayment(payment: unknown): string {
  if (!payment || typeof payment !== 'object') {
    return `Payment: ${String(payment)}`;
  }

  const record = payment as Record<string, unknown>;
  const method = typeof record.method === 'string' ? record.method : 'unknown';
  const amount = typeof record.amountCents === 'number' ? formatCents(record.amountCents) : '';

  return `Payment: ${method} ${amount}`.trim();
}

function formatCents(cents: number): string {
  return `${(cents / 100).toFixed(2)} EUR`;
}
