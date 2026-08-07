import { Card, cn } from '@yuta/ui';
import {
  AlertCircle,
  Bell,
  CalendarDays,
  CheckCircle2,
  FileCheck2,
  type LucideIcon,
} from 'lucide-react';

const metrics: Array<{
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone: string;
  helperTone: string;
}> = [
  {
    label: 'Actions requises',
    value: '7',
    helper: 'Dont 2 urgentes',
    icon: AlertCircle,
    tone: 'bg-status-danger-soft text-status-danger',
    helperTone: 'text-status-danger',
  },
  {
    label: 'Échéances < 30 jours',
    value: '3',
    helper: 'Prochaine : 18 juil. 2026',
    icon: CalendarDays,
    tone: 'bg-status-warning-soft text-status-warning',
    helperTone: 'text-status-warning',
  },
  {
    label: 'Obligations suivies',
    value: '86',
    helper: 'Toutes catégories',
    icon: CheckCircle2,
    tone: 'bg-status-success-soft text-status-success',
    helperTone: 'text-status-success',
  },
  {
    label: 'Dossier complété',
    value: '92 %',
    helper: 'En progression',
    icon: FileCheck2,
    tone: 'bg-status-info-soft text-status-info',
    helperTone: 'text-status-info',
  },
  {
    label: 'Nouveautés à analyser',
    value: '2',
    helper: 'Voir la veille',
    icon: Bell,
    tone: 'bg-surface-selected text-brand-800',
    helperTone: 'text-brand-800',
  },
];

export function ComplianceSummary() {
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
              metric.label === 'Nouveautés à analyser' &&
                'col-span-2 md:col-span-1',
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
              <p className="truncate text-xs font-semibold text-secondary">
                {metric.label}
              </p>
              <p className="text-2xl font-black">{metric.value}</p>
              <p
                className={cn(
                  'mt-2 truncate text-xs font-semibold',
                  metric.helperTone,
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
