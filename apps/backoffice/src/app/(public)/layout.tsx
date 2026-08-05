import { YutaBrandMark } from '@yuta/ui';
import type { ReactNode } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-selected">
          <YutaBrandMark showName={false} iconClassName="h-8 w-8" />
        </div>
        <span className="text-lg font-bold tracking-tight text-primary">
          Espace restaurateur YUTA
        </span>
      </div>
      {children}
    </div>
  );
}
