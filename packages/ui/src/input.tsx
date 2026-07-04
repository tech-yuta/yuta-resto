import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const inputVariants = cva(
  [
    'flex w-full rounded-lg border border-yuta-line bg-white px-3 py-2 text-sm text-yuta-ink placeholder:text-yuta-ink/40 transition-colors',
    'focus:border-yuta-accent focus:outline-none focus:ring-2 focus:ring-yuta-accent/20',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      inputSize: {
        default: 'h-10',
        touch: 'h-12 text-base',
        compact: 'h-9 text-sm',
      },
      align: {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
      },
    },
    defaultVariants: {
      inputSize: 'default',
      align: 'left',
    },
  },
);

export interface InputProps
  extends
    React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, inputSize, align, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ inputSize, align, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
export { inputVariants };
