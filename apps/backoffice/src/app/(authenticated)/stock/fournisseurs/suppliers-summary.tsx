import { Card, cn } from '@yuta/ui';
import {
  CreditCard,
  ShoppingCart,
  Truck,
  UsersRound,
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
    label: 'Fournisseurs actifs',
    value: '24',
    helper: '+2 ce mois',
    icon: UsersRound,
    tone: 'bg-surface-selected text-brand-800',
  },
  {
    label: 'Commandes en cours',
    value: '12',
    helper: '8 430,50 €',
    icon: ShoppingCart,
    tone: 'bg-status-warning-soft text-status-warning',
  },
  {
    label: 'Livraisons prévues',
    value: '5',
    helper: 'Cette semaine',
    icon: Truck,
    tone: 'bg-status-success-soft text-status-success',
  },
  {
    label: 'Achats ce mois',
    value: '18 769,30 €',
    helper: '-6,2% vs mois dernier',
    icon: CreditCard,
    tone: 'bg-status-info-soft text-status-info',
  },
];

export function SuppliersSummary() {
  return (
    <Card
      padding="none"
      className="grid grid-cols-2 overflow-hidden lg:grid-cols-4"
    >
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.label}
            className="flex min-w-0 items-center gap-4 border-b border-r border-border-default p-5 lg:border-b-0"
          >
            <div
              className={cn(
                'grid h-12 w-12 shrink-0 place-items-center rounded-full',
                metric.tone,
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  'truncate font-black',
                  metric.label === 'Achats ce mois' ? 'text-xl' : 'text-2xl',
                )}
              >
                {metric.value}
              </p>
              <p className="text-xs font-semibold text-secondary">
                {metric.label}
              </p>
              <p
                className={cn(
                  'mt-2 truncate text-xs',
                  metric.label === 'Commandes en cours'
                    ? 'text-status-warning'
                    : 'text-status-success',
                )}
              >
                {metric.helper}
              </p>
            </div>
          </div>
        );
      })}
    </Card>
  );
}
