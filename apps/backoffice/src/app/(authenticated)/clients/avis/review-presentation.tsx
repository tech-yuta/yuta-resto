import type { FeedbackSource } from '@yuta/contracts/reputation';
import { cn } from '@yuta/ui';
import { Star } from 'lucide-react';

export function ReviewSourceMark({ source }: { source: FeedbackSource }) {
  return (
    <span
      className={cn(
        'grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black',
        source === 'GOOGLE'
          ? 'bg-status-info-soft text-status-info'
          : 'bg-surface-selected text-brand-800',
      )}
      aria-label={source === 'GOOGLE' ? 'Google' : 'Retour direct'}
    >
      {source === 'GOOGLE' ? 'G' : 'D'}
    </span>
  );
}

export function ReviewRating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold">
      {value.toFixed(1)}
      <Star className="h-3.5 w-3.5 fill-status-rating text-status-rating" />
    </span>
  );
}
