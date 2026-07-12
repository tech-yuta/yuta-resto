import type { HTMLAttributes } from 'react';
import { cn } from './utils';

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
}

export function Progress({
  value,
  max = 100,
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div
      className={cn('h-2 overflow-hidden rounded-full bg-surface-muted', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      {...props}
    >
      <div
        className="h-full rounded-full bg-action-primary transition-[width]"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
