import { Button, cn } from '@yuta/ui';
import { ArrowLeft, Menu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

type PosHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
};

export function PosHeader({
  title,
  description,
  eyebrow,
  actions,
  backHref,
  backLabel = 'Retour',
  className,
}: PosHeaderProps) {
  return (
    <header
      className={cn(
        'relative flex flex-wrap items-center justify-between gap-3 bg-primary px-4 py-3 text-white',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {backHref && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="shrink-0 text-white hover:bg-white/10"
          >
            <Link href={backHref} aria-label={backLabel}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
        )}
        <Link
          href="/"
          aria-label="Retour aux commandes"
          className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/15 bg-white transition-colors hover:bg-surface-muted"
        >
          <Image
            src="/images/logo.svg"
            alt="YuTa"
            width={36}
            height={36}
            priority
            className="h-9 w-9 object-contain"
          />
        </Link>
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs font-black uppercase tracking-normal text-white/55">
              {eyebrow}
            </p>
          )}
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h1 className="truncate text-xl font-black tracking-normal md:text-2xl">
              {title}
            </h1>
          </div>
          {description && (
            <p className="mt-0.5 text-xs font-semibold text-white/60">
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <>
          <div className="hidden flex-wrap items-center gap-2 sm:flex">
            {actions}
          </div>
          <details className="group sm:hidden">
            <summary className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-lg text-white transition-colors hover:bg-white/10 [&::-webkit-details-marker]:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Menu</span>
            </summary>
            <div className="absolute right-4 top-full z-30 mt-2 grid min-w-64 gap-2 rounded-lg border border-border-default bg-white p-3 text-primary shadow-sm [&>a]:w-full [&>button]:w-full [&>form>button]:w-full [&>form]:w-full">
              {actions}
            </div>
          </details>
        </>
      )}
    </header>
  );
}
