import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import { cn } from './utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-action-primary text-inverse hover:bg-action-primary-hover active:bg-action-primary-active',
        secondary:
          'border border-border-default bg-surface text-primary hover:bg-surface-muted',
        outline:
          'border border-border-default bg-transparent text-primary hover:bg-surface-muted',
        ghost: 'text-primary hover:bg-surface-muted',
        danger: 'bg-action-danger text-inverse hover:bg-action-danger/90',
        success: 'bg-status-success text-inverse hover:bg-status-success/90',
      },
      size: {
        sm: 'h-9 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
}

export function Button({
  asChild = false,
  className,
  disabled,
  fullWidth,
  loading,
  variant,
  size,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      className={cn(
        buttonVariants({ variant, size }),
        fullWidth && 'w-full',
        className,
      )}
      data-loading={loading ? '' : undefined}
      disabled={disabled || loading}
      {...props}
    >
      {children}
    </Comp>
  );
}

export { buttonVariants };
