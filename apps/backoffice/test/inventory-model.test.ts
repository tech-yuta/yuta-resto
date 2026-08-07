import { describe, expect, it } from 'vitest';
import {
  areAllInventoryItemsChecked,
  filterInventoryItems,
  formatInventoryCurrency,
  formatInventoryStock,
  getSelectedInventoryItem,
  toggleInventoryItemSelection,
  type InventoryItem,
} from '../src/app/(authenticated)/stock/inventaire/inventory-model';

const items: InventoryItem[] = [
  {
    id: 'STK-1',
    name: 'Bœuf mariné',
    emoji: '🥩',
    unit: 'kg',
    category: 'Viandes',
    location: 'Chambre froide',
    stock: 8.4,
    minimum: 5,
    maximum: 15,
    value: 126,
    status: 'Disponible',
    movementDay: "Aujourd'hui",
    movementTime: '09:30',
    supplier: 'Métro',
    packaging: 'Carton',
    purchasePrice: '15 €',
    barcode: '123',
  },
  {
    id: 'STK-2',
    name: 'Lait de coco',
    emoji: '🥫',
    unit: 'unité',
    category: 'Épicerie',
    location: 'Réserve sèche',
    stock: 0,
    minimum: 6,
    maximum: 36,
    value: 0,
    status: 'Rupture',
    movementDay: 'Hier',
    movementTime: '18:45',
    supplier: 'Métro',
    packaging: 'Carton',
    purchasePrice: '2 €',
    barcode: '456',
  },
];

describe('inventory model', () => {
  it('combines inventory filters and normalized search', () => {
    expect(
      filterInventoryItems(items, 'Stock actuel', {
        category: 'Viandes',
        zone: 'Chambre froide',
        status: 'Disponible',
        query: 'BŒUF',
      }),
    ).toEqual([items[0]]);
    expect(
      filterInventoryItems(items, 'Stock actuel', {
        category: 'all',
        zone: 'all',
        status: 'Rupture',
        query: '',
      }),
    ).toEqual([items[1]]);
  });

  it('returns no stock rows for the non-stock fixture tabs', () => {
    expect(
      filterInventoryItems(items, 'Comptages', {
        category: 'all',
        zone: 'all',
        status: 'all',
        query: '',
      }),
    ).toEqual([]);
  });

  it('falls back to the first item and derives multi-selection', () => {
    expect(getSelectedInventoryItem(items, 'missing')).toBe(items[0]);
    expect(areAllInventoryItemsChecked(items, ['STK-1'])).toBe(false);
    expect(areAllInventoryItemsChecked(items, ['STK-1', 'STK-2'])).toBe(true);
    expect(toggleInventoryItemSelection(['STK-1'], 'STK-1', true)).toEqual([
      'STK-1',
    ]);
    expect(toggleInventoryItemSelection(['STK-1'], 'STK-1', false)).toEqual([]);
  });

  it('formats stock units and currency for the French UI', () => {
    expect(formatInventoryStock(2, 'unité')).toBe('2 unités');
    expect(formatInventoryStock(1, 'unité')).toBe('1 unité');
    expect(formatInventoryStock(8.4, 'kg')).toBe('8,4 kg');
    expect(formatInventoryCurrency(12.5)).toContain('12,50');
  });
});
