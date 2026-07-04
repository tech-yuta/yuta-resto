import type { HTMLAttributes, PropsWithChildren } from 'react';
import { cn } from './utils';

export function SegmentedNav({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLElement>>) {
  return (
    <nav
      className={cn('flex gap-2 overflow-x-auto pb-1', className)}
      {...props}
    >
      {children}
    </nav>
  );
}
