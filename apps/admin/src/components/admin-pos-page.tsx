import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

type AdminPosPageProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
};

export function AdminPosPage({
  title,
  description,
  actions,
  children,
}: AdminPosPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-yuta-line pb-5">
        <div>
          <Link
            href="/"
            className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-yuta-ink/60 hover:text-yuta-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour admin
          </Link>
          <h1 className="text-3xl font-black tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-yuta-ink/55">{description}</p>
          )}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  );
}
