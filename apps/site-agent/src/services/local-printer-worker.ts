import type { PosDatabaseExecutor } from '@yuta/db-pos/client';
import { printJobs, type PrintJob } from '@yuta/db-pos/schema';
import { and, asc, eq } from 'drizzle-orm';
import { spawn } from 'node:child_process';
import { z } from 'zod';

const kitchenPrintPayloadSchema = z
  .object({
    orderNumber: z.string().min(1),
    tableLabel: z.string().nullable(),
    orderType: z.enum(['dine_in', 'takeaway', 'delivery']),
    orderNote: z.string().nullable(),
    createdAt: z.string().datetime(),
    items: z.array(
      z
        .object({
          name: z.string().min(1),
          quantity: z.number().int().positive(),
          note: z.string().nullable(),
          quickInstructions: z.array(
            z.object({ labelSnapshot: z.string().min(1) }).passthrough(),
          ),
          selectedVariants: z.array(
            z
              .object({
                labelSnapshot: z.string().min(1),
                quantity: z.number().int().positive(),
              })
              .passthrough(),
          ),
          hasAllergy: z.boolean(),
          allergenCodes: z.array(z.string()),
          allergySeverity: z.enum(['mild', 'severe']).nullable(),
          allergyNote: z.string().nullable(),
          station: z.enum(['kitchen', 'bar', 'dessert', 'none']),
        })
        .passthrough(),
    ),
  })
  .passthrough();

type PrinterWriter = (devicePath: string, data: Buffer) => Promise<void>;

export function createLocalPrinterWorker(input: {
  db: PosDatabaseExecutor;
  devicePath: string;
  pollIntervalMs: number;
  write?: PrinterWriter;
}) {
  const write = input.write ?? writePrinterDevice;
  let timer: NodeJS.Timeout | null = null;
  let activeRun: Promise<void> | null = null;
  let stopped = true;

  async function processNext(): Promise<boolean> {
    const candidate = await input.db.query.printJobs.findFirst({
      where: and(
        eq(printJobs.status, 'pending'),
        eq(printJobs.jobType, 'kitchen_ticket'),
      ),
      orderBy: [asc(printJobs.createdAt), asc(printJobs.id)],
    });
    if (!candidate) return false;

    const [claimed] = await input.db
      .update(printJobs)
      .set({ status: 'printing', errorMessage: null })
      .where(
        and(eq(printJobs.id, candidate.id), eq(printJobs.status, 'pending')),
      )
      .returning();
    if (!claimed) return false;

    try {
      const output = renderInternalKitchenTicket(claimed);
      if (output) await write(input.devicePath, output);
      await input.db
        .update(printJobs)
        .set({
          status: 'printed',
          printedAt: new Date(),
          errorMessage: null,
        })
        .where(
          and(eq(printJobs.id, claimed.id), eq(printJobs.status, 'printing')),
        );
    } catch (error: unknown) {
      await input.db
        .update(printJobs)
        .set({ status: 'failed', errorMessage: printErrorMessage(error) })
        .where(
          and(eq(printJobs.id, claimed.id), eq(printJobs.status, 'printing')),
        );
    }
    return true;
  }

  async function tick(): Promise<void> {
    if (stopped || activeRun) return;
    activeRun = processNext()
      .then((processed) => {
        if (processed && !stopped) queueMicrotask(() => void tick());
      })
      .catch((error: unknown) => {
        console.error('Local print worker polling failed.', error);
      })
      .finally(() => {
        activeRun = null;
      });
    await activeRun;
  }

  async function start(): Promise<void> {
    if (!stopped) return;
    stopped = false;
    try {
      await input.db
        .update(printJobs)
        .set({
          status: 'failed',
          errorMessage:
            'Print worker restarted before completion. Retry the job.',
        })
        .where(
          and(
            eq(printJobs.status, 'printing'),
            eq(printJobs.jobType, 'kitchen_ticket'),
          ),
        );
    } catch (error: unknown) {
      console.error('Local print worker recovery failed.', error);
    }
    timer = setInterval(() => void tick(), input.pollIntervalMs);
    await tick();
  }

  async function stop(): Promise<void> {
    stopped = true;
    if (timer) clearInterval(timer);
    timer = null;
    await activeRun;
  }

  return { processNext, start, stop };
}

