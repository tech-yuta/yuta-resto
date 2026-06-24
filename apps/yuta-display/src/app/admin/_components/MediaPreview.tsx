'use client';

import type { DisplayMedia } from '../../../types/display-media';

type MediaPreviewProps = {
  item: DisplayMedia;
};

export function MediaPreview({ item }: MediaPreviewProps) {
  if (item.type === 'video') {
    return (
      <video
        src={item.fileUrl}
        className="size-16 rounded-lg object-cover bg-yuta-ink/10"
        muted
        preload="metadata"
      />
    );
  }

  return (
    <img
      src={item.fileUrl}
      alt={item.title ?? ''}
      className="size-16 rounded-lg object-cover bg-yuta-mist"
      loading="lazy"
    />
  );
}
