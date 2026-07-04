import { PageHeader } from '@yuta/ui';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

type PosHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
};

export function PosHeader({
  title,
  description,
  eyebrow,
  actions,
}: PosHeaderProps) {
  return (
    <PageHeader
      eyebrow={eyebrow}
      title={title}
      description={description}
      media={
        <Link
          href="/"
          aria-label="Retour aux commandes"
          className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-yuta-line bg-yuta-paper transition-colors hover:bg-yuta-mist"
        >
          <Image
            src="/images/logo.svg"
            alt="YuTa"
            width={40}
            height={40}
            priority
            className="h-10 w-10 object-contain"
          />
        </Link>
      }
      actions={actions}
    />
  );
}
