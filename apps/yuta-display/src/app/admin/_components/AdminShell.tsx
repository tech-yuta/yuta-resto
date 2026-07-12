'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { Button, Card } from '@yuta/ui';
import type { DisplayMedia } from '../../../types/display-media';
import { uiText } from '../../../constants/ui-text';
import { MediaForm } from './MediaForm';
import { MediaList } from './MediaList';

type AdminShellProps = {
  initialMedia: DisplayMedia[];
};

export function AdminShell({ initialMedia }: AdminShellProps) {
  const [media, setMedia] = useState<DisplayMedia[]>(initialMedia);
  const [showForm, setShowForm] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/display-media');
      const data: unknown = await res.json();
      if (Array.isArray(data)) setMedia(data as DisplayMedia[]);
    } catch {
      // Keep stale list on network failure
    }
  }, []);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="border-b border-border-default bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-lg font-semibold text-primary">Yuta Display</span>
            <span className="rounded-lg bg-surface-muted px-3 py-1 text-sm font-medium text-primary">
              {uiText.dashboard}
            </span>
          </div>
          <Link
            href="/display"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl bg-action-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-action-primary/80"
          >
            {uiText.openDisplay}
            <span aria-hidden>↗</span>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-primary">{uiText.media}</h1>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>{uiText.addMedia}</Button>
          )}
        </div>

        {/* Add-media form */}
        {showForm && (
          <Card>
            <h2 className="mb-4 text-base font-semibold text-primary">{uiText.addMedia}</h2>
            <MediaForm
              onSuccess={async () => {
                setShowForm(false);
                await refresh();
              }}
              onCancel={() => setShowForm(false)}
            />
          </Card>
        )}

        {/* Media table */}
        <MediaList media={media} onRefresh={refresh} />
      </main>
    </div>
  );
}
