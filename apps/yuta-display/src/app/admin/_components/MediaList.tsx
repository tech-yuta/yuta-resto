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
        <p className="py-12 text-center text-yuta-ink/50">{uiText.noMedia}</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-yuta-line bg-yuta-mist">
              <th className="px-4 py-3 text-left font-medium text-yuta-ink">{uiText.preview}</th>
              <th className="px-4 py-3 text-left font-medium text-yuta-ink">{uiText.title}</th>
              <th className="px-4 py-3 text-left font-medium text-yuta-ink">{uiText.type}</th>
              <th className="px-4 py-3 text-left font-medium text-yuta-ink">{uiText.duration}</th>
              <th className="px-4 py-3 text-left font-medium text-yuta-ink">{uiText.sortOrder}</th>
              <th className="px-4 py-3 text-left font-medium text-yuta-ink">{uiText.status}</th>
              <th className="px-4 py-3 text-left font-medium text-yuta-ink">{uiText.actions}</th>
            </tr>
          </thead>
          <tbody>
            {media.map((item, i) => (
              <tr
                key={item.id}
                className={`border-b border-yuta-line last:border-0 ${
                  i % 2 === 0 ? 'bg-white' : 'bg-yuta-paper'
                }`}
              >
                <td className="px-4 py-3">
                  <MediaPreview item={item} />
                </td>
                <td className="px-4 py-3 text-yuta-ink">
                  {item.title ?? <span className="text-yuta-ink/40">—</span>}
                </td>
                <td className="px-4 py-3 text-yuta-ink">
                  {item.type === 'image' ? uiText.image : uiText.video}
                </td>
                <td className="px-4 py-3 text-yuta-ink">
                  {item.type === 'image' ? `${item.duration} s` : <span className="text-yuta-ink/40">—</span>}
                </td>
                <td className="px-4 py-3 text-yuta-ink">{item.sortOrder}</td>
                <td className="px-4 py-3">
                  <Badge variant={item.isActive ? 'active' : 'inactive'}>
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
