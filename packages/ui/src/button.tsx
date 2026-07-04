import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import { cn } from './utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-yuta-success focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-yuta-success text-white hover:bg-yuta-success/90',
        secondary:
          'border border-yuta-line bg-white text-yuta-ink hover:bg-yuta-mist',
        accent: 'bg-yuta-accent text-yuta-ink hover:bg-yuta-accent/90',
        ghost: 'text-yuta-ink hover:bg-yuta-mist',
        destructive: 'bg-yuta-danger text-white hover:bg-yuta-danger/90',
        link: 'text-yuta-ink underline-offset-4 hover:underline',
        kitchen: 'bg-yuta-warning text-yuta-ink hover:bg-yuta-warning/90',
        success: 'bg-yuta-success text-white hover:bg-yuta-success/90',
      },
      size: {
        default: 'px-4 py-2.5',
        sm: 'px-3 py-1.5 text-xs',
        lg: 'px-6 py-3 text-base',
        icon: 'h-9 w-9 p-0',
        touch: 'min-h-12 px-5 py-3 text-base',
        tile: 'min-h-16 flex-col px-3 py-3',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  asChild = false,
  className,
  variant,
  size,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { buttonVariants };
