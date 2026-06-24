import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        active: 'bg-yuta-accent text-yuta-ink',
        inactive: 'bg-yuta-mist text-yuta-ink/50',
        neutral: 'bg-yuta-mist text-yuta-ink',
        destructive: 'bg-red-100 text-red-700',
        outline: 'border border-yuta-line text-yuta-ink',
      },
    },
    defaultVariants: { variant: 'neutral' },
  }
);

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ children, className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  );
}

export { badgeVariants };
