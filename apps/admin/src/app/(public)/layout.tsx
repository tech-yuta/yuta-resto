import { IconTile } from '@yuta/ui';
import type { ReactNode } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4">
      <div className="mb-8 flex items-center gap-3">
        <IconTile tone="brand" size="sm">
          <span className="text-sm font-black">Y</span>
        </IconTile>
        <span className="text-lg font-bold tracking-tight text-primary">YuTa Admin</span>
      </div>
      {children}
    </div>
  );
}
