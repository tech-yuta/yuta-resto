import { Badge, IconButton } from '@yuta/ui';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MoreHorizontal,
} from 'lucide-react';
import Image from 'next/image';
import {
  getCreationStatusTone,
  type RecentCreation,
} from './creative-studio-model';

export function RecentCreationCard({ creation }: { creation: RecentCreation }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border-default bg-surface">
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={creation.image}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 220px"
          className="object-cover"
        />
        <Badge
          tone={getCreationStatusTone(creation.status)}
          size="sm"
          className="absolute left-2 top-2"
        >
          {creation.status}
        </Badge>
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-bold">{creation.title}</p>
        <p className="mt-1 truncate text-xs text-muted">{creation.format}</p>
        <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-muted">
          <span className="flex min-w-0 items-center gap-1 truncate">
            {creation.status === 'Publié' ? (
              <CheckCircle2 className="h-3 w-3 text-status-success" />
            ) : creation.status === 'Planifiée' ? (
              <CalendarDays className="h-3 w-3" />
            ) : (
              <Clock3 className="h-3 w-3" />
            )}
            <span className="truncate">{creation.meta}</span>
          </span>
          <IconButton
            aria-label="Plus d'actions"
            variant="ghost"
            size="sm"
            disabled
          >
            <MoreHorizontal className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
