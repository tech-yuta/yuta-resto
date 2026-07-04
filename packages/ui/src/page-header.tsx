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
        'flex flex-wrap items-center justify-between gap-4 rounded-lg border border-yuta-line bg-white px-4 py-3 shadow-card',
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-3">
        {media}
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs font-black uppercase tracking-normal text-yuta-ink/45">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-black tracking-normal md:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm font-semibold text-yuta-ink/55">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
