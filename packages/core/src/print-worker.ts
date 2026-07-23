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
  const pendingJobs = await printService.listPendingPrintJobs({
    limit: values.batchSize,
  });
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
        errorMessage:
          error instanceof Error
            ? error.message
            : 'Unknown print worker error.',
      });
      result.failed += 1;
    }
  }

  return result;
}

async function mockPrint(
  job: PrintJob,
  options: { outputDir?: string; failRate: number },
): Promise<void> {
  if (Math.random() < options.failRate) {
    throw new Error('Mock printer failure.');
  }

  if (!options.outputDir) {
    return;
  }

  await mkdir(options.outputDir, { recursive: true });
  await writeFile(
    path.join(options.outputDir, `${job.id}.txt`),
    renderPrintJob(job),
    'utf8',
  );
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
    allergyLine(record.hasAllergy, record.allergyNote),
    valueLine('Order note', record.orderNote),
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

  return [...header, '', ...itemLines, '', ...totalLines, '', ...paymentLines]
    .join('\n')
    .trim();
}

function allergyLine(hasAllergy: unknown, allergyNote: unknown): string {
  if (hasAllergy !== true) {
    return '';
  }

  const details =
    typeof allergyNote === 'string' && allergyNote.length > 0
      ? `: ${allergyNote}`
      : '';

  return `!!! ALLERGY${details} !!!`;
}

function valueLine(label: string, value: unknown): string {
  return typeof value === 'string' && value.length > 0
    ? `${label}: ${value}`
    : '';
}

function renderPayloadItem(item: unknown): string {
  if (!item || typeof item !== 'object') {
    return `- ${String(item)}`;
  }

  const record = item as Record<string, unknown>;
  const quantity = typeof record.quantity === 'number' ? record.quantity : 1;
  const name = typeof record.name === 'string' ? record.name : 'Item';
  const station =
    typeof record.station === 'string' ? ` [${record.station}]` : '';
  const note =
    typeof record.note === 'string' && record.note.length > 0
      ? `NOTE: ${record.note}`
      : '';
  const allergy = structuredItemAllergyLine(record);
  const instructions = Array.isArray(record.quickInstructions)
    ? record.quickInstructions
        .map((instruction) => {
          if (!instruction || typeof instruction !== 'object') return '';
          const label = (instruction as Record<string, unknown>).labelSnapshot;
          return typeof label === 'string' ? `  > ${label.toUpperCase()}` : '';
        })
        .filter(Boolean)
    : [];
  const variants = Array.isArray(record.selectedVariants)
    ? record.selectedVariants
        .map((variant) => {
          if (!variant || typeof variant !== 'object') return '';
          const variantRecord = variant as Record<string, unknown>;
          return typeof variantRecord.labelSnapshot === 'string' &&
            typeof variantRecord.quantity === 'number'
            ? `${variantRecord.quantity}x ${variantRecord.labelSnapshot}`
            : '';
        })
        .filter(Boolean)
        .join(' · ')
    : '';

  return [
    `- ${quantity}x ${name}${station}`,
    allergy,
    variants ? `  PARFUMS: ${variants}` : '',
    ...instructions,
    note,
  ]
    .filter(Boolean)
    .join('\n');
}

function structuredItemAllergyLine(record: Record<string, unknown>): string {
  if (record.hasAllergy !== true) return '';
  const severityLabels: Record<string, string> = {
    intolerance: 'INTOLERANCE',
    allergy: 'ALLERGIE',
    severe_no_traces: 'ALLERGIE SEVERE - TRACES INTERDITES',
  };
  const allergenLabels: Record<string, string> = {
    PEANUTS: 'CACAHUETES',
    GLUTEN: 'GLUTEN',
    SOY: 'SOJA',
    CRUSTACEANS: 'CRUSTACES',
    EGGS: 'OEUFS',
    MILK: 'LAIT',
    SESAME: 'SESAME',
    FISH: 'POISSON',
    OTHER: 'AUTRE',
  };
  const severity =
    typeof record.allergySeverity === 'string'
      ? (severityLabels[record.allergySeverity] ?? 'ALLERGIE')
      : 'ALLERGIE';
  const allergens = Array.isArray(record.allergenCodes)
    ? record.allergenCodes
        .filter((code): code is string => typeof code === 'string')
        .map((code) => allergenLabels[code] ?? code)
        .join(', ')
    : '';
  const detail =
    typeof record.allergyNote === 'string' && record.allergyNote.length > 0
      ? ` - ${record.allergyNote.toUpperCase()}`
      : '';
  return `!!! ${severity}${allergens ? `: ${allergens}` : ''}${detail} !!!`;
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
  const amount =
    typeof record.amountCents === 'number'
      ? formatCents(record.amountCents)
      : '';

  return `Payment: ${method} ${amount}`.trim();
}

function formatCents(cents: number): string {
  return `${(cents / 100).toFixed(2)} EUR`;
}
