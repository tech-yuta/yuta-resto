import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full font-medium transition-colors',
  {
    variants: {
      tone: {
        neutral: '',
        brand: '',
        success: '',
        warning: '',
        danger: '',
        info: '',
      },
      variant: {
        soft: '',
        outline: 'border bg-transparent',
        solid: '',
      },
      size: {
        sm: 'px-2 py-0.5 text-[11px]',
        md: 'px-2.5 py-0.5 text-xs',
      },
    },
    compoundVariants: [
      {
        tone: 'neutral',
        variant: 'soft',
        className: 'bg-surface-muted text-secondary',
      },
      {
        tone: 'neutral',
        variant: 'outline',
        className: 'border-border-default text-secondary',
      },
      {
        tone: 'neutral',
        variant: 'solid',
        className: 'bg-primary text-inverse',
      },
      {
        tone: 'brand',
        variant: 'soft',
        className: 'bg-surface-selected text-brand-800',
      },
      {
        tone: 'brand',
        variant: 'outline',
        className: 'border-brand-200 text-brand-800',
      },
      {
        tone: 'brand',
        variant: 'solid',
        className: 'bg-action-primary text-inverse',
      },
      {
        tone: 'success',
        variant: 'soft',
        className: 'bg-status-success-soft text-status-success',
      },
      {
        tone: 'success',
        variant: 'outline',
        className: 'border-status-success-border text-status-success',
      },
      {
        tone: 'success',
        variant: 'solid',
        className: 'bg-status-success text-inverse',
      },
      {
        tone: 'warning',
        variant: 'soft',
        className: 'bg-status-warning-soft text-status-warning',
      },
      {
        tone: 'warning',
        variant: 'outline',
        className: 'border-status-warning-border text-status-warning',
      },
      {
        tone: 'warning',
        variant: 'solid',
        className: 'bg-status-warning text-inverse',
      },
      {
        tone: 'danger',
        variant: 'soft',
        className: 'bg-status-danger-soft text-status-danger',
      },
      {
        tone: 'danger',
        variant: 'outline',
        className: 'border-status-danger-border text-status-danger',
      },
      {
        tone: 'danger',
        variant: 'solid',
        className: 'bg-status-danger text-inverse',
      },
      {
        tone: 'info',
        variant: 'soft',
        className: 'bg-status-info-soft text-status-info',
      },
      {
        tone: 'info',
        variant: 'outline',
        className: 'border-status-info-border text-status-info',
      },
      {
        tone: 'info',
        variant: 'solid',
        className: 'bg-status-info text-inverse',
      },
    ],
    defaultVariants: { tone: 'neutral', variant: 'soft', size: 'md' },
  },
);

type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({
  children,
  className,
  tone,
  variant,
  size,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ tone, variant, size }), className)}
      {...props}
    >
      {children}
    </span>
  );
}

export { badgeVariants };
