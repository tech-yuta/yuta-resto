import { Badge } from '@yuta/ui';
import { AlertTriangle, Sparkles } from 'lucide-react';
import {
  sentimentLabels,
  sentimentTones,
  urgencyLabels,
  urgencyTone,
  type ReviewDetailRecord,
} from './reviews-model';

export function ReviewAnalysisSection({
  review,
}: {
  review: ReviewDetailRecord;
}) {
  return (
    <section className="border-t border-border-default p-4">
      <h2 className="flex items-center gap-2 font-bold text-brand-800">
        <Sparkles className="h-4 w-4" />
        Analyse
      </h2>
      <div className="mt-3 grid gap-3 rounded-lg bg-surface-muted p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted">Sentiment</p>
          <div className="mt-2">
            {review.sentiment ? (
              <Badge tone={sentimentTones[review.sentiment]}>
                {sentimentLabels[review.sentiment]}
              </Badge>
            ) : (
              <Badge>En attente</Badge>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted">Urgence</p>
          <div className="mt-2">
            {review.urgency ? (
              <Badge tone={urgencyTone(review.urgency)}>
                {urgencyLabels[review.urgency]}
              </Badge>
            ) : (
              <Badge>En attente</Badge>
            )}
          </div>
        </div>
        {review.analysis && (
          <div className="sm:col-span-2">
            <p className="text-xs text-muted">Résumé</p>
            <p className="mt-1 text-sm">{review.analysis.summary}</p>
            {review.analysis.topics.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {review.analysis.topics.map((topic) => (
                  <Badge key={topic} size="sm" variant="outline">
                    {topic}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {(review.urgency === 'HIGH' || review.urgency === 'CRITICAL') && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-status-danger bg-status-danger-soft p-3 text-sm text-status-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Une attention managériale est recommandée.
        </div>
      )}
    </section>
  );
}
