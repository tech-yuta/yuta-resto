'use client';

import type { DisplayMedia } from '../../../types/display-media';
import { uiText } from '../../../constants/ui-text';
import { Card, Badge } from '@yuta/ui';
import { MediaPreview } from './MediaPreview';
import { MediaActions } from './MediaActions';

type MediaListProps = {
  media: DisplayMedia[];
  onRefresh: () => Promise<void>;
};

export function MediaList({ media, onRefresh }: MediaListProps) {
  if (media.length === 0) {
    return (
      <Card>
        <p className="py-12 text-center text-primary/50">{uiText.noMedia}</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default bg-surface-muted">
              <th className="px-4 py-3 text-left font-medium text-primary">{uiText.preview}</th>
              <th className="px-4 py-3 text-left font-medium text-primary">{uiText.title}</th>
              <th className="px-4 py-3 text-left font-medium text-primary">{uiText.type}</th>
              <th className="px-4 py-3 text-left font-medium text-primary">{uiText.duration}</th>
              <th className="px-4 py-3 text-left font-medium text-primary">{uiText.sortOrder}</th>
              <th className="px-4 py-3 text-left font-medium text-primary">{uiText.status}</th>
              <th className="px-4 py-3 text-left font-medium text-primary">{uiText.actions}</th>
            </tr>
          </thead>
          <tbody>
            {media.map((item, i) => (
              <tr
                key={item.id}
                className={`border-b border-border-default last:border-0 ${
                  i % 2 === 0 ? 'bg-white' : 'bg-canvas'
                }`}
              >
                <td className="px-4 py-3">
                  <MediaPreview item={item} />
                </td>
                <td className="px-4 py-3 text-primary">
                  {item.title ?? <span className="text-primary/40">—</span>}
                </td>
                <td className="px-4 py-3 text-primary">
                  {item.type === 'image' ? uiText.image : uiText.video}
                </td>
                <td className="px-4 py-3 text-primary">
                  {item.type === 'image' ? `${item.duration} s` : <span className="text-primary/40">—</span>}
                </td>
                <td className="px-4 py-3 text-primary">{item.sortOrder}</td>
                <td className="px-4 py-3">
                  <Badge tone={item.isActive ? 'success' : 'neutral'} variant="soft">
                    {item.isActive ? uiText.active : uiText.inactive}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <MediaActions item={item} onRefresh={onRefresh} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
