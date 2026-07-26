import { cn } from '@yuta/ui';
import type { HTMLAttributes, ReactNode } from 'react';

type PublicContainerSize = 'default' | 'wide' | 'legal';

const sizeClasses: Record<PublicContainerSize, string> = {
  default: 'max-w-[1280px]',
  wide: 'max-w-[1360px]',
  legal: 'max-w-[1200px]',
};

interface PublicContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  size?: PublicContainerSize;
}

export function PublicContainer({
  children,
  className,
  size = 'default',
  ...props
}: PublicContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10',
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
