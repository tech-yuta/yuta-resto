import type { HTMLAttributes, ReactNode } from 'react';
import { Users } from 'lucide-react';
import { Badge } from './badge';
import { Card } from './card';
import { cn } from './utils';

export type TableCardStatus = 'available' | 'occupied' | 'reserved' | 'dirty' | 'disabled';

const tableStatusConfig: Record<
  TableCardStatus,
  {
    label: string;
    tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  }
> = {
  available: { label: 'Available', tone: 'success' },
  occupied: { label: 'Occupied', tone: 'warning' },
  reserved: { label: 'Reserved', tone: 'info' },
  dirty: { label: 'Dirty', tone: 'danger' },
  disabled: { label: 'Disabled', tone: 'neutral' },
};

export interface TableCardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  label: ReactNode;
  status: TableCardStatus;
  statusLabel?: ReactNode;
  capacity?: ReactNode;
  zone?: ReactNode;
  amount?: ReactNode;
  action?: ReactNode;
}

export function TableCard({
  label,
  status,
  statusLabel,
  capacity,
  zone,
  amount,
  action,
  className,
  ...props
}: TableCardProps) {
  const config = tableStatusConfig[status];

  return (
    <Card
      className={cn('grid min-h-40 content-between gap-4 shadow-none', className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-black">{label}</h3>
          {zone && <p className="mt-1 text-sm font-semibold text-muted">{zone}</p>}
        </div>
        <Badge tone={config.tone} variant="soft">
          {statusLabel ?? config.label}
        </Badge>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="grid gap-1 text-sm font-semibold text-muted">
          {capacity && (
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" />
              {capacity}
            </span>
          )}
          {amount && <span className="text-lg font-black text-primary">{amount}</span>}
        </div>
        {action}
      </div>
    </Card>
  );
}
