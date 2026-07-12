import type { HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const alertVariants = cva('rounded-lg border p-4 text-sm', {
  variants: {
    tone: {
      neutral: 'border-border-default bg-surface text-primary',
      brand: 'border-brand-200 bg-surface-selected text-brand-800',
      success:
        'border-status-success-border bg-status-success-soft text-status-success',
      warning:
        'border-status-warning-border bg-status-warning-soft text-status-warning',
      danger:
        'border-status-danger-border bg-status-danger-soft text-status-danger',
      info: 'border-status-info-border bg-status-info-soft text-status-info',
    },
  },
  defaultVariants: {
    tone: 'neutral',
  },
});

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  icon?: ReactNode;
}

export function Alert({
  icon,
  className,
  tone,
  children,
  ...props
}: AlertProps) {
  return (
    <div
      className={cn(
        alertVariants({ tone }),
        icon && 'grid grid-cols-[auto_minmax(0,1fr)] gap-3',
        className,
      )}
      role="status"
      {...props}
    >
      {icon && <div className="mt-0.5">{icon}</div>}
      <div>{children}</div>
    </div>
  );
}

export function AlertTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('font-bold', className)} {...props} />;
}

export function AlertDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-1 font-medium opacity-80', className)} {...props} />;
}

export { alertVariants };
