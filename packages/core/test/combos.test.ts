import { describe, expect, it } from 'vitest';
import {
  calculateComboDiscounts,
  type ComboCalculationRule,
} from '../src/combos';

const date = new Date('2026-07-27T12:00:00.000Z');
const fixedRule: ComboCalculationRule = {
  id: 'rule-a',
  name: 'Combo A',
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

describe('shared combo calculator', () => {
  it('matches repeated quantities without reusing units', () => {
    const discounts = calculateComboDiscounts(
      [
        {
          id: 'line-pho',
          menuItemId: 'pho',
          unitPriceCentsSnapshot: 1400,
          quantity: 2,
          createdAt: date,
        },
        {
          id: 'line-coca',
          menuItemId: 'coca',
          unitPriceCentsSnapshot: 300,
          quantity: 2,
          createdAt: date,
        },
      ],
      [fixedRule],
    );

    expect(discounts).toHaveLength(2);
    expect(discounts.map((discount) => discount.discountCents)).toEqual([
      200, 200,
    ]);
  });

  it('supports base-item-plus-delta pricing', () => {
    const discounts = calculateComboDiscounts(
      [
        {
          id: 'line-pho',
          menuItemId: 'pho',
          unitPriceCentsSnapshot: 1400,
          quantity: 1,
          createdAt: date,
        },
        {
          id: 'line-coca',
          menuItemId: 'coca',
          unitPriceCentsSnapshot: 300,
          quantity: 1,
          createdAt: date,
        },
      ],
      [
        {
          ...fixedRule,
          pricingMode: 'base_item_plus_delta',
          priceDeltaCents: 200,
          basePricingGroupName: 'Plat',
          groups: fixedRule.groups.map((group) => ({
            ...group,
            items: group.items.map((item) => ({
              ...item,
              extraPriceCents: 0,
            })),
          })),
        },
      ],
    );

    expect(discounts[0]?.discountCents).toBe(100);
  });
});
