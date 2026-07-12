import type { HTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from './utils';

export interface LoadingOverlayProps extends HTMLAttributes<HTMLDivElement> {
  visible?: boolean;
  label?: ReactNode;
}

export function LoadingOverlay({
  visible = true,
  label = 'Loading',
  className,
  ...props
}: LoadingOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className={cn(
        'absolute inset-0 z-20 grid place-items-center bg-surface/80 backdrop-blur-sm',
        className,
      )}
      role="status"
      aria-live="polite"
      {...props}
    >
      <div className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-surface px-3 py-2 text-sm font-semibold text-primary shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        {label}
      </div>
    </div>
  );
}
