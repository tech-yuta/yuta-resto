import type { HTMLAttributes, PropsWithChildren, ReactNode } from 'react';
import { cn } from './utils';

export interface PageHeaderProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'title'
> {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  media?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  media,
  actions,
  className,
  ...props
}: PropsWithChildren<PageHeaderProps>) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border-default bg-white px-4 py-3 shadow-sm',
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-3">
        {media}
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs font-black uppercase tracking-normal text-primary/45">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-black tracking-normal md:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm font-semibold text-primary/55">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
