import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

type AdminPageProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
};

export function AdminPage({
  title,
  description,
  actions,
  children,
}: AdminPageProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border-default pb-5">
        <div>
          <Link
            href="/"
            className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-primary/60 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour admin
          </Link>
          <h1 className="text-3xl font-black tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-primary/55">{description}</p>
          )}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  );
}
