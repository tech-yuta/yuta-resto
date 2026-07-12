import type { HTMLAttributes } from 'react';
import { cn } from './utils';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback: string;
  size?: 'sm' | 'md' | 'lg';
}

const avatarSizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

export function Avatar({
  src,
  alt = '',
  fallback,
  size = 'md',
  className,
  ...props
}: AvatarProps) {
  return (
    <div
      className={cn(
        'relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-surface-muted font-bold text-secondary',
        avatarSizes[size],
        className,
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden={alt.length > 0}>{fallback.slice(0, 2)}</span>
      )}
    </div>
  );
}

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  max?: number;
}

export function AvatarGroup({
  children,
  className,
  ...props
}: AvatarGroupProps) {
  return (
    <div className={cn('flex -space-x-2', className)} {...props}>
      {children}
    </div>
  );
}
