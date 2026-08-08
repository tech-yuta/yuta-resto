import type { TableAvailability } from './tables-model';

export const tableAvailabilityStyles: Record<TableAvailability, string> = {
  Disponible:
    'border-status-success bg-status-success-soft text-status-success',
  Réservée: 'border-status-info bg-status-info-soft text-status-info',
  Indisponible: 'border-border-strong bg-surface-muted text-muted',
};

export const tableAvailabilityTones: Record<
  TableAvailability,
  'success' | 'info' | 'neutral'
> = {
  Disponible: 'success',
  Réservée: 'info',
  Indisponible: 'neutral',
};
