import { Card, cn } from '@yuta/ui';
import {
  AlertTriangle,
  ArchiveX,
  Boxes,
  Euro,
  Scale,
  type LucideIcon,
} from 'lucide-react';

const metrics: Array<{
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone: string;
}> = [
  {
    label: 'Références actives',
    value: '248',
    helper: '+8 ce mois',
    icon: Boxes,
    tone: 'bg-surface-selected text-brand-800',
  },
  {
    label: 'Stocks faibles',
    value: '12',
    helper: 'Voir la liste ›',
    icon: AlertTriangle,
    tone: 'bg-status-warning-soft text-status-warning',
  },
  {
    label: 'Ruptures',
    value: '4',
    helper: 'Voir la liste ›',
    icon: ArchiveX,
    tone: 'bg-status-danger-soft text-status-danger',
  },
  {
    label: 'Écarts à valider',
    value: '8',
    helper: 'Voir la liste ›',
    icon: Scale,
    tone: 'bg-surface-selected text-brand-800',
  },
  {
    label: 'Valeur estimée',
    value: '8 420,00 €',
    helper: "Mise à jour : aujourd'hui 09:30",
    icon: Euro,
    tone: 'bg-status-success-soft text-status-success',
  },
];

export function InventorySummary() {
  return (
    <Card
      padding="none"
      className="grid grid-cols-2 overflow-hidden md:grid-cols-3 xl:grid-cols-5"
    >
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.label}
            className={cn(
              'flex min-w-0 items-center gap-3 border-b border-r border-border-default p-4 xl:border-b-0',
              metric.label === 'Valeur estimée' && 'col-span-2 md:col-span-1',
            )}
          >
            <div
              className={cn(
                'grid h-11 w-11 shrink-0 place-items-center rounded-full',
                metric.tone,
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-2xl font-black">{metric.value}</p>
              <p className="text-xs font-semibold text-secondary">
                {metric.label}
              </p>
              <p className="mt-2 truncate text-xs text-brand-800">
                {metric.helper}
              </p>
            </div>
          </div>
        );
      })}
    </Card>
  );
}
