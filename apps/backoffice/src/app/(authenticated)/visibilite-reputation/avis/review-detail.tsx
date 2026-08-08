import type { AssignableReputationUser } from '@yuta/contracts/cloud-admin';
import { Avatar, Badge, Button, Card, IconButton } from '@yuta/ui';
import { ExternalLink, UserRound } from 'lucide-react';
import { ReviewAnalysisSection } from './review-analysis-section';
import { ReviewManagementForm } from './review-management-form';
import { ReviewNotesSection } from './review-notes-section';
import { ReviewRating, ReviewSourceMark } from './review-presentation';
import { ReviewReplyForm } from './review-reply-form';
import {
  formatRelativeDate,
  getInitials,
  statusLabels,
  statusTones,
  type ReviewDetailRecord,
  type ReviewsPageData,
} from './reviews-model';

export function ReviewDetail({
  review,
  assignableUsers,
  permissions,
}: {
  review: ReviewDetailRecord;
  assignableUsers: AssignableReputationUser[];
  permissions: ReviewsPageData['permissions'];
}) {
  return (
    <Card padding="none" className="overflow-hidden xl:sticky xl:top-0">
      <div className="flex items-center justify-between border-b border-border-default p-4">
        <div className="flex items-center gap-3">
          <ReviewSourceMark source={review.source} />
          <div>
            <p className="font-bold">
              {review.source === 'GOOGLE' ? 'Avis Google' : 'Retour direct'}
            </p>
            <p className="text-xs text-muted">
              {formatRelativeDate(review.receivedAt)}
            </p>
          </div>
        </div>
        {review.source === 'GOOGLE' && review.externalUrl && (
          <IconButton asChild variant="ghost" aria-label="Ouvrir sur Google">
            <a href={review.externalUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </IconButton>
        )}
      </div>

      <section className="p-4">
        <div className="rounded-lg border border-border-default p-4">
          <div className="flex items-center gap-3">
            <Avatar
              fallback={getInitials(review.authorName)}
              src={review.authorAvatarUrl}
            />
            <div className="flex-1">
              <p className="font-bold">
                {review.authorName ?? 'Client anonyme'}
              </p>
              {review.rating && <ReviewRating value={review.rating} />}
            </div>
            <Badge tone={statusTones[review.status]}>
              {statusLabels[review.status]}
            </Badge>
          </div>
          <p className="mt-4 text-sm leading-6">
            {review.content || 'Aucun commentaire.'}
          </p>
        </div>
      </section>

      <ReviewManagementForm
        review={review}
        assignableUsers={assignableUsers}
        canManageFeedback={permissions.canManageFeedback}
      />
      <ReviewAnalysisSection review={review} />
      {review.source === 'GOOGLE' && (
        <ReviewReplyForm
          review={review}
          canCreateReply={permissions.canCreateReply}
        />
      )}
      <ReviewNotesSection
        review={review}
        canCreateNote={permissions.canCreateNote}
      />

      {review.source === 'DIRECT' && (
        <section className="border-t border-border-default p-4">
          <Button variant="secondary" fullWidth disabled>
            <UserRound className="h-4 w-4" />
            Créer un incident
          </Button>
        </section>
      )}
    </Card>
  );
}
