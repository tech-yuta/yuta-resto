import type { HTMLAttributes, PropsWithChildren } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const iconTileVariants = cva(
  'grid shrink-0 place-items-center rounded-lg transition-colors',
  {
    variants: {
      tone: {
        mist: 'bg-yuta-mist text-yuta-ink/65',
        success: 'bg-yuta-success/10 text-yuta-success',
        warning: 'bg-yuta-warning/15 text-yuta-ink',
        info: 'bg-yuta-info text-yuta-ink',
        accent: 'bg-yuta-accent text-yuta-ink',
        dark: 'bg-yuta-ink text-white',
      },
      size: {
        sm: 'h-8 w-8',
        default: 'h-9 w-9',
        lg: 'h-11 w-11',
      },
      shape: {
        rounded: 'rounded-lg',
        circle: 'rounded-full',
      },
    },
    defaultVariants: {
      tone: 'mist',
      size: 'default',
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
