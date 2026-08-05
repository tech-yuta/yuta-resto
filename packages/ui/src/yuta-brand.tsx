import * as React from 'react';
import yutaLogoAsset from './assets/yuta-logo.svg';
import { cn } from './utils';

export { yutaLogoAsset };

export type YutaBrandMarkProps = Omit<
  React.ComponentPropsWithoutRef<'span'>,
  'children'
> & {
  iconClassName?: string;
  nameClassName?: string;
  showName?: boolean;
};

export function YutaBrandMark({
  className,
  iconClassName,
  nameClassName,
  showName = true,
  ...props
}: YutaBrandMarkProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-2', className)}
      aria-label={showName ? 'YUTA' : undefined}
      {...props}
    >
      <img
        src={yutaLogoAsset.src}
        alt=""
        aria-hidden="true"
        className={cn('h-6 w-6 object-contain', iconClassName)}
      />
      {showName && (
        <span
          className={cn(
            'font-bold tracking-[0.08em] text-primary',
            nameClassName,
          )}
        >
          YUTA
        </span>
      )}
    </span>
  );
}

export type PoweredByYutaProps = React.ComponentPropsWithoutRef<'div'> & {
  label?: React.ReactNode;
};

export function PoweredByYuta({
  className,
  label = 'Propulsé par',
  ...props
}: PoweredByYutaProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 text-xs text-muted',
        className,
      )}
      {...props}
    >
      <span>{label}</span>
      <YutaBrandMark />
    </div>
  );
}
