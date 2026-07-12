import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './utils';

export interface BulkActionBarProps extends HTMLAttributes<HTMLDivElement> {
  selectedCount: number;
  label?: ReactNode;
  actions?: ReactNode;
}

export function BulkActionBar({
  selectedCount,
  label,
  actions,
  className,
  ...props
}: BulkActionBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-brand-200 bg-surface-selected p-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
      {...props}
    >
      <p className="text-sm font-bold text-brand-800">
        {label ?? `${selectedCount} selected`}
      </p>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
