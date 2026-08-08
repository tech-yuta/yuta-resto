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
          categoryName: z.string().min(1).default('Autres'),
        })
        .passthrough(),
    ),
    ticketDestination: z.enum(['kitchen', 'counter']).optional(),
    copies: z.number().int().min(1).max(3).default(1),
    fontSizePreset: z
      .enum(['compact', 'standard', 'large'])
      .default('standard'),
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
  const destinations = payload.ticketDestination
    ? [payload.ticketDestination]
    : (['kitchen', 'counter'] as const);
  const tickets = destinations.flatMap((destination) => {
    const items = payload.items.filter((item) =>
      destination === 'kitchen'
        ? item.station === 'kitchen'
        : item.station === 'bar' || item.station === 'dessert',
    );
    if (items.length === 0) return [];
    return Array.from({ length: payload.copies }, () =>
      renderProductionTicket(payload, destination, items),
    );
  });
  return tickets.length > 0 ? Buffer.concat(tickets) : null;
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

function renderProductionTicket(
  payload: z.infer<typeof kitchenPrintPayloadSchema>,
  destination: 'kitchen' | 'counter',
  items: z.infer<typeof kitchenPrintPayloadSchema>['items'],
): Buffer {
  const chunks: Buffer[] = [];
  const write = (value: string) => {
    chunks.push(Buffer.from(ascii(`${value}\r\n`), 'ascii'));
  };
  const command = (...bytes: number[]) => chunks.push(Buffer.from(bytes));
  const setAlign = (value: 0 | 1) => command(0x1b, 0x61, value);
  const setBold = (enabled: boolean) => command(0x1b, 0x45, enabled ? 1 : 0);
  const setReverse = (enabled: boolean) => command(0x1d, 0x42, enabled ? 1 : 0);
  const setSize = (value: number) => command(0x1d, 0x21, value);
  const itemSize = payload.fontSizePreset === 'large' ? 0x11 : 0x00;
  const itemWidth = payload.fontSizePreset === 'large' ? 21 : 42;

  command(0x1b, 0x40);
  setAlign(1);
  setBold(true);
  setSize(0x11);
  if (destination === 'kitchen') {
    write('CUISINE');
  } else {
    write('BOISSONS');
    write('& DESSERTS');
  }
  setSize(0x00);
  setBold(false);
  write(separator());

  setAlign(0);
  setBold(true);
  if (payload.tableLabel) write(`TABLE       ${payload.tableLabel}`);
  write(orderType(payload.orderType));
  write(formatDateTime(payload.createdAt));
  write(`${items.reduce((sum, item) => sum + item.quantity, 0)} ARTICLES`);
  if (payload.orderNote) write(`NOTE: ${payload.orderNote}`);
  setBold(false);
  write(separator());

  const groupedItems = new Map<string, typeof items>();
  for (const item of items) {
    const group = groupedItems.get(item.categoryName) ?? [];
    group.push(item);
    groupedItems.set(item.categoryName, group);
  }
  for (const [categoryName, categoryItems] of groupedItems) {
    setAlign(1);
    setBold(true);
    setReverse(true);
    write(centerText(categoryName.toUpperCase(), 42));
    setReverse(false);
    setBold(false);
    write(separator());
    setAlign(0);
    for (const item of categoryItems) {
      setSize(itemSize);
      setBold(payload.fontSizePreset !== 'compact');
      for (const line of wrapText(
        `${item.quantity > 1 ? `${item.quantity} x ` : ''}${item.name}`,
        itemWidth,
      )) {
        write(line);
      }
      setSize(0x00);
      setBold(false);
      for (const instruction of item.quickInstructions) {
        write(`  > ${instruction.labelSnapshot}`);
      }
      for (const variant of item.selectedVariants) {
        write(
          `  > ${variant.labelSnapshot}${variant.quantity > 1 ? ` x${variant.quantity}` : ''}`,
        );
      }
      if (item.note) write(`  > NOTE: ${item.note}`);
      if (item.hasAllergy) {
        const allergy = [
          item.allergySeverity === 'severe' ? 'GRAVE' : 'LEGERE',
          ...item.allergenCodes,
          item.allergyNote,
        ].filter((value): value is string => Boolean(value));
        setBold(true);
        setReverse(true);
        write(`!!! ALLERGIE: ${allergy.join(', ')}`);
        setReverse(false);
        setBold(false);
      }
      write('');
    }
  }
  write(separator());
  write('');
  write('');
  write('');
  command(0x1d, 0x56, 0x00);
  return Buffer.concat(chunks);
}

function orderType(value: 'dine_in' | 'takeaway' | 'delivery'): string {
  if (value === 'takeaway') return 'A EMPORTER';
  if (value === 'delivery') return 'LIVRAISON';
  return 'SUR PLACE';
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  const time = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  const day = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
  return `${time} - ${day}`;
}

function separator(): string {
  return '-'.repeat(42);
}

function centerText(value: string, width: number): string {
  const text = ascii(value).slice(0, width - 2);
  const left = Math.max(1, Math.floor((width - text.length) / 2));
  return `${' '.repeat(left)}${text}`.padEnd(width, ' ');
}

function wrapText(value: string, width: number): string[] {
  const words = ascii(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if (word.length > width) {
      if (line) lines.push(line);
      for (let index = 0; index < word.length; index += width) {
        lines.push(word.slice(index, index + width));
      }
      line = '';
      continue;
    }
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.length > 0 ? lines : [''];
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
