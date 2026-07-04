import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        active: 'bg-yuta-accent text-yuta-ink',
        inactive: 'bg-yuta-mist text-yuta-ink/50',
        neutral: 'bg-yuta-mist text-yuta-ink',
        destructive: 'bg-yuta-danger text-white',
        outline: 'border border-yuta-line text-yuta-ink',
        info: 'bg-yuta-info text-yuta-ink',
        warning: 'bg-yuta-warning text-yuta-ink',
        success: 'bg-yuta-success text-white',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-[11px]',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: { variant: 'neutral', size: 'default' },
  },
);

type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({
  children,
  className,
  variant,
  size,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </span>
  );
}

export { badgeVariants };
