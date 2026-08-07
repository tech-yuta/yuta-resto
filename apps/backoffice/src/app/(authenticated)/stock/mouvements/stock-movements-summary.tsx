import { Card, cn } from '@yuta/ui';
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  ClipboardList,
  Package,
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
    label: 'Entrées',
    value: '128',
    helper: '8 942,30 €',
    icon: ArrowDown,
    tone: 'bg-status-success-soft text-status-success',
  },
  {
    label: 'Sorties',
    value: '245',
    helper: '-9 321,70 €',
    icon: ArrowUp,
    tone: 'bg-status-danger-soft text-status-danger',
  },
  {
    label: 'Ajustements',
    value: '18',
    helper: '-382,20 €',
    icon: ArrowLeftRight,
    tone: 'bg-status-info-soft text-status-info',
  },
  {
    label: 'Transferts',
    value: '12',
    helper: '-126,50 €',
    icon: Package,
    tone: 'bg-surface-selected text-brand-800',
  },
  {
    label: 'Total mouvements',
    value: '403',
    helper: 'Cette période',
    icon: ClipboardList,
    tone: 'bg-status-warning-soft text-status-warning',
  },
];

export function StockMovementsSummary() {
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
              'flex min-w-0 items-center gap-4 border-b border-r border-border-default p-5 xl:border-b-0',
              metric.label === 'Total mouvements' && 'col-span-2 md:col-span-1',
            )}
          >
            <div
              className={cn(
                'grid h-12 w-12 shrink-0 place-items-center rounded-full',
                metric.tone,
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black">{metric.value}</p>
              <p className="text-xs font-semibold text-secondary">
                {metric.label}
              </p>
              <p className="mt-2 whitespace-nowrap text-xs font-semibold">
                {metric.helper}
              </p>
            </div>
          </div>
        );
      })}
    </Card>
  );
}
