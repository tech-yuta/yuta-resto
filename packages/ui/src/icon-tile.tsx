import type { HTMLAttributes, PropsWithChildren } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const iconTileVariants = cva(
  'grid shrink-0 place-items-center rounded-lg transition-colors',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-muted text-secondary',
        brand: 'bg-surface-selected text-brand-800',
        success: 'bg-status-success-soft text-status-success',
        warning: 'bg-status-warning-soft text-status-warning',
        info: 'bg-status-info-soft text-status-info',
        danger: 'bg-status-danger-soft text-status-danger',
        inverse: 'bg-primary text-inverse',
      },
      size: {
        sm: 'h-8 w-8',
        md: 'h-9 w-9',
        lg: 'h-11 w-11',
      },
      shape: {
        rounded: 'rounded-lg',
        circle: 'rounded-full',
      },
    },
    defaultVariants: {
      tone: 'neutral',
      size: 'md',
      shape: 'rounded',
    },
  },
);

export interface IconTileProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof iconTileVariants> {}

export function IconTile({
  children,
  className,
  tone,
  size,
  shape,
  ...props
}: PropsWithChildren<IconTileProps>) {
  return (
    <div
      className={cn(iconTileVariants({ tone, size, shape, className }))}
      {...props}
    >
      {children}
    </div>
  );
}

export { iconTileVariants };
