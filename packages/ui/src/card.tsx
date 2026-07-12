import type { HTMLAttributes, PropsWithChildren } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const cardVariants = cva('border border-border-default bg-surface shadow-sm', {
  variants: {
    variant: {
      default: '',
      muted: 'bg-surface-muted',
      canvas: 'bg-canvas',
      inverse: 'border-primary bg-primary text-inverse',
    },
    padding: {
      default: 'p-5',
      none: 'p-0',
      sm: 'p-3',
      lg: 'p-6',
    },
    radius: {
      default: 'rounded-lg',
      sm: 'rounded-md',
      lg: 'rounded-xl',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'default',
    radius: 'default',
  },
});

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

export function Card({
  children,
  className,
  variant,
  padding,
  radius,
  ...props
}: PropsWithChildren<CardProps>) {
  return (
    <div
      className={cn(cardVariants({ variant, padding, radius, className }))}
      {...props}
    >
      {children}
    </div>
  );
}

export { cardVariants };
