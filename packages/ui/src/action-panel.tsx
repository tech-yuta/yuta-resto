import type { HTMLAttributes, PropsWithChildren, ReactNode } from 'react';
import { cn } from './utils';

export interface ActionPanelProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'title'
> {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
}

export function ActionPanel({
  icon,
  title,
  description,
  children,
  className,
  ...props
}: PropsWithChildren<ActionPanelProps>) {
  return (
    <section
      className={cn(
        'rounded-lg border border-yuta-line bg-white p-5 shadow-card',
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-yuta-mist">
            {icon}
          </div>
        )}
        <div>
          <h2 className="font-bold">{title}</h2>
          {description && (
            <p className="text-sm text-yuta-ink/55">{description}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}
