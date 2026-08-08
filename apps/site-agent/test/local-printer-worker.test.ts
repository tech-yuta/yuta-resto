import type { PrintJob } from '@yuta/db-pos/schema';
import { describe, expect, it } from 'vitest';
import { renderInternalKitchenTicket } from '../src/services/local-printer-worker';

const baseJob: PrintJob = {
  id: '019fa0b8-e6e2-7353-b6e8-c9a5698eb8e5',
  orderId: '019fa0b8-e6e2-7353-b6e8-c9a5698eb8e6',
  checkId: null,
  paymentId: null,
  source: 'pos',
  printerName: 'tm-m30-internal',
  jobType: 'kitchen_ticket',
  status: 'printing',
  payload: {
    orderId: '019fa0b8-e6e2-7353-b6e8-c9a5698eb8e6',
    orderNumber: '1042',
    tableLabel: 'Table 8',
    orderType: 'dine_in',
    orderNote: 'Service rapide',
    createdAt: '2026-08-08T17:35:00.000Z',
    items: [
      {
        name: 'Phở spécial',
        quantity: 2,
        note: 'Không hành',
        quickInstructions: [
          { code: 'SANS_OIGNON', labelSnapshot: 'Sans oignon' },
        ],
        selectedVariants: [],
        hasAllergy: true,
        allergenCodes: ['arachides'],
        allergySeverity: 'severe',
        allergyNote: null,
        station: 'kitchen',
        categoryName: 'Nos entrées',
      },
      {
        name: 'Mochi glacé',
        quantity: 1,
        note: null,
        quickInstructions: [],
        selectedVariants: [{ labelSnapshot: 'Mangue', quantity: 2 }],
        hasAllergy: false,
        allergenCodes: [],
        allergySeverity: null,
        allergyNote: null,
        station: 'dessert',
        categoryName: 'Nos desserts',
      },
      {
        name: 'Sac papier',
        quantity: 1,
        note: null,
        quickInstructions: [],
        selectedVariants: [],
        hasAllergy: false,
        allergenCodes: [],
        allergySeverity: null,
        allergyNote: null,
        station: 'none',
        categoryName: 'Suppléments',
      },
    ],
  },
  errorMessage: null,
  idempotencyKey: '019fa0b8-e6e2-7353-b6e8-c9a5698eb8e7',
  createdAt: new Date('2026-08-08T17:35:00.000Z'),
  printedAt: null,
};

describe('local TM-m30 print rendering', () => {
  it('renders a large kitchen ticket grouped by category', () => {
    const output = renderInternalKitchenTicket({
      ...baseJob,
      payload: {
        ...baseJob.payload,
        ticketDestination: 'kitchen',
        copies: 1,
        fontSizePreset: 'large',
      },
    });
    expect(output).not.toBeNull();
    if (!output) throw new Error('Expected a physical ticket.');
    const text = output.toString('ascii');

    expect([...output.subarray(0, 2)]).toEqual([0x1b, 0x40]);
    expect([...output.subarray(-3)]).toEqual([0x1d, 0x56, 0x00]);
    expect(text).toContain('CUISINE');
    expect(text).toContain('NOS ENTREES');
    expect(text).toContain('2 x Pho special');
    expect(text).toContain('!!! ALLERGIE: GRAVE, arachides');
    expect(text).not.toContain('BOISSONS');
    expect(text).not.toContain('Mochi glace');
    expect(text).not.toContain('Sac papier');
    expect(text).not.toContain('€');
  });

  it('renders and cuts the configured number of counter copies', () => {
    const output = renderInternalKitchenTicket({
      ...baseJob,
      payload: {
        ...baseJob.payload,
        ticketDestination: 'counter',
        copies: 2,
        fontSizePreset: 'standard',
      },
    });
    expect(output).not.toBeNull();
    if (!output) throw new Error('Expected counter tickets.');
    const text = output.toString('ascii');
    expect(text.match(/BOISSONS/g)).toHaveLength(2);
    expect(text.match(/Mochi glace/g)).toHaveLength(2);
    expect(countSequence(output, [0x1d, 0x56, 0x00])).toBe(2);
    expect(text).not.toContain('Pho special');
  });

  it('keeps legacy combined jobs printable as two cut tickets', () => {
    const output = renderInternalKitchenTicket(baseJob);
    expect(output).not.toBeNull();
    if (!output) throw new Error('Expected legacy tickets.');
    expect(countSequence(output, [0x1d, 0x56, 0x00])).toBe(2);
  });

  it('skips a physical ticket without internal production items', () => {
    expect(
      renderInternalKitchenTicket({
        ...baseJob,
        payload: {
          ...baseJob.payload,
          items: [
            {
              name: 'Sac papier',
              quantity: 1,
              note: null,
              quickInstructions: [],
              selectedVariants: [],
              hasAllergy: false,
              allergenCodes: [],
              allergySeverity: null,
              allergyNote: null,
              station: 'none',
              categoryName: 'Suppléments',
            },
          ],
        },
      }),
    ).toBeNull();
  });
});

function countSequence(buffer: Buffer, sequence: number[]): number {
  let count = 0;
  for (let index = 0; index <= buffer.length - sequence.length; index += 1) {
    if (sequence.every((value, offset) => buffer[index + offset] === value)) {
      count += 1;
    }
  }
  return count;
}
