import { calculateComboDiscounts, type ComboCalculationRule } from '@yuta/core';

export type ItemSplitComboItem = {
  id: string;
  menuItemId: string;
  unitPriceCents: number;
  quantity: number;
  createdAt: string;
};

export function calculateItemSplitDiscountCents(
  items: ItemSplitComboItem[],
  rules: ComboCalculationRule[],
): number {
  return calculateComboDiscounts(
    items.map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      unitPriceCentsSnapshot: item.unitPriceCents,
      quantity: item.quantity,
      createdAt: new Date(item.createdAt),
    })),
    rules,
  ).reduce((total, discount) => total + discount.discountCents, 0);
}
