import { describe, expect, it } from 'vitest';
import {
  areAllStockMovementsChecked,
  filterStockMovements,
  formatStockCurrency,
  formatStockQuantity,
  getSelectedStockMovement,
  toggleStockMovementSelection,
  type StockMovement,
} from '../src/app/(authenticated)/stock/mouvements/stock-movements-model';

const movements: StockMovement[] = [
  {
    id: 'movement-1',
    date: '12/07/2025',
    time: '09:30',
    type: 'Entrée',
    item: 'Bœuf mariné',
    itemId: 'STK-0048',
    emoji: '🥩',
    category: 'Viandes',
    quantity: 10,
    unit: 'kg',
    zone: 'Chambre froide',
    reference: 'BC-001',
    referenceDetail: 'Fournisseur',
    user: 'Sophie',
    userInitials: 'SL',
    value: 150,
    status: 'Validé',
    note: 'Conforme',
  },
  {
    id: 'movement-2',
    date: '12/07/2025',
    time: '14:10',
    type: 'Sortie',
    item: 'Lait de coco',
    itemId: 'STK-0015',
    emoji: '🥫',
    category: 'Épicerie',
    quantity: -2,
    unit: 'unité',
    zone: 'Cuisine',
    reference: 'CMD-248',
    referenceDetail: 'Vente',
    user: 'Lucas',
    userInitials: 'LM',
    value: -5,
    status: 'Validé',
    note: 'POS',
  },
];

describe('stock movements model', () => {
  it('combines type, category, zone, and normalized text filters', () => {
    expect(
      filterStockMovements(movements, {
        type: 'Entrée',
        category: 'Viandes',
        zone: 'Chambre froide',
        query: 'BŒUF',
      }),
    ).toEqual([movements[0]]);
    expect(
      filterStockMovements(movements, {
        type: 'all',
        category: 'all',
        zone: 'all',
        query: 'cmd-248',
      }),
    ).toEqual([movements[1]]);
  });

  it('falls back to the first movement when selection is unknown', () => {
    expect(getSelectedStockMovement(movements, 'missing')).toBe(movements[0]);
    expect(getSelectedStockMovement(movements, null)).toBeUndefined();
  });

  it('derives and updates multi-selection without duplicates', () => {
    expect(areAllStockMovementsChecked(movements, ['movement-1'])).toBe(false);
    expect(
      areAllStockMovementsChecked(movements, ['movement-1', 'movement-2']),
    ).toBe(true);
    expect(
      toggleStockMovementSelection(['movement-1'], 'movement-1', true),
    ).toEqual(['movement-1']);
    expect(
      toggleStockMovementSelection(['movement-1'], 'movement-1', false),
    ).toEqual([]);
  });

  it('formats quantities and currency for the French UI', () => {
    expect(formatStockQuantity(1.2)).toBe('+1,20');
    expect(formatStockQuantity(-2)).toBe('-2,00');
    expect(formatStockCurrency(12.5)).toContain('12,50');
  });
});
