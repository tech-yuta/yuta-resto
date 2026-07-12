import type { HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Card } from './card';
import { IconTile } from './icon-tile';
import { cn } from './utils';

const statToneVariants = cva('', {
  variants: {
    tone: {
      success: 'text-yuta-success',
      warning: 'text-yuta-warning',
      info: 'text-yuta-ink',
      neutral: 'text-yuta-ink/55',
    },
  },
  defaultVariants: {
    tone: 'success',
  },
});

export interface StatCardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statToneVariants> {
  label: ReactNode;
  value: ReactNode;
  helper?: ReactNode;
  icon?: ReactNode;
  sparkline?: ReactNode;
}

export function StatCard({
  label,
  value,
  helper,
  icon,
  sparkline,
  tone,
  className,
  ...props
}: StatCardProps) {
  return (
    <Card
      padding="default"
      className={cn('flex min-h-44 flex-col gap-4 overflow-hidden', className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium leading-snug text-yuta-ink/60">
          {label}
        </p>
        {icon && (
          <IconTile tone={tone === 'neutral' ? 'mist' : tone ?? 'success'}>
            {icon}
          </IconTile>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-yuta-ink">
          {value}
        </p>
        {helper && (
          <p
            className={cn(
              'mt-1 flex items-center gap-1 text-xs font-medium',
              statToneVariants({ tone }),
            )}
          >
            {helper}
          </p>
        )}
      </div>
      {sparkline && <div className="mt-auto">{sparkline}</div>}
    </Card>
  );
}
