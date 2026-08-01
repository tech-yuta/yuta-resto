import { cn } from '@yuta/ui';
import type { HTMLAttributes, ReactNode } from 'react';

type PublicContainerSize = 'marketing' | 'article' | 'legal';

const sizeClasses: Record<PublicContainerSize, string> = {
  marketing: 'max-w-[1280px]',
  article: 'max-w-[800px]',
  legal: 'max-w-[1200px]',
};

interface PublicContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  size?: PublicContainerSize;
}

export function PublicContainer({
  children,
  className,
  size = 'marketing',
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
