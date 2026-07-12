import type { HTMLAttributes, ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { cn } from './utils';

export interface ErrorStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export function ErrorState({
  title,
  description,
  action,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn('grid min-h-64 place-items-center p-8 text-center', className)}
      {...props}
    >
      <div>
        <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-full bg-status-danger-soft text-status-danger">
          <CircleAlert className="h-5 w-5" />
        </div>
        <h3 className="font-bold text-primary">{title}</h3>
        {description && (
          <p className="mt-1 text-sm font-medium text-muted">{description}</p>
        )}
        {action && <div className="mt-5 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}
