import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './utils';

export interface MetricCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
}

export function MetricCard({
  label,
  value,
  helper,
  className,
  ...props
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border-default bg-canvas p-3',
        className,
      )}
      {...props}
    >
      <p className="text-xs font-semibold text-primary/55">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
      {helper && (
        <p className="mt-1 text-xs font-semibold text-primary/50">{helper}</p>
      )}
    </div>
  );
}
