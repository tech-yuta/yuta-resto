export type StockStatus = 'Disponible' | 'Stock faible' | 'Rupture';

export type InventoryItem = {
  id: string;
  name: string;
  emoji: string;
  unit: string;
  category: string;
  location: string;
  stock: number;
  minimum: number;
  maximum: number;
  value: number;
  status: StockStatus;
  movementDay: string;
  movementTime: string;
  supplier: string;
  packaging: string;
  purchasePrice: string;
  barcode: string;
};

export const inventoryTabs = [
  'Stock actuel',
  'Comptages',
  'Écarts',
  'Alertes',
] as const;

export type InventoryTab = (typeof inventoryTabs)[number];

export type InventoryFilters = {
  category: string;
  zone: string;
  status: string;
  query: string;
};

export function filterInventoryItems(
  items: readonly InventoryItem[],
  activeTab: InventoryTab,
  filters: InventoryFilters,
): InventoryItem[] {
  if (activeTab !== 'Stock actuel') return [];
  const normalizedQuery = filters.query.trim().toLocaleLowerCase('fr-FR');

  return items.filter((item) => {
    const searchable =
      `${item.name} ${item.id} ${item.category}`.toLocaleLowerCase('fr-FR');
    return (
      (filters.category === 'all' || item.category === filters.category) &&
      (filters.zone === 'all' || item.location === filters.zone) &&
      (filters.status === 'all' || item.status === filters.status) &&
      searchable.includes(normalizedQuery)
    );
  });
}

export function getSelectedInventoryItem(
  items: readonly InventoryItem[],
  selectedId: string,
): InventoryItem | undefined {
  return items.find((item) => item.id === selectedId) ?? items[0];
}

export function areAllInventoryItemsChecked(
  items: readonly InventoryItem[],
  checkedIds: readonly string[],
): boolean {
  return (
    items.length > 0 && items.every((item) => checkedIds.includes(item.id))
  );
}

export function toggleInventoryItemSelection(
  checkedIds: readonly string[],
  id: string,
  checked: boolean,
): string[] {
  return checked
    ? [...new Set([...checkedIds, id])]
    : checkedIds.filter((currentId) => currentId !== id);
}

export function formatInventoryStock(value: number, unit: string): string {
  const formatted = Number.isInteger(value)
    ? value.toString()
    : value.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  return `${formatted} ${unit}${unit === 'unité' && value !== 1 ? 's' : ''}`;
}

export function formatInventoryCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}
