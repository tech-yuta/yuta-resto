import { Badge, Button, EmptyState, Panel } from '@yuta/ui';
import { MessageSquareText, Star } from 'lucide-react';
import Link from 'next/link';
import type { TodayReviewItem, TodaySection } from './today-data';
import { TodaySectionUnavailable } from './today-section-unavailable';

export function TodayReviewsPanel({
  section,
}: {
  section: TodaySection<{
    attentionCount: number;
    items: TodayReviewItem[];
  }>;
}) {
  return (
    <Panel
      title="Avis à traiter"
      action={
        <Button asChild variant="secondary" size="sm">
          <Link href="/visibilite-reputation/avis?sort=unanswered">
            Voir tout
          </Link>
        </Button>
      }
    >
      {section.state === 'ready' && section.data.items.length > 0 && (
        <div className="divide-y divide-border-default">
          {section.data.items.map((review) => (
            <ReviewRow key={review.id} review={review} />
          ))}
        </div>
      )}
      {section.state === 'ready' && section.data.items.length === 0 && (
        <EmptyState
          title="Avis à ouvrir dans la boîte de réception"
          description="Le compteur indique des avis sans réponse, mais aucun aperçu n’est disponible."
          className="min-h-48"
        />
      )}
      {section.state === 'empty' && (
        <EmptyState
          icon={<MessageSquareText className="mx-auto h-8 w-8" aria-hidden />}
          title="Aucun avis à traiter"
          description="Les nouveaux avis apparaîtront ici."
          className="min-h-48"
        />
      )}
      {section.state === 'unavailable' && <TodaySectionUnavailable />}
    </Panel>
  );
}

function ReviewRow({ review }: { review: TodayReviewItem }) {
  return (
    <Link
      href={`/visibilite-reputation/avis?selected=${review.id}`}
      className="block px-5 py-4 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Badge tone={review.source === 'GOOGLE' ? 'info' : 'brand'} size="sm">
            {review.source === 'GOOGLE' ? 'Google' : 'Retour direct'}
          </Badge>
          <span className="truncate text-sm font-semibold">
            {review.authorName}
          </span>
        </div>
        <span className="shrink-0 text-xs text-muted">
          {review.receivedLabel}
        </span>
      </div>
      {review.rating !== null && (
        <span
          className="mt-2 inline-flex items-center gap-1 text-xs font-bold"
          aria-label={`${review.rating} sur 5`}
        >
          {review.rating.toFixed(1)}
          <Star
            className="h-3.5 w-3.5 fill-status-rating text-status-rating"
            aria-hidden
          />
        </span>
      )}
      <p className="mt-2 line-clamp-2 text-sm leading-5 text-secondary">
        {review.excerpt}
      </p>
    </Link>
  );
}
