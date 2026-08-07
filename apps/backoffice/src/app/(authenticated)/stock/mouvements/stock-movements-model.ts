export type MovementType = 'Entrée' | 'Sortie' | 'Ajustement' | 'Transfert';

export type StockMovement = {
  id: string;
  date: string;
  time: string;
  type: MovementType;
  item: string;
  itemId: string;
  emoji: string;
  category: string;
  quantity: number;
  unit: string;
  zone: string;
  destination?: string;
  reference: string;
  referenceDetail: string;
  user: string;
  userInitials: string;
  value: number;
  status: 'Validé' | 'Annulé';
  note: string;
  supplier?: string;
  deliveryNote?: string;
  shelf?: string;
  purchasePrice?: string;
};

export type StockMovementFilters = {
  type: string;
  category: string;
  zone: string;
  query: string;
};

export function filterStockMovements(
  movements: readonly StockMovement[],
  filters: StockMovementFilters,
): StockMovement[] {
  const normalizedQuery = filters.query.trim().toLocaleLowerCase('fr-FR');

  return movements.filter((movement) => {
    const searchable =
      `${movement.item} ${movement.itemId} ${movement.reference}`.toLocaleLowerCase(
        'fr-FR',
      );
    return (
      (filters.type === 'all' || movement.type === filters.type) &&
      (filters.category === 'all' || movement.category === filters.category) &&
      (filters.zone === 'all' || movement.zone === filters.zone) &&
      searchable.includes(normalizedQuery)
    );
  });
}

export function getSelectedStockMovement(
  movements: readonly StockMovement[],
  selectedId: string,
): StockMovement | undefined {
  return (
    movements.find((movement) => movement.id === selectedId) ?? movements[0]
  );
}

export function areAllStockMovementsChecked(
  movements: readonly StockMovement[],
  checkedIds: readonly string[],
): boolean {
  return (
    movements.length > 0 &&
    movements.every((movement) => checkedIds.includes(movement.id))
  );
}

export function toggleStockMovementSelection(
  checkedIds: readonly string[],
  id: string,
  checked: boolean,
): string[] {
  return checked
    ? [...new Set([...checkedIds, id])]
    : checkedIds.filter((currentId) => currentId !== id);
}

export function formatStockQuantity(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatStockCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}
