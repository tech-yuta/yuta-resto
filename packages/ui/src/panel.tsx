import type { HTMLAttributes, PropsWithChildren, ReactNode } from 'react';
import { Card, type CardProps } from './card';
import { Separator } from './separator';
import { cn } from './utils';

export interface PanelProps extends Omit<CardProps, 'title'> {
  title?: ReactNode;
  action?: ReactNode;
  description?: ReactNode;
  headerClassName?: string;
  bodyClassName?: string;
  withSeparator?: boolean;
}

export function Panel({
  title,
  action,
  description,
  children,
  className,
  headerClassName,
  bodyClassName,
  withSeparator = true,
  padding = 'none',
  ...props
}: PropsWithChildren<PanelProps>) {
  const hasHeader = title || action || description;

  return (
    <Card padding={padding} className={cn('overflow-hidden', className)} {...props}>
      {hasHeader && (
        <>
          <PanelHeader
            title={title}
            action={action}
            description={description}
            className={headerClassName}
          />
          {withSeparator && <Separator />}
        </>
      )}
      <div className={bodyClassName}>{children}</div>
    </Card>
  );
}

export interface PanelHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  action?: ReactNode;
  description?: ReactNode;
}

export function PanelHeader({
  title,
  action,
  description,
  className,
  ...props
}: PanelHeaderProps) {
  return (
    <div
      className={cn('flex items-center justify-between gap-3 px-5 py-5', className)}
      {...props}
    >
      <div className="min-w-0">
        {title && <h2 className="truncate font-bold text-primary">{title}</h2>}
        {description && (
          <p className="mt-1 text-sm font-medium text-primary/55">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
