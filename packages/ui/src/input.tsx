import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const inputVariants = cva(
  [
    'flex w-full rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-primary placeholder:text-muted transition-colors',
    'focus:border-focus-ring focus:outline-none focus:ring-2 focus:ring-focus-ring/20',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      size: {
        sm: 'h-9 text-sm',
        md: 'h-10',
        lg: 'h-12 text-base',
      },
      align: {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
      },
    },
    defaultVariants: {
      size: 'md',
      align: 'left',
    },
  },
);

export interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size, align, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ size, align, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
export { inputVariants };
