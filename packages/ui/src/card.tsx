import type { HTMLAttributes, PropsWithChildren } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const cardVariants = cva('border border-yuta-line bg-white shadow-card', {
  variants: {
    variant: {
      default: '',
      mist: 'bg-yuta-mist',
      paper: 'bg-yuta-paper',
      dark: 'border-yuta-ink bg-yuta-ink text-white',
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
