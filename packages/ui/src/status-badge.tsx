import type { ComponentProps } from 'react';
import { CheckCircle2, Clock3, Info, XCircle } from 'lucide-react';
import { Badge } from './badge';

const statusConfig = {
  new: { label: 'New', tone: 'info', icon: Info },
  accepted: { label: 'Accepted', tone: 'brand', icon: CheckCircle2 },
  preparing: { label: 'Preparing', tone: 'warning', icon: Clock3 },
  ready: { label: 'Ready', tone: 'success', icon: CheckCircle2 },
  served: { label: 'Served', tone: 'neutral', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', tone: 'danger', icon: XCircle },
} as const;

export type StatusBadgeStatus = keyof typeof statusConfig;

export interface StatusBadgeProps
  extends Omit<ComponentProps<typeof Badge>, 'tone'> {
  status: StatusBadgeStatus;
  label?: string;
}

export function StatusBadge({
  status,
  label,
  variant = 'soft',
  ...props
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge tone={config.tone} variant={variant} {...props}>
      <Icon className="h-3.5 w-3.5" />
      {label ?? config.label}
    </Badge>
  );
}
