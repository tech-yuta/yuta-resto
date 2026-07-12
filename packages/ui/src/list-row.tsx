import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './utils';

export interface ListRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  media?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
}

export function ListRow({
  media,
  title,
  description,
  meta,
  action,
  className,
  ...props
}: ListRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-5 py-3',
        className,
      )}
      {...props}
    >
      {media}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-yuta-ink">{title}</p>
        {description && (
          <p className="truncate text-xs font-medium text-yuta-ink/50">
            {description}
          </p>
        )}
      </div>
      {meta && (
        <div className="shrink-0 text-xs font-medium text-yuta-ink/40">
          {meta}
        </div>
      )}
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
