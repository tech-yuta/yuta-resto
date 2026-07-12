import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const iconButtonVariants = cva(
  'inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
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
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
    },
  },
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  asChild?: boolean;
}

export function IconButton({
  asChild = false,
  className,
  variant,
  size,
  ...props
}: IconButtonProps) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { iconButtonVariants };
