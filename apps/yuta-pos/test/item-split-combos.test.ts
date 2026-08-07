import type { ComboCalculationRule } from '@yuta/core';
import { describe, expect, it } from 'vitest';
import { calculateItemSplitDiscountCents } from '../src/app/orders/[orderId]/payment/item-split-combos';

const comboRule: ComboCalculationRule = {
  id: 'rule-a',
  name: 'Formule déjeuner',
  pricingMode: 'fixed',
  comboPriceCents: 1400,
  priceDeltaCents: 0,
  basePricingGroupName: null,
  priority: 10,
  maxApplications: null,
  isActive: true,
  groups: [
    {
      id: 'main',
      name: 'Plat',
      minQuantity: 1,
      maxQuantity: 1,
      sortOrder: 10,
      items: [{ menuItemId: 'pho', extraPriceCents: 100 }],
    },
    {
      id: 'drink',
      name: 'Boisson',
      minQuantity: 1,
      maxQuantity: 1,
      sortOrder: 20,
      items: [{ menuItemId: 'coca', extraPriceCents: 0 }],
    },
  ],
};

describe('item split combo adapter', () => {
  it('uses the shared calculator for only the quantities assigned to a check', () => {
    const discountCents = calculateItemSplitDiscountCents(
      [
        {
          id: 'line-pho',
          menuItemId: 'pho',
          unitPriceCents: 1400,
          quantity: 1,
          createdAt: '2026-08-07T12:00:00.000Z',
        },
        {
          id: 'line-coca',
          menuItemId: 'coca',
          unitPriceCents: 300,
          quantity: 1,
          createdAt: '2026-08-07T12:01:00.000Z',
        },
      ],
      [comboRule],
    );

    expect(discountCents).toBe(200);
  });

  it('does not discount an incomplete combo selection', () => {
    const discountCents = calculateItemSplitDiscountCents(
      [
        {
          id: 'line-pho',
          menuItemId: 'pho',
          unitPriceCents: 1400,
          quantity: 1,
          createdAt: '2026-08-07T12:00:00.000Z',
        },
      ],
      [comboRule],
    );

    expect(discountCents).toBe(0);
  });
});