export function renderInternalKitchenTicket(job: PrintJob): Buffer | null {
  const payload = kitchenPrintPayloadSchema.parse(job.payload);
  const kitchenItems = payload.items.filter(
    (item) => item.station === 'kitchen',
  );
  const counterItems = payload.items.filter(
    (item) => item.station === 'bar' || item.station === 'dessert',
  );
  if (kitchenItems.length === 0 && counterItems.length === 0) {
    return null;
  }

  const lines = [
    'YUTA - TICKET INTERNE',
    `COMMANDE ${payload.orderNumber}`,
    ...(payload.tableLabel ? [`TABLE ${payload.tableLabel}`] : []),
    orderType(payload.orderType),
    formatDateTime(payload.createdAt),
    separator(),
  ];
  if (payload.orderNote) lines.push(`NOTE: ${payload.orderNote}`, separator());
  appendSection(lines, 'CUISINE', kitchenItems);
  appendSection(lines, 'CAISSE - BOISSONS / DESSERTS', counterItems);
  lines.push('', '', '');

  const body = ascii(lines.join('\r\n'));
  return Buffer.concat([
    Buffer.from([0x1b, 0x40]),
    Buffer.from(body, 'ascii'),
    Buffer.from([0x1d, 0x56, 0x00]),
  ]);
}

async function writePrinterDevice(
  devicePath: string,
  data: Buffer,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const writer = spawn(
      'timeout',
      ['--kill-after=2s', '10s', 'tee', devicePath],
      {
        stdio: ['pipe', 'ignore', 'pipe'],
      },
    );
    let stderr = '';
    writer.stderr.setEncoding('utf8');
    writer.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });
    writer.once('error', reject);
    writer.stdin.once('error', reject);
    writer.once('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          code === 124
            ? 'Printer write timed out after 10 seconds.'
            : `Printer writer exited with code ${code ?? 'unknown'}${stderr ? `: ${stderr.trim()}` : '.'}`,
        ),
      );
    });
    writer.stdin.end(data);
  });
}

function appendSection(
  lines: string[],
  title: string,
  items: z.infer<typeof kitchenPrintPayloadSchema>['items'],
): void {
  if (items.length === 0) return;
  lines.push(`=== ${title} ===`);
  for (const item of items) {
    lines.push(`${item.quantity} x ${item.name}`);
    for (const instruction of item.quickInstructions) {
      lines.push(`  - ${instruction.labelSnapshot}`);
    }
    for (const variant of item.selectedVariants) {
      lines.push(`  - ${variant.quantity} x ${variant.labelSnapshot}`);
    }
    if (item.note) lines.push(`  NOTE: ${item.note}`);
    if (item.hasAllergy) {
      const allergy = [
        item.allergySeverity === 'severe' ? 'GRAVE' : 'LEGERE',
        ...item.allergenCodes,
        item.allergyNote,
      ].filter((value): value is string => Boolean(value));
      lines.push(`  !!! ALLERGIE: ${allergy.join(', ')}`);
    }
  }
  lines.push(separator());
}

function orderType(value: 'dine_in' | 'takeaway' | 'delivery'): string {
  if (value === 'takeaway') return 'A EMPORTER';
  if (value === 'delivery') return 'LIVRAISON';
  return 'SUR PLACE';
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
    hour12: false,
  }).format(new Date(value));
}

function separator(): string {
  return '-'.repeat(42);
}

function ascii(value: string): string {
  return value
    .replaceAll('œ', 'oe')
    .replaceAll('Œ', 'OE')
    .replaceAll('đ', 'd')
    .replaceAll('Đ', 'D')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\x0A\x0D\x20-\x7E]/g, '?');
}

function printErrorMessage(error: unknown): string {
  const detail =
    error instanceof Error ? error.message : 'Unknown printer error.';
  return `Physical printer failed: ${detail}`.slice(0, 2_000);
}
