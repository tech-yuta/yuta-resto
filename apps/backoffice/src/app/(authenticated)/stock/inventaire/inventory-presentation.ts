import type { StockStatus } from './inventory-model';

export const inventoryStatusTones: Record<
  StockStatus,
  'success' | 'warning' | 'danger'
> = {
  Disponible: 'success',
  'Stock faible': 'warning',
  Rupture: 'danger',
};
