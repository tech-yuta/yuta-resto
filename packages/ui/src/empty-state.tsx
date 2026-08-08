import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './utils';

export interface EmptyStateProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'title'
> {
  icon?: ReactNode;
  title: ReactNode;
  titleAs?: 'h1' | 'h2' | 'h3';
  description?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  titleAs: Title = 'h3',
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'grid min-h-64 place-items-center p-8 text-center',
        className,
      )}
      {...props}
    >
      <div>
        {icon && <div className="mx-auto mb-4 text-primary/35">{icon}</div>}
        <Title className="font-bold text-primary">{title}</Title>
        {description && (
          <p className="mt-1 text-sm font-medium text-secondary">
            {description}
          </p>
        )}
        {action && <div className="mt-5 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}
