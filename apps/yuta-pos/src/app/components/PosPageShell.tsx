import { Button, cn } from '@yuta/ui';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { PosHeader } from './PosHeader';

type PosPageShellProps = {
  title: ReactNode;
  children: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  subHeader?: ReactNode;
  floatingAction?: ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  maxWidthClassName?: string;
};

type PosMobileFabProps = {
  href: string;
  label: string;
  icon: ReactNode;
};

export function PosPageShell({
  title,
  children,
  description,
  eyebrow,
  actions,
  backHref,
  backLabel,
  subHeader,
  floatingAction,
  className,
  contentClassName,
  headerClassName,
  maxWidthClassName = 'max-w-6xl',
}: PosPageShellProps) {
  return (
    <main className="h-dvh overflow-hidden bg-canvas text-primary">
      <div
        className={cn(
          'mx-auto flex h-dvh w-full flex-col bg-white',
          maxWidthClassName,
          className,
        )}
      >
        <PosHeader
          title={title}
          description={description}
          eyebrow={eyebrow}
          actions={actions}
          backHref={backHref}
          backLabel={backLabel}
          className={headerClassName}
        />
        {subHeader && (
          <div className="shrink-0 border-b border-border-default bg-white">
            {subHeader}
          </div>
        )}
        <div
          className={cn(
            'min-h-0 flex-1 overflow-y-auto bg-white px-4 py-4',
            contentClassName,
          )}
        >
          {children}
        </div>
        {floatingAction}
      </div>
    </main>
  );
}

export function PosMobileFab({ href, label, icon }: PosMobileFabProps) {
  return (
    <Button
      asChild
      variant="primary"
      size="sm"
      className="fixed bottom-5 right-5 z-20 h-14 w-14 rounded-full shadow-sm sm:hidden"
      aria-label={label}
    >
      <Link href={href}>{icon}</Link>
    </Button>
  );
}
